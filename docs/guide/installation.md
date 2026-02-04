---
title: 安装
---

# 安装

## 方式 A：PyPI（发布后）

你可以从 GitHub Actions 获取最新构建的 wheel，或直接安装已发布版本。

```
pip install kele
```

## 方式 B：从源码构建

要求：Python 3.13+；Rust toolchain（rustup）；Windows 需 MSVC（Visual Studio Build Tools）。

```
git clone https://github.com/USTC-KnowledgeComputingLab/KELE
cd KELE
uv sync
uv run maturin develop --skip-install  # Windows 请提前安装 rust 与 MSVC
```

