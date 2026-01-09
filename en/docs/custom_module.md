---
title: Custom Modules
layout: home
nav_order: 12
---
# Custom Modules

---

Custom modules can be defined either inside the KELE source tree or in external Python packages.
The external approach is recommended for most users because it avoids modifying the library itself.

## I. Rule Selection Module

### Option A: external module (recommended)

1. Create a Python module in your own project (for example, `my_app/strategies.py`).
2. Inherit from the `RuleSelectionStrategy` protocol.
3. Register your strategy class with the top-level registry:

```python
from kele import register
from kele.control.grounding_selector.rule_strategies import RuleSelectionStrategy


@register.rule_selector("my_rule_strategy")
class MyRuleStrategy(RuleSelectionStrategy):
    ...
```

4. Reference `"my_rule_strategy"` via the `grounding_rule_strategy` configuration.

### Option B: internal module (advanced)

1. Create a `.py` file named `_<name>_strategy.py`, and place it under the `kele/control/grounding_selector/_rule_strageties` directory;
2. Inherit from the `RuleSelectionStrategy` class, and declare at least the functions required by this Protocol;
3. Register your strategy class with `@register_strategy('<name>')`. Afterwards, you can use the strategy via `grounding_rule_strategy`;
4. Remember to adjust the type annotation of `grounding_rule_strategy` (add a candidate value to the `Literal`).

## II. Fact Selection Module

Since the engine performs reasoning at the item level, this is effectively term selection.
Follow the same process as the rule selection module, but inherit from the
`TermSelectionStrategy` protocol and register with `register.term_selector(...)` when defining
external modules.
