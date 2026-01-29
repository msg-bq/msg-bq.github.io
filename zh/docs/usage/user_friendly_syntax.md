---
title: 友好语法
parent: 使用指南
layout: page
nav_order: 11
---
# 用户友好的语法

---

## 一、核心语法的简写
本节介绍核心语法中，代码表示的简写方法。

### 1. Constant：常量

常量可以使用任意声明了__str__和__hash__的实例。

```python
from kele.syntax import Constant, HashableAndStringable

class foo:
    def __str__(self) -> str:
     """返回该对象的字符串表示"""

    def __hash__(self) -> int:
        """返回该对象的哈希值"""

    def __eq__(self, other: object) -> bool:
        """该对象是否与另一个对象相等"""
        
c = foo()

constant_1 = Constant(c, concept_1)  
# 任意声明了__str__和__hash__的实例，均可以自动转为str(instance)后，作为常量传入
```

---

### 2. Concept：概念

名称仍然支持HashableAndStringable。此外，概念的使用可以直接使用它的名称字符串，无需使用它的实例。

```python
from kele.syntax import Concept, Constant

concept_1 = Concept('concept_1')  # 声明一个名称为 concept_1 的概念

constant_1 = Constant('constant_1', 'concept_1')  # 直接用概念的名称concept_1
```

> 若传入的概念名尚未声明，引擎会自动创建该 Concept，并抛出 warning。
{: .note}


### 3. Variable：变量

**变量**可以用vf.x或vf['x']直接创建实例（同名仍会创建不同的实例）。

```python
from kele.syntax import vf



variable_1 = vf.x  # 或vf['x']
```

> 提示：每次访问 `vf.x` 都会创建一个新的 `Variable` 对象，但同名变量按 `name` 比较时是相等的（可作为同一个占位符使用）。
{: .note}


---

### 4. Operator：算子

名称仍然支持 HashableAndStringable。算子也可以通过名称索引，但必须先声明对应的 `Operator`（不会像 `Concept` 那样自动创建）。

---

### 5. CompoundTerm：复合项

使用名称索引算子、且常量可以直接录入其取值，无需显式声明概念（默认取值所属的概念与算子约定的输入概念一致）。

```python
from kele.syntax import CompoundTerm

compoundterm_1 = CompoundTerm('operator_1', ['constant_1', vf.variable_1])
# 复合项，算子为 operator_1，参数为 (constant_1, variable_1)
```

也可以直接以函数调用的方式在 `Operator` 实例上快速生成 `CompoundTerm`：

```python
from kele.syntax import Operator

op_1 = Operator('operator_1')
compoundterm_2 = op_1('constant_1', vf.variable_1)
# 等价于 CompoundTerm('operator_1', ['constant_1', vf.variable_1])
```

> 说明：
> - `operator_1` 必须已通过 `Operator(...)` 声明；否则会抛出 `ValueError`。
> - `'constant_1'` 这类非引擎语法的输入会被自动包装成 `Constant('constant_1', expected_concept)`，并抛出 warning 作为提示。
{: .note}


---


### 6. Assertion：断言

若不指定 `Assertion` 的右侧 `rhs`，且`rhs`对应位置的概念约束为内置类型`BOOL_CONCEPT`，则默认右侧为内置常量 `true_const`。


```python
from kele.syntax import Operator, CompoundTerm, Assertion
from kele.knowledge_bases.builtin_base.builtin_concepts import BOOL_CONCEPT
from kele.knowledge_bases.builtin_base.builtin_facts import true_const

test_operator1 = Operator(name="test",
                          input_concepts=[BOOL_CONCEPT],
                          output_concept=BOOL_CONCEPT)

compoundterm_1 = CompoundTerm(operator=test_operator1,
                              arguments=[true_const])

assertion_1 = Assertion(compoundterm_1)
assertion_2 = Assertion(compoundterm_1, true_const)
# 断言 assertion_1 与 assertion_2 等价
```

---

### 7. Rule：规则

rule允许输入name，便于快速定位。如果没有传入，则引擎补一个默认命名`rule_n`


```python
from kele.syntax import Rule

rule_1 = Rule(assertion_3, formula_1, name='test')
```

---

## 二、语法糖

### 1. Assertion / Formula 的逻辑运算符

为便于书写，`Assertion` 与 `Formula` 重载了部分 Python 运算符，可直接构造公式：

* `&` → `AND`
* `|` → `OR`
* `~` → `NOT`
* `>>` → `IMPLIES`

上述运算符支持 `Assertion` 与 `Formula` 的任意组合（左右两侧均可）。

> 说明：
>
> * Python 关键字 `and` / `or` 不支持重载，请使用 `&` / `|`。
> * `EQUAL` 连接词暂未提供对应运算符，后续可能会补充。
>   {: .note}

```python
formula_1 = assertion_1 & assertion_2
formula_2 = ~assertion_1 | assertion_3
formula_3 = assertion_1 >> assertion_2
```
