---
title: Quick Start
layout: page
nav_order: 3
---

# Quick Start

---

After installation is complete, run

```markdown
python _examples/relationship.py --log_level RESULT
```

Below we will provide a detailed analysis of the relationship example.

The explanation proceeds in the following order:

1. Problem and goal
2. Concept / Operator modeling (Concept / Operator)
3. Known facts (Assertion)
4. Rule modeling (Rule)
5. Constructing the query (QueryStructure)
6. Calling the inference engine (InferenceEngine)

---

## 1. Problem and goal

The natural language question is as follows:

> Given:
>
> * `Alice` is a parent of `Bob` (`parent(Alice, Bob) = True` is true)
> * `Bob` is a parent of `Carie` (`parent(Bob, Carie) = True` is true)
>
> Rules:
>
> * If `X` is a parent of `Y`, and `Y` is a parent of `Z`, then `X` is a grandparent of `Z`. (By transitive reasoning from two `parent(...) = True` assertions)
>
> Question:
>
> * **Whose grandparent is Alice?** (`grandparent(Alice, X) = True`)

Logically, we want to infer the conclusion:

```text
grandparent(Alice, Carie) = True
```

---

## 2. Import basic types and inference engine entry point

The example uses the following core types:

* `Concept`: a concept (type), such as `Person`.
* `Operator`: an operator, such as `parent` and `grandparent`.
* `Variable` / `Constant`: variables and constants.
* `CompoundTerm`: a compound term composed of an operator + arguments (e.g., `parent(Alice, Bob)`).
* `Assertion`: an assertion, in the form `t1 = t2`.
* `Rule`: a rule (head + body).
* `InferenceEngine`, `QueryStructure`: the inference engine and query structure.

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

---

## 3. Concept and operator modeling

### 3.1 Concept modeling: `Person`

In this example’s domain, there are only two object types: **people** and **boolean values**.
They are represented by two `Concept`s:

```python
# === Concept: Person (human) ===
Person = Concept("Person")
from al_inference_engine.knowledge_bases.builtin_base.builtin_concepts import BOOL_CONCEPT  # already built into the system
```

### 3.2 Operator modeling: `parent` and `grandparent`

We need two binary operators:

1. `parent(X, Y)`: X is a parent of Y. This operator is only used to represent a relationship, so the output is set to a boolean value.
2. `grandparent(X, Y)`: X is a grandparent of Y. This operator is only used to represent a relationship, so the output is set to a boolean value.

Both take two `Person` inputs and output `BOOL_CONCEPT`.

```python
# === Operators (Operator) ===
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

At this point, `parent_op` / `grandparent_op` are only operator names. You then construct terms via `CompoundTerm(operator, [args...])`, and further construct assertions from terms.

---

## 4. Constant and variable modeling

### 4.1 Variables: `X`, `Y`, `Z`

To generalize the rule to arbitrary people, we introduce three variables:

```python
# === Variables ===
X = Variable("X")
Y = Variable("Y")
Z = Variable("Z")
```

These variables appear in operator argument positions within rules, representing “any value that satisfies the concept constraints.”

### 4.2 Individual constants: `Alice`, `Bob`, `Carie`, `true_const`

Specific people are represented by `Constant`s with the concept `Person`:

```python
# === Individual constants (names) ===
alice = Constant("Alice", Person)
bob   = Constant("Bob", Person)
carie = Constant("Carie", Person)
from al_inference_engine.knowledge_bases.builtin_base.builtin_facts import true_const
```

---

## 5. Known facts (Assertion)

Natural language facts:

1. `parent(Alice, Bob) = True` is true
2. `parent(Bob, Carie) = True` is true

Logically, they are:

```text
parent(Alice, Bob) = true_const
parent(Bob, Carie) = true_const
```

In code, each fact is an `Assertion(t1, t2)`:

* `t1`: `CompoundTerm(parent_op, [alice, bob])`
* `t2`: `True` (i.e., `true_const`)

```python
# === Initial facts (Facts) ===
facts = [
    # parent(Alice, Bob) = true_const
    Assertion(
        CompoundTerm(parent_op, [alice, bob]),
        true_const
    ),

    # parent(Bob, Carie) = true_const
    Assertion(
        CompoundTerm(parent_op, [bob, carie]),
        true_const
    ),
]
```

In this way, facts are uniformly encoded in an explicit equality form `t1 = t2`.

---

## 6. Rule modeling (Rule + Formula)

### 6.1 From natural language to logical form

Rule content:

> If X is a parent of Y, and Y is a parent of Z, then X is a grandparent of Z.

Converted to a logical formula:

```text
parent(X, Y) = true_const, parent(Y, Z) = true_const
  → grandparent(X, Z) = true_const
