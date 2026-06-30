---
title: Knowledge Base AST I/O
---

# Knowledge Base AST I/O

---

## 1. What Current Main Uses

The current `main` branch uses AST-based knowledge-base file loading.

On current main, file-based knowledge loading is centered on:

* `kele/knowledge_bases/ast_io.py`
* `kele/knowledge_bases/fact_base.py`
* `kele/knowledge_bases/rule_base.py`
* `kele/knowledge_bases/ontology_base.py`

In practice, that means:

* facts and rules are loaded from **YAML / YML / JSON** files through AST-shaped data
* ontologies are loaded from **Python modules** or **YAML / YML** files

---

## 2. Entry Points

### 1. FactBase / RuleBase

When `FactBase` or `RuleBase` receives a path, current main calls `load_knowledge_base(path)`.

Supported path inputs:

* one `.yaml`, `.yml`, or `.json` file
* one directory containing `.yaml`, `.yml`, or `.json` files

### 2. Ontology Loading

`load_ontologies(concept_dir_or_path, operator_dir_or_path)` currently supports:

* `.py` ontology modules
* `.yaml` / `.yml` ontology files

`InferenceEngine` still uses the same ontology parameter names:

```python
from kele.main import InferenceEngine

engine = InferenceEngine(
    facts="path/to/facts.yaml",
    rules="path/to/rules.yaml",
    concept_dir_or_path="path/to/concepts.yaml",
    operator_dir_or_path="path/to/operators.yaml",
)
```

---

## 3. Top-Level YAML / JSON Sections

The AST loader looks for these top-level sections:

* `Concepts`
* `Operators`
* `Facts`
* `Rules`

A single file may contain one or more of them.

---

## 4. Serialized Node Shapes

### 1. Concept entries

```yaml
Concepts:
  - id: C001
    name: Number
    comment: Number concept
    parent:
      - ComplexNumber
```

Accepted fields used by current main:

* `name`
* `parent` or `parents`
* `comment` or `description`

### 2. Operator entries

```yaml
Operators:
  - id: OP001
    symbol: Abs
    input_type:
      - ComplexNumber
    output_type: NonNegativeNumber
    comment: absolute value
```

Accepted fields used by current main:

* `symbol`
* `input_type`
* `output_type`
* `comment` or `description`

### 3. Term nodes

```yaml
type: constant
value: Alice
concepts:
  - Person
```

```yaml
type: variable
name: X
```

```yaml
type: compound
operator: Parent
arguments:
  - {type: constant, value: Alice, concepts: [Person]}
  - {type: constant, value: Bob, concepts: [Person]}
```

### 4. Assertion nodes

```yaml
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

### 5. Formula nodes

```yaml
type: formula
connective: AND
left:
  type: assertion
  lhs: {type: variable, name: X}
  rhs: {type: variable, name: X}
right:
  type: assertion
  lhs: {type: variable, name: Y}
  rhs: {type: variable, name: Y}
```

Supported connectives in current main:

* `AND`
* `OR`
* `NOT`
* `IMPLIES`
* `IFF`

The loader also accepts legacy `EQUAL` and maps it to `IFF`.

---

## 5. Minimal Examples

### 1. Concepts

```yaml
Concepts:
  - id: C001
    name: Number
```

### 2. Operators

```yaml
Operators:
  - id: OP001
    symbol: Abs
    input_type:
      - Number
    output_type: Number
```

### 3. Facts

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

### 4. Rules

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

---

## 6. Important Notes

* `FactBase` path loading accepts AST-style YAML / YML / JSON.
* `RuleBase` path loading follows the same AST loader.
* `load_ontologies(...)` currently wires `.py`, `.yaml`, and `.yml`; JSON ontology files are not yet wired through that entry point.
* Operator field `post_fixed` is currently ignored with a warning.
* AST load and dump APIs are explicitly marked in code as under active development.

---

## 7. How This Page Relates to the Other Docs

Recommended split:

* [syntax](./syntax): runtime Python objects
* [ontology_base](./ontology_base): ontology files on current main
* [fact_base](./fact_base): fact-file shape on current main
* [rule_base](./rule_base): rule-file shape on current main
* this page: the overall file-based AST I/O entry points and node structure
