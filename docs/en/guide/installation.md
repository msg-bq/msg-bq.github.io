---
title: Installation
---

# Installation

## Option A: PyPI (after release)

You can grab the latest built wheel from GitHub Actions or install a published release directly.

```
pip install kele
```

## Option B: Build from source

Requirements: Python 3.13+; Rust toolchain (rustup); on Windows, MSVC (Visual Studio Build Tools).

```
git clone https://github.com/USTC-KnowledgeComputingLab/KELE
cd KELE
uv sync
uv run maturin develop --skip-install  # install rust and MSVC (Windows) beforehand
```

