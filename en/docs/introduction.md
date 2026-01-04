---
title: Introduction
layout: page
nav_order: 2
---

# Introduction

## Why choose KELE?

1. Supports user-defined executable operators (operators are a concept in assertion logic; for ease of understanding, they can be analogized to functions in first-order logic. Executable operators can be analogized to meta-predicates in Prolog);

2. Naturally supports term-level fact storage and reasoning;

3. Supports equality axioms;

4. Allows building nested composite terms among operators.



## Installation



### Install via pip

WIP

### Install and configure from source

If you want to run the project locally from source, first clone the repository and install dependencies via Poetry or uv:

```

git clone https://github.com/USTC-KnowledgeComputingLab/KELE.git
poetry install  # uv sync
eval $(poetry env activate)  # or Invoke-Expression (poetry env activate) or poetry shell ...

```

For more complete instructions on activating the Poetry environment, see [Poetry-Activating the environment](https://python-poetry.org/docs/managing-environments/#powershell)。


## Usage

### Install via pip

```python
import kele
```

### Install and configure from source

To use kele in your program, you need to add the project root directory to the Python path.

You can do this by adding the following code in your program:

```python
import sys
sys.path.append('/path/to/kele')

import kele
```

## Examples

See the py files under the [_examples](https://github.com/msg-bq/msg-bq.github.io/tree/main/_examples) folder and the explanation in the [Quick Start]({% link docs/quick_start.md %}) section.

## Overview of the inference process

In KELE’s forward-chaining inference, the system starts from existing facts and automatically derives new facts. This process is split into two relatively independent but closely coordinated stages:

1. **Grounder: find candidate instantiations for variables in rules based on the current facts;**
2. **Executor: under concretely instantiated rules, check whether all premises hold, and produce new facts accordingly.**

Below is a brief explanation of these two stages.

---

### 1. Grounder: finding instantiation candidates for variables

In rules, we usually use variables to denote “any object that satisfies the domain constraints”. For example:

```text
parent(X, Y) = True  AND  parent(Y, Z) = True  ->  grandparent(X, Z) = True
```

Here `X, Y, Z` are variables, meaning “some object” / “some person”, rather than specific constants.
In contrast, the fact base stores already determined facts, e.g.:

```text
parent(Alice, Bob)   = True
parent(Bob,   Carie) = True
parent(Alice, Dave)  = True
```

The Grounder is responsible for:

1. Based on the given set of facts, computing all **possible variable substitution sets** for each rule,
2. Applying these substitutions to the rule to generate **instantiated rules** (grounded rules) that contain only constants.

For example, given the facts above, the Grounder may produce substitutions such as:

* One substitution: `X = Alice, Y = Bob, Z = Carie`
* Another substitution: `X = Alice, Y = Bob, Z = Dave`
* As well as other non-matching combinations.

For each substitution, the Grounder replaces variables with the corresponding constants and obtains a concrete instantiated rule, e.g.:

```text
parent(Alice, Bob) = True  AND  parent(Bob, Carie) = True
    -> grandparent(Alice, Carie) = True
```

After instantiating all rules under their respective substitution sets, we obtain the full set of grounded rules.

You can think of the Grounder as an **enumeration stage**:
it does not decide whether these instantiated rules are “actually true”; instead, it first enumerates “all concrete cases that could potentially hold” to prepare for the next execution step.

---

### 2. Executor: checking rule premises and producing new facts

After obtaining the grounded rule set, the Executor performs the actual “inference checking”.

The Executor is responsible for:

1. For each grounded rule, checking whether each assertion in the rule is entailed by the current fact base;
2. If all premises (the rule body) are true, then adding the conclusion as a new fact to the fact base.

Using the instantiated rule above as an example:

```text
parent(Alice, Bob) = True  AND  parent(Bob, Carie) = True
    -> grandparent(Alice, Carie) = True
```

The Executor will check in order:

* Whether the fact base entails `parent(Alice, Bob) = True`
* Whether the fact base entails `parent(Bob, Carie) = True`

If both exist, then the premises `parent(Alice, Bob) = True  AND  parent(Bob, Carie) = True` are entailed, and the Executor will write the conclusion:

```text
grandparent(Alice, Carie) = True
```

as a new fact into the fact base.

Conversely, for a grounded rule that cannot be entailed, the rule is considered not satisfied in the current state, and its conclusion will not be added to the fact base.

---

### 3. How the two stages work together in forward chaining

In practice, forward chaining does not run for only one round (hereafter called an iteration), but loops multiple times:

1. The Grounder instantiates the rule set using the current fact base;
2. The Executor checks these grounded rules and adds new facts to the fact base;
3. If new facts are produced, Grounding and Executing can be run again based on the updated fact base.

This loop continues until no new facts are produced or the solving process ends.

