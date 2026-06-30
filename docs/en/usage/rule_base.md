---
title: Rule Base
---

# Rule Base

---

## I. What It Is

Rule Base stores abstract rules used by the inference engine. At a high level, a rule says:

```text
under these conditions, derive this conclusion
```

Rules are usually relatively stable domain knowledge, unlike facts, which keep growing during one inference run.

---

## II. Input Methods

### 2.1 File Form on Current Main

On current `main`, path-based rule loading also goes through `load_knowledge_base(path)` in `kele/knowledge_bases/ast_io.py`.

Supported formats:

* `.yaml`
* `.yml`
* `.json`

A minimal YAML example is:

```yaml
Rules:
  - id: R001
    head:
      type: assertion
      lhs:
        type: compound
        operator: Grandparent
        arguments:
          - {type: variable, name: X}
          - {type: variable, name: Z}
      rhs:
        type: constant
        value: True
        concepts:
          - Bool
    body:
      - type: assertion
        lhs:
          type: compound
          operator: Parent
          arguments:
            - {type: variable, name: X}
            - {type: variable, name: Y}
        rhs:
          type: constant
          value: True
          concepts:
            - Bool
      - type: assertion
        lhs:
          type: compound
          operator: Parent
          arguments:
            - {type: variable, name: Y}
            - {type: variable, name: Z}
        rhs:
          type: constant
          value: True
          concepts:
            - Bool
    priority: 0
```

Notes:

* Current main uses AST-style YAML / JSON as the rule-file interface.
* `head` may be one assertion node or a list of assertion nodes.
* `body` may be one fact/formula node or a list of fact nodes.
* Formula nodes are AST-based as well.
* Rule names are commonly carried by `id` or `name`.

Rules can still be loaded from a file or directory path:

```python
from kele.main import InferenceEngine

engine = InferenceEngine(
    facts=[fact1, fact2],
    rules="path/to/rules.yaml",
    concept_dir_or_path="path/to/concepts.yaml",
    operator_dir_or_path="path/to/operators.yaml",
)
```

### 2.2 Python Code

In Python, rules are built with the `Rule` class.
