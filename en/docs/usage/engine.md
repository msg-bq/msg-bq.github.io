---
title: Engine
parent: Usage
layout: page
nav_order: 2
---
# Build and run the inference engine

## 1. Workflow

1. Prepare facts and rules.
2. Create an `InferenceEngine`.
3. Build a `QueryStructure`.
4. Run inference and inspect logs.

## 2. Prepare facts and rules

`InferenceEngine` can load knowledge in two ways:

1. Pass Python lists (facts / rules).
2. Pass a directory or file path to let `FactBase` / `RuleBase` load them.

```python
from kele.main import InferenceEngine

fact1 = ...
rule1 = ...

engine = InferenceEngine(
    fact_base=[fact1],
    rule_base=[rule1],
)
```

For configuration options such as `interactive_query_mode` and `trace`, see [Config]({% link docs/usage/config.md %}).

For customizing selection modules, see [Custom Modules]({% link docs/custom_module.md %}).
