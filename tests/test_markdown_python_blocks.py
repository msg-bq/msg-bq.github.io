"""
用法：

1. 默认递归测试 docs/ 下所有包含 Python 代码块的 Markdown 页面（默认排除 docs/versions/ 下的历史版本文档）：
    uv run pytest tests/test_markdown_python_blocks.py

2. 只测试指定页面或目录：
    MARKDOWN_SNIPPET_FILES=docs/en/quick_start.md uv run pytest tests/test_markdown_python_blocks.py
    MARKDOWN_SNIPPET_FILES=docs/en,docs/zh/usage uv run pytest tests/test_markdown_python_blocks.py

3. 如果需要额外把 KELE 源码目录加入 sys.path：
    MARKDOWN_SNIPPET_SYS_PATH=../KELE uv run pytest tests/test_markdown_python_blocks.py

说明：
- 单个 Markdown 文件内的代码块会按顺序共享上下文执行，行为类似 notebook。
- 不同 Markdown 文件之间彼此隔离。
"""

import os
from multiprocessing import get_context
import sys
from dataclasses import dataclass
from pathlib import Path

import pytest


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DOC_ROOTS = [
    REPO_ROOT / "docs",
]
EXCLUDED_DOC_ROOTS = [
    REPO_ROOT / "docs/versions",
]
# 只把 python/py fenced code block 当作可执行 snippet。
PYTHON_INFO_STRINGS = {"python", "py"}

@dataclass
class CodeBlock:
    path: Path
    start_line: int
    code: str


def extract_python_blocks(path: Path) -> list[CodeBlock]:
    blocks: list[CodeBlock] = []
    lines = path.read_text(encoding="utf-8").splitlines()
    in_block = False
    current_lines: list[str] = []
    start_line = 0

    for line_number, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not in_block:
            if not stripped.startswith("```"):
                continue
            info = stripped[3:].strip().split()
            if not info or info[0] not in PYTHON_INFO_STRINGS:
                continue
            # 记录代码正文第一行，失败时可以直接跳到文档中的对应位置。
            in_block = True
            current_lines = []
            start_line = line_number + 1
            continue

        if stripped == "```":
            code = "\n".join(current_lines).strip()
            if code:
                blocks.append(CodeBlock(path=path, start_line=start_line, code=code))
            in_block = False
            current_lines = []
            start_line = 0
            continue

        current_lines.append(line)

    return blocks


def collect_markdown_files(paths: list[Path]) -> list[Path]:
    files: list[Path] = []
    for path in paths:
        if path.is_file() and path.suffix == ".md":
            if any(excluded in path.parents for excluded in EXCLUDED_DOC_ROOTS):
                continue
            files.append(path)
        elif path.is_dir():
            # 递归收集目录下的所有 Markdown 页面。
            files.extend(
                sorted(
                    candidate
                    for candidate in path.rglob("*.md")
                    if not any(excluded in candidate.parents for excluded in EXCLUDED_DOC_ROOTS)
                )
            )
    return files


def get_snippet_targets() -> list[Path]:
    raw = os.environ.get("MARKDOWN_SNIPPET_FILES")
    if not raw:
        candidates = collect_markdown_files(DEFAULT_DOC_ROOTS)
    else:
        selected = [REPO_ROOT / item.strip() for item in raw.split(",") if item.strip()]
        candidates = collect_markdown_files(selected)

    # 只为真正包含 Python 代码块的页面生成测试用例。
    return [path for path in candidates if extract_python_blocks(path)]


def prepend_extra_sys_paths() -> list[str]:
    extra_paths: list[str] = []
    raw = os.environ.get("MARKDOWN_SNIPPET_SYS_PATH", "")
    for item in raw.split(os.pathsep):
        item = item.strip()
        if not item:
            continue
        # 允许通过环境变量把 KELE 源码目录临时加到 sys.path 中。
        resolved = (
            str((REPO_ROOT / item).resolve()) if not Path(item).is_absolute() else item
        )
        if resolved not in sys.path:
            sys.path.insert(0, resolved)
            extra_paths.append(resolved)
    return extra_paths


def execute_markdown_blocks_in_child(
    doc_path_str: str,
    extra_paths: list[str],
    result_queue,
) -> None:
    doc_path = Path(doc_path_str)
    original_sys_path = list(sys.path)
    try:
        for resolved in reversed(extra_paths):
            if resolved not in sys.path:
                sys.path.insert(0, resolved)

        blocks = extract_python_blocks(doc_path)
        namespace = {"__name__": "__markdown_snippets__"}
        for index, block in enumerate(blocks, start=1):
            code = compile(block.code, f"{block.path}:{block.start_line}", "exec")
            try:
                exec(code, namespace, namespace)
            except Exception as exc:
                result_queue.put(
                    (
                        False,
                        f"Block {index}/{len(blocks)} failed in {block.path}:{block.start_line}\n"
                        f"{exc.__class__.__name__}: {exc}",
                    )
                )
                return

        result_queue.put((True, ""))
    finally:
        sys.path[:] = original_sys_path


@pytest.mark.parametrize("doc_path", get_snippet_targets(), ids=lambda path: path.name)
def test_markdown_python_blocks_execute(doc_path: Path) -> None:
    assert doc_path.exists(), f"Markdown file not found: {doc_path}"

    blocks = extract_python_blocks(doc_path)
    assert blocks, f"No python code blocks found in {doc_path}"

    extra_paths = prepend_extra_sys_paths()
    ctx = get_context("spawn")
    result_queue = ctx.Queue()
    process = ctx.Process(
        target=execute_markdown_blocks_in_child,
        args=(str(doc_path), extra_paths, result_queue),
    )
    process.start()
    process.join()

    if process.exitcode != 0 and result_queue.empty():
        pytest.fail(f"Markdown snippet child process exited abnormally for {doc_path}")

    success, message = result_queue.get()
    if not success:
        pytest.fail(message)
