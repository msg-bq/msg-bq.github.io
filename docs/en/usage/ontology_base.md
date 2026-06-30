---
title: Ontology Base
---

# Ontology Base

---

The ontology base contains Concepts and Operators. Concepts describe the kinds of objects that exist in a domain, and Operators describe relations or computations over those concepts.

---

## Examples

### 1. Mathematical Example

**Concepts**:

* `Real`
* `Point`
* `Degree`

**Operators**:

* `Line_length(Point, Point) -> Real`
* `Angle_degree(Point, Point, Point) -> Degree`

### 2. Kinship Example

**Concepts**:

* `Person`

**Operators**:

* `parent(Person, Person) -> Bool`
* `grandparent(Person, Person) -> Bool`

---

## File Forms on Current Main

Current `main` supports two ontology-loading styles:

* Python modules
* YAML / YML files

`InferenceEngine` still receives them through:

* `concept_dir_or_path`
* `operator_dir_or_path`

### 1. YAML Concept Entries

```yaml
Concepts:
  - id: C001
    name: Person
    comment: person concept
  - id: C002
    name: Student
    parent:
      - Person
```

Current main uses these fields:

* `name`
* `parent` or `parents`
* `comment` or `description`

### 2. YAML Operator Entries

```yaml
Operators:
  - id: OP001
    symbol: Parent
    input_type:
      - Person
      - Person
    output_type: Bool
    comment: parent relation
```

Current main uses these fields:

* `symbol`
* `input_type`
* `output_type`
* `comment` or `description`

### 3. Python Ontology Modules

You can also keep ontology definitions in Python files and load them through `load_ontologies(...)`.

That is still the default style used by built-in ontology definitions on current main.

---

## Alignment With Facts and Rules

Concept and operator names defined in ontology files should be reused consistently in fact and rule files.

For example, after defining:

```yaml
Concepts:
  - id: C001
    name: Person
Operators:
  - id: OP001
    symbol: Parent
    input_type:
      - Person
      - Person
    output_type: Bool
  - id: OP002
    symbol: Grandparent
    input_type:
      - Person
      - Person
    output_type: Bool
```

your fact / rule AST nodes can reuse `Parent`, `Grandparent`, and `Person` directly.

In practice:

* define concept hierarchy before operators that depend on it
* keep one ontology entry per YAML list item
* reuse exact concept / operator names across ontology, facts, and rules
* remember that `load_ontologies(...)` currently wires `.py`, `.yaml`, and `.yml` directly; JSON ontology files are not yet wired through that path
