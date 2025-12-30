---
title: Quick Start
layout: page
nav_order: 3
---

# Quick Start

After installation, run:

```markdown
python -m _examples.relationship --log_level RESULT
```

This section walks through the `relationship` example:

1. Problem & goal
2. Concept / Operator modeling
3. Assertions
4. Rules
5. QueryStructure
6. InferenceEngine

## 1. Problem & goal

Natural language statement:

> Given:
>
> * `Alice` is the parent of `Bob` (`parent(Alice, Bob) = True`)
> * `Bob` is the parent of `Carie` (`parent(Bob, Carie) = True`)
>
> Rule:
>
> * If `X` is the parent of `Y` and `Y` is the parent of `Z`, then `X` is the grandparent of `Z`.
>
> Question:
>
> * **Who is Alice the grandparent of?** (`grandparent(Alice, X) = True`)

Expected conclusion:

```text
grandparent(Alice, Carie) = True
```

## 2. Import core types and engine

```python
from al_inference_engine.syntax import (
    Constant,
    Variable,
    Concept,
    Operator,
    CompoundTerm,
    Assertion,
    Rule,
)
from al_inference_engine.main import InferenceEngine, QueryStructure
```

## 3. Concept and operator modeling

### 3.1 Concept modeling: `Person`

```python
Person = Concept("Person")
from al_inference_engine.knowledge_bases.builtin_base.builtin_concepts import BOOL_CONCEPT
```

### 3.2 Operator modeling: `parent` and `grandparent`

```python
parent_op = Operator(
    "parent",
    input_concepts=[Person, Person],
    output_concept=BOOL_CONCEPT
)

grandparent_op = Operator(
    "grandparent",
    input_concepts=[Person, Person],
    output_concept=BOOL_CONCEPT
)
```

Continue building compound terms and rules following the original example code.
