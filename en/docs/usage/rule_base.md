---

title: Rule Base
parent: Usage
layout: page
nav_order: 8
---

# Rule Base 

---

## I. What It Is

Rule Base is used to store a set of **abstract rules**. Each rule has the form “**under what conditions, what conclusion can be derived**”, and is described in code by the `Rule` class:

```text
body (premise)  →  head (conclusion)
```

For example (analogy only, not actual syntax):

* If “a person is a student” and “this course is a required course”,
  then “this person must take this course”.

In this implementation:

* `RuleBase` uniformly receives the initial rule list;
* During initialization it uses `RuleSpliter (DNF converter)` to split compound rules into multiple sub-disjunctive rules, which facilitates subsequent reasoning.
* Variables in rules are automatically renamed internally (`_rename_rule_vars`) to avoid variable name conflicts across multiple rules.

These processes are **transparent** to first-time users; you only need to write the rules in advance and hand them to the engine.

Different from Fact Base:

* Fact Base changes **incrementally** during a single reasoning process (new facts will be added);
* Rules in Rule Base are usually **relatively fixed** domain knowledge under an application scenario, and generally do not change frequently during reasoning.

Rule Base mainly does two things:

1. Store all rules;
2. Given a question `Question`, select a subset of **possibly relevant rules** to participate in this round of reasoning (`initial_rule_base(question, topn=...)`).

Therefore, from the user’s perspective, you can understand it as:

> **Rule Base = a domain expert’s “experience summary” and “business logic”.**

## II. Input Methods

### 2.1 String Form

WIP

### 2.2 Python Code

Entered via the `Rule` class.
