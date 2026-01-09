---
title: 内置 Hook 启用器
layout: page
nav_order: 6
---

# 内置 Hook 启用器

KELE 提供用于检查/调试的内置 hook 启用器。导入 `BuiltinHookEnabler`，
创建实例后，在 grounded rule 上启用对应的 hook。

```python
from kele.control import BuiltinHookEnabler

hooks = BuiltinHookEnabler()
hooks.enable(grounded_rule, "assertion_check")
```