```

### 6.2 Use `Assertion` to express premises (body)

The premises consist of two `Assertion`s:

```python
body = [
    Assertion(
        CompoundTerm(parent_op, [X, Y]),
        true_const
    ),
    Assertion(
        CompoundTerm(parent_op, [Y, Z]),
        true_const
    ),
]
```

### 6.3 Use `Assertion` to express the conclusion (head)

The conclusion is one `Assertion`:

```python
head = Assertion(
    CompoundTerm(grandparent_op, [X, Z]),
    true_const
)
```

### 6.4 Combine into a rule `Rule`

Wrap `head` and `body` into a rule object:

```python
# === Rule (Rule) ===
# parent(X, Y) = true_const ∧ parent(Y, Z) = true_const
#   → grandparent(X, Z) = true_const
R1 = Rule(
    head=head,
    body=body
)

rules = [R1]
```

At this point, one natural language rule has been fully encoded.

---

## 7. Constructing the query (QueryStructure)

The question in this example is:

> Whose grandparent is Alice?

Logically, it can be written as:

```text
grandparent(Alice, X) = true_const ?
```

That is, find which `X` makes the proposition `grandparent(Alice, X)` true.

Construct the corresponding `Assertion`:

```python
query_assertion = Assertion(
    CompoundTerm(grandparent_op, [alice, X]),
    true_const
)
```

Then wrap the facts and the query into `QueryStructure`:

```python
# === Query (Query) ===
query_question = QueryStructure(
    premises=facts,          # premises (facts) used in this query
    question=[query_assertion]  # proposition to ask: grandparent(Alice, X) = true_const ?
)
```

---

## 8. Calling the inference engine (InferenceEngine)

Finally, construct an inference engine instance and execute the query.

```python
# === Inference engine ===
inference_engine = InferenceEngine(
    facts=[],   # this example does not use global facts; all facts are placed in QueryStructure.premises
    rules=rules
)

result = inference_engine.infer_query(query_question)
print(result)
```

The inference process (conceptually) is:

1. Find two facts in the premises:

   * `parent(Alice, Bob) = true_const`
   * `parent(Bob, Carie) = true_const`
2. Using rule R1, match `X = Alice, Y = Bob, Z = Carie`, and derive:

   * `grandparent(Alice, Carie) = true_const`
3. When answering the query `grandparent(Alice, X) = true_const ?`, return the solution:

   * `X = Carie`.

---

## 9. Full example code

```python
from al_inference_engine.knowledge_bases.builtin_base.builtin_concepts import BOOL_CONCEPT
from al_inference_engine.syntax import (
    Constant,
    Variable,
    Concept,
    Operator,
    CompoundTerm,
    Assertion,
    Rule,
    Formula,
)
from al_inference_engine.main import InferenceEngine, QueryStructure

# === Concepts ===
Person = Concept("Person")

# === Boolean constant: true_const ===
true_const = Constant("true_const", BOOL_CONCEPT)

# === Operators (Operator) ===
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

# === Variables ===
X = Variable("X")
Y = Variable("Y")
Z = Variable("Z")

# === Individual constants (names) ===
alice = Constant("Alice", Person)
bob   = Constant("Bob", Person)
carie = Constant("Carie", Person)

# === Initial facts (Facts) ===
facts = [
    Assertion(
        CompoundTerm(parent_op, [alice, bob]),
        true_const
    ),
    Assertion(
        CompoundTerm(parent_op, [bob, carie]),
        true_const
    ),
]

# === Rule (Rule) ===
# parent(X, Y) = true_const ∧ parent(Y, Z) = true_const
#   → grandparent(X, Z) = true_const
R1 = Rule(
    head=Assertion(
        CompoundTerm(grandparent_op, [X, Z]),
        true_const
    ),
    body=Formula(
        Assertion(
            CompoundTerm(parent_op, [X, Y]),
            true_const
        ),
        "AND",
        Assertion(
            CompoundTerm(parent_op, [Y, Z]),
            true_const
        ),
    )
)

rules = [R1]

# === Query (Query) ===
query_question = QueryStructure(
    premises=facts,
    question=[
        Assertion(
            CompoundTerm(grandparent_op, [alice, X]),
            true_const
        )
    ]
)

# === Inference engine ===
inference_engine = InferenceEngine(
    facts=[],  # this example does not use global facts
    rules=rules
)

result = inference_engine.infer_query(query_question)
print(result)
```
