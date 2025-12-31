---
title: Fact Base
parent: Usage
layout: page
nav_order: 7
---

# Fact Base 

---

## I. What It Is

Fact Base is a **collection of facts** that stores known assertions available during the reasoning process, which can include:

* Explicitly provided domain facts (e.g., “Zhang San is a student”, “A is B’s father”, etc.);
* Facts dynamically imported from external systems (e.g., the “Three-Repository System”) (still under development);
* New facts **continuously derived** during the reasoning process.

In implementation, Fact Base maintains two layers of sets:

* `facts`: “all facts” known to the system;
* `cur_facts`: a subset of facts that actually participates in reasoning for this problem-solving session.

A typical workflow is:

1. Provide the question `Question`;
2. The engine calls `initial_fact_base(question, topn=...)`:

   * Heuristically selects from `facts` the portion most relevant to the current question;
   * Requests additional facts associated with this question from external systems;
   * Puts them all into `cur_facts` as the starting point for this round of reasoning.

## II. Input Methods

### 2.1 String Form

WIP

### 2.2 Python Code

Generally entered via the `Assertion` class.
