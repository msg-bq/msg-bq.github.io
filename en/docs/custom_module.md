---
title: Custom Modules
layout: home
nav_order: 12
---
# Custom Modules

---

These modules will be provided in the next few releases with easier and more controllable ways.

## I. Rule Selection Module

1. Create a `.py` file named `_<name>_strategy.py`, and place it under the `kele/control/grounding_selector/_rule_strageties` directory;
2. Inherit from the `RuleSelectionStrategy` class, and declare at least the functions required by this Protocol;
3. Register your strategy class with `@register_strategy('<name>')`. Afterwards, you can use the strategy via `grounding_rule_strategy`;
4. Remember to adjust the type annotation of `grounding_rule_strategy` (add a candidate value to the `Literal`).

## II. Fact Selection Module

Since the engine performs reasoning at the item level, this is effectively term selection. The creation process is the same as the previous module, but you need to inherit from the `TermSelectionStrategy` class.
