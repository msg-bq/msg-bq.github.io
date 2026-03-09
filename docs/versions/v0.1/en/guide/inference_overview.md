---
title: Inference Overview
---

# Inference Overview

In KELE’s forward-chaining inference, the system starts from existing facts and automatically derives new facts. This process is split into two relatively independent but closely coordinated stages:

1. **Grounder: find candidate instantiations for variables in rules based on the current facts;**
2. **Executor: under concretely instantiated rules, check whether all premises hold, and produce new facts accordingly.**

Below is a brief explanation of these two stages.

---

## 1. Grounder: finding instantiation candidates for variables

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

## 2. Executor: checking rule premises and producing new facts

After obtaining the grounded rule set, the Executor performs the actual “inference checking”.

The Executor is responsible for:

1. For each grounded rule, checking whether each assertion is entailed by the current fact base;
2. If all premises (rule body) are true, adding the conclusion as a new fact to the fact base.

Using the same grounded rule as above:

```text
parent(Alice, Bob) = True  AND  parent(Bob, Carie) = True
    -> grandparent(Alice, Carie) = True
```

The Executor checks in order:

* Whether `parent(Alice, Bob) = True` can be entailed from the fact base
* Whether `parent(Bob, Carie) = True` can be entailed from the fact base

If both exist, the premises are entailed, and the Executor writes the conclusion:

```text
grandparent(Alice, Carie) = True
```

as a new fact into the fact base.

Conversely, if a grounded rule’s premises cannot be entailed, the rule is treated as not applicable in the current state, and the corresponding conclusion will not be added.

---

## 3. Forward-chaining inference as a loop

In practice, forward-chaining inference does not run for only one iteration; instead it repeats:

1. The Grounder instantiates rules using the current fact base;
2. The Executor checks grounded rules and adds newly derived facts;
3. If new facts are produced, grounding/executing can be repeated with the updated fact base.

This loop continues until no new facts are produced or the solving process terminates.
