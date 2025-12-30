---
title: Introduction
layout: page
nav_order: 2
---

# Introduction

## Why KELE?

1. Supports user-defined executable operators.
2. Enables fact storage and inference at the term level.
3. Supports equality axioms.
4. Allows nested compound terms between operators.

## Installation

### Install with pip

WIP

### Install from source

If you want to run the project locally from source, clone the repository and install with poetry or uv:

```
git clone https://github.com/USTC-KnowledgeComputingLab/KELE
poetry install  # uv sync
eval $(poetry env activate)  # or Invoke-Expression (poetry env activate) or poetry shell ...
```

For more details on activating poetry environments, see [Poetry: Activating the environment](https://python-poetry.org/docs/managing-environments/#powershell).

## Usage

### Install with pip

```python
import al_inference_engine
```

### Install from source

To use `al_inference_engine` in your code, add the project root to your Python path:

```python
import sys
sys.path.append('/path/to/AL_inference_engine')

import al_inference_engine
```

## Examples

See the py files in [_examples](https://github.com/msg-bq/msg-bq.github.io/tree/main/_examples) and the [Quick Start]({% link docs/quick_start.md %}) section.

## Inference process overview

KELE uses forward chaining to derive new facts from existing ones. The process is split into two stages:

1. **Grounder:** find candidate bindings for variables in rules based on current facts.
2. **Executor:** evaluate instantiated rules and emit new facts.
