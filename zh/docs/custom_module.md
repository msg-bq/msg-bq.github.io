---
title: Custom Modules
layout: home
nav_order: 12
---
# 自定义模块

---

## 一、规则选取模块

1. 创建一个py文件，命名要求为`_<name>_strategy.py`，放置于`al_inference_engine/control/grounding_selector/_rule_strageties`文件夹下；
2. 继承RuleSelectionStrategy类，并至少声明此Protocol要求的函数；
3. 使用`@register_strategy('<name>')`注册你的策略类，后续即可通过`grounding_rule_strategy`使用策略；
4. 注意调整`grounding_rule_strategy`的类型标注（增加Literal的候选值）。

## 二、事实选取模块

由于引擎是在项级别进行推理的，所以实则为项选取。创建流程与上一个模块一致，但需要继承`TermSelectionStrategy`类。
