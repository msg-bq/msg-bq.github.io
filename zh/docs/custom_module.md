---
title: 自定义模块
layout: home
nav_order: 12
---
# 自定义模块

---

自定义模块既可以在 KELE 源码内部实现，也可以通过导入 `register` 在外部模块中注册。
对大多数用户而言，推荐外部注册方式，以避免直接修改库代码。

## 一、规则选取模块

### 方式 A：外部模块（推荐）

1. 在你的项目中创建 Python 模块（例如 `my_app/strategies.py`）。
2. 继承 `RuleSelectionStrategy` 协议。
3. 使用顶层注册入口注册策略类：

```python
from kele import register
from kele.control.grounding_selector.rule_strategies import RuleSelectionStrategy


@register.rule_selector("my_rule_strategy")
class MyRuleStrategy(RuleSelectionStrategy):
    ...
```

4. 在配置中通过 `grounding_rule_strategy` 使用 `"my_rule_strategy"`。

### 方式 B：内部模块

1. 创建一个 py 文件，命名要求为 `_<name>_strategy.py`，放置于 `kele/control/grounding_selector/_rule_strageties` 文件夹下；
2. 继承 `RuleSelectionStrategy` 类，并至少声明此 Protocol 要求的函数；
3. 使用 `@register_strategy('<name>')` 注册你的策略类，后续即可通过 `grounding_rule_strategy` 使用策略；
4. 注意调整 `grounding_rule_strategy` 的类型标注（增加 Literal 的候选值）。

## 二、事实选取模块

由于引擎是在项级别进行推理的，所以实则为项选取。创建流程与规则选取一致，
但需要继承 `TermSelectionStrategy` 协议，外部定义时使用
`register.term_selector(...)` 完成注册。
