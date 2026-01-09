---
title: Built-in Hook Enabler
layout: page
nav_order: 6
---

# Built-in Hook Enabler

KELE provides a built-in hook enabler for inspection and debugging. Import
`BuiltinHookEnabler`, create an instance, and enable a hook on a grounded rule.

```python
from kele.control import BuiltinHookEnabler

hooks = BuiltinHookEnabler()
hooks.enable(grounded_rule, "assertion_check")
```
