---
title: User-friendly syntax
parent: Usage
layout: page
nav_order: 11
---

# User-friendly syntax

---

## I. Abbreviations for the core syntax
This section introduces abbreviated ways to represent code in the core syntax.

### 1. Constant

A constant can use any instance that implements `__str__` and `__hash__`.

```python
from al_inference_engine.syntax import Constant, HashableAndStringable

class foo:
    def __str__(self) -> str:
     """Return the string representation of this object"""

    def __hash__(self) -> int:
        """Return the hash value of this object"""

    def __eq__(self, other: object) -> bool:
        """Whether this object is equal to another object"""
        
c = foo()

constant_1 = Constant(c, concept_1)  
# Any instance that implements __str__ and __hash__ can be automatically converted to str(instance)
# and passed in as a constant
````

---

### 2. Concept

Names still support `HashableAndStringable`. In addition, a `Concept` can be used directly by its name string, without needing to use its instance.

```python
from al_inference_engine.syntax import Concept, Constant

concept_1 = Concept('concept_1')  # Declare a concept named concept_1

constant_1 = Constant('constant_1', 'concept_1')  # Use the concept name 'concept_1' directly
```

> If the passed concept name has not been declared yet, the engine will automatically create that `Concept` and raise a warning.
> {: .note}

### 3. Variable

A **variable** can be created directly with `vf.x` or `vf['x']` (same name will still create different instances).

```python
from al_inference_engine.syntax import vf



variable_1 = vf.x  # or vf['x']
```

> Tip: each access to `vf.x` creates a new `Variable` object, but variables with the same name are equal when compared by `name` (so they can be used as the same placeholder).
> {: .note}

---

### 4. Operator

Names still support `HashableAndStringable`. Operators can also be indexed by name, but the corresponding `Operator` must be declared first (it will not be auto-created like `Concept`).

---

### 5. CompoundTerm

When indexing an operator by name, constants can be entered directly by their values without explicitly declaring concepts (by default, the concept of the value is the same as the input concept agreed upon by the operator).

```python
from al_inference_engine.syntax import CompoundTerm

compoundterm_1 = CompoundTerm('operator_1', ['constant_1', vf.variable_1])
# Compound term: operator is operator_1, arguments are (constant_1, variable_1)
```

> Notes:
>
> * `operator_1` must have been declared via `Operator(...)`; otherwise a `ValueError` will be raised.
> * Inputs such as `'constant_1'` that are not in engine syntax will be automatically wrapped as `Constant('constant_1', expected_concept)`, and a warning will be raised as a hint.
>   {: .note}

---

### 6. Assertion

If the right-hand side `rhs` of an `Assertion` is not specified, and the concept constraint at the corresponding `rhs` position is the built-in type `BOOL_CONCEPT`, then the built-in constant `true_const` is used on the right-hand side by default.

```python
from al_inference_engine.syntax import Operator, CompoundTerm, Assertion
from al_inference_engine.knowledge_bases.builtin_base.builtin_concepts import BOOL_CONCEPT
from al_inference_engine.knowledge_bases.builtin_base.builtin_facts import true_const

test_operator1 = Operator(name="test",
                          input_concepts=[BOOL_CONCEPT],
                          output_concept=BOOL_CONCEPT)

compoundterm_1 = CompoundTerm(operator=test_operator1,
                              arguments=[true_const])

assertion_1 = Assertion(compoundterm_1)
assertion_2 = Assertion(compoundterm_1, true_const)
# assertion_1 and assertion_2 are equivalent
```

---

### 7. Rule

A rule allows a `name` to be provided for quick locating. If it is not provided, the engine supplies a default name `rule_n`.

```python
from al_inference_engine.syntax import Rule

rule_1 = Rule(assertion_3, formula_1, name='test')
```

---

## II. Syntactic sugar

WIP

