---
title: Fact Base
---

# Fact Base

---

## I. What It Is

Fact Base is the collection of known facts used during reasoning. It can contain:

* domain facts provided up front
* facts imported from external systems
* new facts derived while inference is running

In implementation, the current engine mainly distinguishes:

* `facts`: the full fact collection known to the engine
* `cur_facts`: the subset currently active for one inference run

---

## II. Input Methods

### 2.1 File Form on Current Main

On current `main`, path-based fact loading goes through `load_knowledge_base(path)` in `kele/knowledge_bases/ast_io.py`.

Supported formats:

* `.yaml`
* `.yml`
* `.json`

Supported path kinds:

* one file
* one directory containing supported files

The serialized fact content is AST-shaped. A minimal YAML example is:

```yaml
Facts:
  - FactID: F0001
    content:
      type: assertion
      lhs:
        type: compound
        operator: Parent
        arguments:
          - {type: constant, value: Alice, concepts: [Person]}
          - {type: constant, value: Bob, concepts: [Person]}
      rhs:
        type: constant
        value: True
        concepts:
          - Bool
```

Notes:

* Current main expects AST-style YAML / JSON.
* `Facts` entries are loaded from their `content` field.
* `content` must parse into an `Assertion`.
* `FactBase` still rejects free variables when storing facts, so practical fact files should remain ground facts.
* Extra metadata fields such as `FactID` or custom metadata can be stored in the file, but the runtime loader only depends on the AST content needed to build the syntax object.

You can also include `Concepts` and `Operators` in the same YAML / JSON file, because `load_knowledge_base(...)` reads those sections too.

If you load facts through the engine, the entry still looks like:

```python
from kele.main import InferenceEngine

engine = InferenceEngine(
    facts="path/to/facts.yaml",
    rules=[rule1, rule2],
    concept_dir_or_path="path/to/concepts.yaml",
    operator_dir_or_path="path/to/operators.yaml",
)
```

### 2.2 Python Code

Facts are usually written as `Assertion` objects in Python.
