---
title: Syntax
---

# Syntax

---

## I. Core Syntax and Basic Concepts

This section introduces the engine’s foundational syntax units: `Constant`, `Concept`, `Variable`, `Operator`, `CompoundTerm`, `Assertion`, `Formula`, `Rule`, and `ConflictRule`.

### 1. Constant

A **constant** represents a specific individual entity. It **must belong to at least one given concept (Concept)** and is an indivisible basic unit.

Code form:

```python
from kele.syntax import Constant

constant_1 = Constant('constant_1', concept_1)
# Declare a constant named constant_1 that belongs to concept_1
```

String form:

```markdown
WIP
```

Description field:

`Constant(..., description="...")` is supported.  
See [Description behavior across syntax levels](#description-behavior-across-syntax-levels).

---

### 2. Concept

A **concept** is a set of constants or concepts that share some common property.

Code form:

```python
from kele.syntax import Concept

concept_1 = Concept('concept_1')  # Declare a concept named concept_1
```

String form:

```markdown
WIP
```

Description field:

`Concept(..., description="...")` is supported.  
See [Description behavior across syntax levels](#description-behavior-across-syntax-levels).

#### 2.1 Registering Subsumption (Subset) Relations

In real problems, concepts often form hierarchies, e.g. `int ⊆ real`, `rational ⊆ real`. If an operator parameter expects `real`, passing an `int` should be treated as **type-compatible**.

1. **Single relation**:
   Maintained by a function on the `Concept` class

```python
Concept.add_subsumption("int", "real")
```

2. **Batch list**:
   A wrapper around `add_subsumption`

```python
add_subsumptions([
    ("int", "real"),
    ("rational", "real"),
])
```

3. **Mapping (child -> list of parents)**:
   A wrapper around `add_subsumption`

```python
add_subsumptions_from_mapping({
    "int": ["real"],
    "rational": ["real"],
})
```

4. **String DSL** (supports `⊆` and `<=`; separators: comma / semicolon / newline):
   A wrapper around `add_subsumption`

```python
add_subsumptions_from_string("""
    int ⊆ real, rational <= real;
    positive_int <= int
""")
```

5. **Specify parent concepts at construction time**:

```python
Concept("int", parents=["real"])
```

6. **Chain-style setting of parent concepts**:

```python
Concept("int").set_parents(["real"])
```

::: tip
All of the above approaches can be mixed. Duplicate declarations are automatically de-duplicated.
:::

**Example: registering subsumption relations**

```python
Real = Concept("real")
Int = Concept("int", parents=["real"])
PosInt = Concept("positive_int", parents=["int"])

to_real = Operator("to_real", input_concepts=["int"], output_concept="real")

# Expects int; passing positive_int is also OK (since positive_int ⊆ int)
t1 = CompoundTerm("to_real", [Constant(5, "positive_int")])  # OK

t2 = CompoundTerm("to_real", [Constant(5, "real")])  # Raises an exception

register_concept_relations("int ⊆ real")

# Attempting to register a reverse edge will raise an error
try:
    Concept.add_subsumption("real", "int")
except ValueError as e:
    print("Prevented mutual subsumption:", e)
```

---

### 3. Variable

A **variable** is a placeholder in logical expressions, used to refer to unknown or yet-to-be-determined objects. Variables are allowed only in rules and queries and **must not appear in facts stored in the FactBase**.

Code form:

```python
from kele.syntax import Variable

variable_1 = Variable('variable_1')  # Declare a variable named variable_1
```

::: tip
Tip: Variables with the same name are considered equal (hashed/compared by `name`), even if they are different object instances.
:::

String form:

```markdown
WIP
```

Description field:

`Variable` does not provide a `description` field.

---

### 4. Operator

An **operator** represents a relation or computation over constants and concepts. When defining an operator, you must specify:

* The list of input-parameter concepts: `input_concepts`
* The output concept: `output_concept` (restricted to exactly one)

Code form:

```python
from kele.syntax import Operator

operator_1 = Operator(
    'operator_1',
    input_concepts=[concept_1, concept_2],
    output_concept=concept_3
)
# Declare an operator named operator_1,
# with input concepts concept_1 and concept_2, and output concept concept_3
```

String form:

```markdown
WIP
```

Description field:

`Operator(..., description="...")` is supported.  
See [Description behavior across syntax levels](#description-behavior-across-syntax-levels).

#### 4.1 Action on Operator (Operators with External Implementations)

`Operator` can also take an `implement_func` argument to provide an **external implementation** (hereafter “executable operator”). In that case, the operator’s output is computed by `implement_func` and does not need to be explicitly stored in the FactBase.

Code form:

```python
from kele.syntax import Operator

def action_func(term):
    # term is a FlatCompoundTerm; read term.arguments and compute
    # Return value must be a TERM_TYPE (usually Constant or FlatCompoundTerm),
    # and must satisfy output_concept
    return result

action_op = Operator(
    name="action_op",
    input_concepts=[input_concept1, input_concept2],
    output_concept=output_concept,
    implement_func=action_func,
)
```

::: warning
For executable operators, the corresponding `CompoundTerm` currently must be a `FlatCompoundTerm` (introduced below). Full `CompoundTerm` support is not yet available and will be opened up in later versions.
:::

::: tip
If a `Rule` contains a `CompoundTerm` with an executable operator, then all `Variable`s in that `CompoundTerm` must also appear in other `Assertion`s that **do not** contain executable operators.
:::

---

### 5. CompoundTerm

A **compound term** represents an operator applied to a list of arguments. The elements in the argument tuple can be:

* `Constant`
* `Variable`
* Other `CompoundTerm`s

Code form:

```python
from kele.syntax import CompoundTerm

compoundterm_1 = CompoundTerm(operator_1, [constant_1, variable_1])
# Compound term with operator_1 and arguments (constant_1, variable_1)

compoundterm_2 = CompoundTerm(operator_2, [compoundterm_1, constant_2])
# Requirement: operator_1's output concept == operator_2's first input concept
```

String form:

```markdown
WIP
```

Description field:

`CompoundTerm(..., description="...")` is supported.  
See [Description behavior across syntax levels](#description-behavior-across-syntax-levels).

::: tip
**Well-formedness requirement:** For a well-formed `CompoundTerm`, the concept of each argument (or the output concept of a nested compound term) must match the corresponding entry in the `Operator`’s `input_concepts`, position by position.
:::

---

### 5.1 FlatCompoundTerm (Atomic Compound Term)

An **atomic compound term** is a compound term whose arguments **do not contain any other `CompoundTerm`s**.

Code form:

```python
from kele.syntax import FlatCompoundTerm

atom_compoundterm_1 = FlatCompoundTerm(operator_1, [constant_1, variable_1])
# Atomic compound term with operator_1 and arguments (constant_1, variable_1)
```

String form:

```markdown
WIP
```

Description field:

`FlatCompoundTerm(..., description="...")` is supported.  
See [Description behavior across syntax levels](#description-behavior-across-syntax-levels).

Usually you do not need to manually create `FlatCompoundTerm`; the engine will automatically convert a `CompoundTerm` to a `FlatCompoundTerm` when conditions are met.

---

### 6. Assertion

An **assertion** is the basic unit of knowledge, stating that “the left-hand side and the right-hand side refer to the same object/value”.

Code form:

```python
from kele.syntax import Assertion

assertion_1 = Assertion(compoundterm_1, compoundterm_2)
# Assert that compoundterm_1 equals compoundterm_2
```

String form:

```markdown
WIP
```

Description field:

`Assertion(..., description="...")` is supported.  
See [Description behavior across syntax levels](#description-behavior-across-syntax-levels).

---

### 7. Formula

A **formula** is composed of one or more `Assertion`s connected by logical connectives. Supported connectives include:

* `'AND'`
* `'OR'`
* `'NOT'`
* `'IMPLIES'`
* `'IFF'`

Legacy `'EQUAL'` input is still accepted for compatibility, but it is deprecated.

::: tip
**Boolean usage:** `Assertion` and `Formula` are symbolic objects and cannot be used as Python booleans. Their `__bool__` method raises `TypeError` to avoid confusing Python truthiness (e.g., “non-empty is `True`”) with the logical truth of an assertion/formula. Always evaluate them explicitly in the engine instead.
:::

Code form:

```python
from kele.syntax import Formula

formula_1 = Formula(assertion_1, 'AND', assertion_2)
# Represents: assertion_1 AND assertion_2

formula_2 = Formula(formula_1, 'OR', assertion_3)
# Represents: (assertion_1 AND assertion_2) OR assertion_3
```

String form:

```markdown
WIP
```

Description field:

`Formula(..., description="...")` is supported.  
See [Description behavior across syntax levels](#description-behavior-across-syntax-levels).

---

### 8. Rule

A **rule** consists of a condition formula (body) and a conclusion formula or assertion (head). The inference engine derives new facts from known facts using rules. You can set a rule priority (`priority`) to control execution order.

Code form:

```python
from kele.syntax import Rule

rule_1 = Rule(assertion_3, formula_1)
# If formula_1 holds, then assertion_3 holds as well
# (Note: constructor argument order is head, body)
```

String form:

```markdown
WIP
```

::: tip
1. The constructor argument order for `Rule` is `Rule(head, body, ...)`. Using keyword arguments (`Rule(head=..., body=...)`) is recommended to avoid mistakes.
2. Variables are allowed in `CompoundTerm` / `Assertion` only inside `Rule`s. Facts in the FactBase must not contain variables.
3. Internally, the engine converts `Formula` in a rule into a clause list via DNF (conjunctions containing only `Assertion` and `NOT Assertion`) and splits it into multiple sub-rules; therefore `Formula` mainly serves as syntactic sugar and does not cover the full semantics of all logical connectives.
4. The rule head supports only **a single `Assertion`** or **a conjunction of `Assertion`s connected only by `AND`**.
:::

Description field:

`Rule(..., description="...")` is supported.  
See [Description behavior across syntax levels](#description-behavior-across-syntax-levels).

<a id="description-behavior-across-syntax-levels"></a>

### Description behavior across syntax levels

`description` is reader-facing text only. It does not change inference results.

Supported syntax structures:

* `Constant`, `Concept`, `Operator`
* `CompoundTerm`, `FlatCompoundTerm`
* `Assertion`, `Formula`
* `Rule`, `ConflictRule`

Default behavior:

1. If not provided, `description` defaults to `""`.
2. The engine does not auto-merge descriptions from child structures.

Priority when text is resolved:

1. Explicit constructor value: `description="..."`
2. Auto description function set by `set_description_handler(...)` (only on supported structures; see Section II)
3. Fallback empty string `""`

Name reuse behavior:

1. `Concept` and `Operator` are singletons by name. Recreating with empty `description` keeps the existing text; recreating with a different non-empty text raises an error.
2. `Constant` is not singleton. If multiple constants share the same symbol, name-based reading returns the latest recorded one.

---

## II. Special Syntax

Description-related syntax in this section:

* [Read description by name (Constant / Concept / Operator)](#description-kv)
* [Auto description function (term / assertion / formula / rule)](#description-auto-function)

### 1. Intro: Presence/Introduction Marker

`Intro(T)` is used to indicate whether an instance of a `CompoundTerm` appears in some assertion in the FactBase.

Code form:

```python
from kele.syntax import Intro, CompoundTerm

compoundterm_1 = CompoundTerm(operator_1, [constant_1, variable_1])
I1 = Intro(compoundterm_1)

# I1 is true iff there exists an instance of the form
#   CompoundTerm(operator_1, [constant_1, any_constant])
# that appears as a CompoundTerm in some Assertion in the FactBase
```

String form:

```markdown
WIP
```

---

### 2. ConflictRule: checking rule

`ConflictRule` is intended for checking tasks: once an undesired state is derived, the current inference run stops immediately.
It is commonly used in CI-style checks (for example, rule-consistency checks or forbidden-pattern checks).

Code form:

```python
from kele.syntax import ConflictRule

conflict_rule = ConflictRule(
    body=[
        Assertion(CompoundTerm(parent_op, [X, Y]), true_const),
        Assertion(CompoundTerm(parent_op, [Y, X]), true_const),
    ],
    name="no_mutual_parent",
)
```

You can use it together with normal rules:

```python
rules = [normal_rule_1, normal_rule_2, conflict_rule]
```

Runtime behavior:

1. When `ConflictRule.body` is derived, the engine returns `InferenceStatus.CONFLICT_DETECTED` and terminates.
2. The termination reason is available in `EngineRunResult.conflict_reason` (including `rule_name`, `rule_body`, and `evidence`).

Description field:

`ConflictRule(..., description="...")` is supported.

---

<a id="description-kv"></a>

### 3. Read description by name (Constant / Concept / Operator)

For `Constant`, `Concept`, and `Operator`, you can read description text by name.

How to use:

1. Create the engine with `enable_description_registry=True`.
2. Define `description` when creating `Concept`, `Operator`, and `Constant`.
3. Call `engine.get_description_by_key(...)`.

```python
from kele.main import InferenceEngine
from kele.syntax import Concept, Operator, Constant
from kele.knowledge_bases.builtin_base.builtin_concepts import BOOL_CONCEPT

engine = InferenceEngine(facts=[], rules=[], enable_description_registry=True)

person = Concept("Person", description="All person entities")
parent = Operator("parent", [person, person], BOOL_CONCEPT, description="Parent relation")
alice = Constant("Alice", person, description="Sample person")

engine.get_description_by_key("Person")  # "All person entities"
engine.get_description_by_key("parent")  # "Parent relation"
engine.get_description_by_key("Alice")   # "Sample person"
```

If one name is used in multiple categories, specify `registry_type`:

```python
engine.get_description_by_key("Person", registry_type="concept")
# registry_type can be: "constant" | "concept" | "operator"
```

<a id="description-auto-function"></a>

### 4. Auto description function (term / assertion / formula / rule)

Some syntax structures can auto-generate `description` when you do not pass `description="..."`.

Supported structures:

* `CompoundTerm` / `FlatCompoundTerm`
* `Assertion`
* `Formula`
* `Rule` (and `ConflictRule`, via `Rule`)

You set it with `set_description_handler(...)`:

```python
from kele.syntax import CompoundTerm, Concept, Constant, Operator
from kele.syntax.mixins import SupportsDescription

concept = Concept("Thing", description="A concept for demo")
operator = Operator("tag", [concept], concept, description="Tag operator")
constant = Constant("Alice", concept, description="A sample constant")

def auto_desc(obj: SupportsDescription) -> str:
    if isinstance(obj, CompoundTerm):
        return f"custom:{obj.operator.name}"
    return "custom"

CompoundTerm.set_description_handler(auto_desc)

term_1 = CompoundTerm(operator, [constant])  # no explicit description
term_2 = CompoundTerm(operator, [constant], description="Manual text")

term_1.description  # "custom:tag"
term_2.description  # "Manual text" (explicit text wins)

CompoundTerm.set_description_handler(None)  # reset
```

`Constant`, `Concept`, and `Operator` do not use this auto function; they use the constructor text directly.

---

### 5. QueryStructure

`QueryStructure` specifies a query problem for the inference engine. You need to provide:

* `premises`: a list of premise facts
* `question`: a list of formulas or assertions to be solved; multiple formulas/assertions are treated as a conjunction (i.e., they must all hold)

Code form:

```python
from kele.main import QueryStructure

querystructure_1 = QueryStructure(
    premises=fact_list,      # A list containing multiple Facts
    question=formula_2       # The question to solve
)
```

String form:

```markdown
WIP
```

---

## III. Built-in Syntax and Built-in Operators

### 1. Built-in Concepts

Several built-in concepts are defined in `kele.knowledge_bases.builtin_base.builtin_concepts`:

1. **`FREEVARANY`**: a placeholder concept. It should not be used in external APIs and is compatible with any Concept.

   ::: danger
   Defining a custom `"FREEVARANY"` concept will be rejected. Do not force-define it, or you may break placeholder behavior.
   :::

2. **`BOOL_CONCEPT`**: the Boolean concept.
   All Boolean values should belong to this concept and use the preset `true_const` and `false_const`.

3. **`COMPLEX_NUMBER_CONCEPT`**: the complex-number concept.

4. **`EQUATION_CONCEPT`**: the arithmetic-equation concept.

### 2. Built-in Constants

* `true_const`: represents `True`
* `false_const`: represents `False`

### 3. Built-in Operators

The following arithmetic-related operators are provided in `kele.knowledge_bases.builtin_base.builtin_operators`. They all operate on complex numbers (belonging to `COMPLEX_NUMBER_CONCEPT`):

1. `arithmetic_plus_op`: addition
2. `arithmetic_minus_op`: subtraction
3. `arithmetic_times_op`: multiplication
4. `arithmetic_divide_op`: division
5. `arithmetic_negate_op`: negation
6. `arithmetic_equation_op`: arithmetic equality, producing values in `EQUATION_CONCEPT` (for example, it is the built-in operator behind expressions like `(1 + 2) = 3`)

Items 1-5 above are **executable operators**, and their results are computed by implementation functions. `arithmetic_equation_op` is the built-in equality operator for arithmetic expressions.

---

## IV. Safety

To ensure the inference engine runs correctly, rules and facts must satisfy the following safety constraints.

### 1. Fact Safety

An `Assertion` used as a Fact **must not contain `Variable`s** (including initial facts and the premise facts in `QueryStructure`).

### 2. Rule Safety

For unsafe rules, the engine will proactively add `Intro` (and raise a warning) to ensure smooth usage. However, this may slow execution; users are advised to understand this section and manually optimize rules. For readability by non-engine specialists, safety is defined below in a segmented (non-recursive) way.

0. Assign a boolean value T/F to each `Assertion` in a rule body. Consider all assignments that can make the body true. If an `Assertion` is true under all such assignments, call it a T-type `Assertion`.
1. Every `Variable` appearing in the rule should appear in some T-type `Assertion`.
2. Variables inside a `CompoundTerm` containing an executable operator must appear in at least one T-type `Assertion` that does **not** contain executable operators.
3. Any `CompoundTerm` containing an executable operator must be a `FlatCompoundTerm`.

#### Examples

* Safe rule example:

```text
r(X) = r(Y) AND h(X) = h(Y) -> g(X) = 1
```

* Unsafe example 1:

```text
r(X) = r(Y) OR h(Z) = h(Y) -> g(X) = 1
```

Reason: In the disjunctive branch `h(Z) = h(Y)`, the variable `X` in the head does not appear.

* Unsafe example 2:

```text
r(X) = r(Y) AND NOT(h(Z) = h(Y)) -> g(X) = 1
```

Reason: Variable `Z` appears only in a negated `Assertion` and does not appear in any non-negated `Assertion`.
