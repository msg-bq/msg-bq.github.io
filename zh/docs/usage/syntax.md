---
title: Syntax
parent: Usage
layout: page
nav_order: 5
---
# 语法

---

## 一、核心语法与基本概念

本节介绍引擎中的基础语法单元：`Constant`、`Concept`、`Variable`、`Operator`、`CompoundTerm`、`Assertion`、`Formula` 与 `Rule`。

### 1. Constant：常量

**常量**表示特定的个体实体，**必须隶属于某一给定概念**，是不可再分的基本单元。

代码表示：

```python
from al_inference_engine.syntax import Constant

constant_1 = Constant('constant_1', concept_1)  
# 声明一个名称为 constant_1，且隶属于 concept_1 的常量
```

字符串表示：

```markdown
WIP
```

---

### 2. Concept：概念

**概念**是具有某种共同性质的常量或概念的集合。

代码表示：

```python
from al_inference_engine.syntax import Concept

concept_1 = Concept('concept_1')  # 声明一个名称为 concept_1 的概念
```

字符串表示：

```markdown
WIP
```

#### 2.1 子集关系录入
在实际问题中，概念存在层级：如 `int ⊆ real`、`rational ⊆ real`。当某算子参数期望 `real`，传入 `int` 应被视为 **类型兼容**。


1) **单条**：
由Concept类维护的函数
```python
Concept.add_subsumption("int", "real")
```
2) **批量列表**：
外部对add_subsumption的封装和调用
```python
add_subsumptions([
    ("int", "real"),
    ("rational", "real"),
])
```
3) **映射（子 -> 父列表）**：
外部对add_subsumption的封装和调用
```python
add_subsumptions_from_mapping({
    "int": ["real"],
    "rational": ["real"],
})
```
4) **字符串 DSL**（支持 `⊆` 与 `<=`，分隔：逗号/分号/换行）：
外部对add_subsumption的封装和调用
```python
add_subsumptions_from_string("""
    int ⊆ real, rational <= real;
    positive_int <= int
""")
```
5) **构造时指定父概念**：
```python
Concept("int", parents=["real"])
```
6) **链式设置父概念**：
```python
Concept("int").set_parents(["real"])
```

> 以上录入方案都可混用，重复声明会被自动去重处理。
{: .note } 


**子集关系录入示例**
```python
Real = Concept("real")
Int = Concept("int", parents=["real"])
PosInt = Concept("positive_int", parents=["int"])

to_real = Operator("to_real", input_concepts=["int"], output_concept="real")

# 期望 int，传 positive_int 也可（因 positive_int ⊆ int）
t1 = CompoundTerm("to_real", [Constant(5, "positive_int")])  # 通过

t2 = CompoundTerm("to_real", [Constant(5, "real")])  # 抛出异常

register_concept_relations("int ⊆ real")

# 试图注册逆向边将报错
try:
    Concept.add_subsumption("real", "int")
except ValueError as e:
    print("阻止互为子集：", e)
```

---

### 3. Variable：变量

**变量**是逻辑表达式中的占位符，用于指代未知或待确定的对象。变量只允许出现在规则和查询中，**不能出现在事实库（FactBase）的事实中**。

代码表示：

```python
from al_inference_engine.syntax import Variable

variable_1 = Variable('variable_1')  # 声明一个名称为 variable_1 的变量
```

字符串表示：

```markdown
WIP
```


---

### 4. Operator：算子

**算子**用于表示常量、概念之间的关系或运算。定义一个算子时，需要指定：

* 输入参数的概念列表 `input_concepts`
* 输出概念 `output_concept`，限制为仅有一个

代码表示：

```python
from al_inference_engine.syntax import Operator

operator_1 = Operator(
    'operator_1',
    input_concepts=[concept_1, concept_2],
    output_concept=concept_3
)
# 声明一个名称为 operator_1 的算子，
# 输入参数的概念为 concept_1 和 concept_2，输出概念为 concept_3
```

字符串表示：

```markdown
WIP
```


#### 4.1 Action Operator（可执行算子）

`Operator` 还允许通过 `implement_func` 参数指定一个函数，使该算子成为**可执行算子（action operator）**。此时，算子的输出值由 `implement_func` 函数计算得到，无需显式存入事实库。

代码表示：

```python
from al_inference_engine.syntax import Operator

def action_func(term):
    # 对 term.arguments 进行运算
    return result

action_op = Operator(
    name="action_op",
    input_concepts=[input_concept1, input_concept2],
    output_concept=output_concept,
    implement_func=action_func,
)
```

> 使用 action operator 的 `CompoundTerm` 必须是 `AtomCompoundTerm`（下文会介绍），暂时未支持完全的`CompoundTerm`。
{: .warning} 

> 若某条 `Rule` 的某个 `CompoundTerm` 中包含 action operator，则该 `CompoundTerm` 中的所有 `Variable` 必须在**其他不包含 action operator**的 `CompoundTerm` 中出现。
{: .note} 

---

### 5. CompoundTerm：复合项

**复合项**表示算子作用于一组参数后的表达式。参数元组中的元素可以是：

* `Constant`
* `Variable`
* 其他 `CompoundTerm`

代码表示：

```python
from al_inference_engine.syntax import CompoundTerm

compoundterm_1 = CompoundTerm(operator_1, [constant_1, variable_1])
# 复合项，算子为 operator_1，参数为 (constant_1, variable_1)

compoundterm_2 = CompoundTerm(operator_2, [compoundterm_1, constant_2])
# 要求：operator_1 的输出概念 == operator_2 的第一个输入概念
```

字符串表示：

```markdown
WIP
```


> **合法性要求：** 对于一个合法的 `CompoundTerm`，参数元组中每一项的概念（或对应复合项的输出概念），必须与组成它的`Operator` 的 `input_concepts` 一一对应。
{: .note} 
---

### 5.1. AtomCompoundTerm：原子复合项

**原子复合项**是指参数中**不再包含其他 `CompoundTerm`** 的复合项。

代码表示：

```python
from al_inference_engine.syntax import AtomCompooundTerm

atom_compoundterm_1 = AtomCompooundTerm(operator_1, [constant_1, variable_1])
# 原子复合项，算子为 operator_1，参数为 (constant_1, variable_1)
```

字符串表示：

```markdown
WIP
```


通常不需要手动创建 `AtomCompoundTerm`，引擎会在满足条件时自动将 `CompoundTerm` 转换为`AtomCompoundTerm`。

---

### 6. Assertion：断言

**断言**是表示知识的基本单位，表明 “左右两侧指代同一个对象/值”。

代码表示：

```python
from al_inference_engine.syntax import Assertion

assertion_1 = Assertion(compoundterm_1, compoundterm_2)
# 断言 compoundterm_1 与 compoundterm_2 相等
```

字符串表示：

```markdown
WIP
```

---

### 7. Formula：公式

**公式**由一个或多个 `Assertion` 通过逻辑连接词构成。支持的连接词包括：

* `'AND'`
* `'OR'`
* `'NOT'`
* `'IMPLIES'`
* `'EQUAL'`

代码表示：

```python
from al_inference_engine.syntax import Formula

formula_1 = Formula(assertion_1, 'AND', assertion_2)
# 表示 assertion_1 AND assertion_2

formula_2 = Formula(formula_1, 'OR', assertion_3)
# 表示 (assertion_1 AND assertion_2) OR assertion_3
```

字符串表示：

```markdown
WIP
```


---

### 8. Rule：规则

**规则**由一个条件公式（body）和一个结论公式或断言（head）构成。推理引擎通过规则从已知事实中推导新事实。可以输入规则的优先级（priority）以控制执行顺序。

代码表示：

```python
from al_inference_engine.syntax import Rule

rule_1 = Rule(formula_1, assertion_3)
# 若 formula_1 成立，则 assertion_3 也成立
```

字符串表示：

```markdown
WIP
```


> 1. 只有在 `Rule` 中，才允许在 `CompoundTerm` / `Assertion` 中出现 `Variable`。事实库中的事实中不允许有变量。
> 2. Body部分会通过DNF转换，将公式转为若干子公式、进而拆分规则为若干子规则（disjunctive rule）进行推理，因此引擎中的公式仅起到语法糖的作用，不能支持各逻辑连接词完整的语义。
> 3. 规则的结论部分（head）应当是**单个 `Assertion` 或仅由 `AND` 连接的 `Formula`**。否则，引擎可能无法正确更新事实库。
{: .note}

---

## 二、特殊语法

### 1. Occur：出现标记 

WIP，暂时不建议使用
{: .warning}

`Occur(T)` 用于表示**某个 `CompoundTerm` 的实例是否出现在事实库中的某条断言中**。

代码表示：

```python
from al_inference_engine.syntax import Occur, Compoundterm

compoundterm_1 = Compoundterm(operator_1, [constant_1, variable_1])
occur_1 = Occur(compoundterm_1)

# occur_1 为真，当且仅当存在形如
#   Compoundterm(operator_1, [constant_1, any_constant])
# 的实例，作为 CompoundTerm 出现在 FactBase 的某个 Assertion 中
```

字符串表示：

```markdown
WIP
```


---

### 2. QueryStructure：查询结构

`QueryStructure` 用于向推理引擎指定一个查询问题，需要提供：

* `premises`：前提事实列表
* `question`：待求解的问题（公式或断言）列表，多个公式或断言会被看做合取式（即同时满足）。

代码表示：

```python
from al_inference_engine.main import QueryStructure

querystructure_1 = QueryStructure(
    premises=fact_list,      # 一个包含多个 Fact 的列表
    question=formula_2       # 待求解的问题
)
```

字符串表示：

```markdown
WIP
```


---

## 三、内置语法与内置算子

### 1. 内置概念

在 `al_inference_engine.knowledge_bases.builtin_base.builtin_concepts` 中定义了若干内置概念：

1. **`FREEVARANY`**：占位符概念，不应在对外接口中使用，且与任意Concept兼容。

   > 自定义 `"FREEVARANY"` 概念会被拒绝，请不要强行定义，以免影响占位符行为。
   {: .important}

2. **`BOOL_CONCEPT`**：布尔值概念，
   所有布尔值应隶属于该概念，并使用预设的`true_const`, `false_const`。

3. **`COMPLEX_NUMBER_CONCEPT`**：复数概念。

4. **`EQUATION_CONCEPT`**：算术方程概念。

### 2. 内置常量

* `true_const`：表示 `True`
* `false_const`：表示 `False`

### 3. 内置算子（全部为 action operator）

在 `al_inference_engine.knowledge_bases.builtin_base.builtin_operators` 中提供以下算术相关算子，均作用于复数（隶属于 `COMPLEX_NUMBER_CONCEPT`）：

1. `arithmetic_plus_op`：算术加法
2. `arithmetic_minus_op`：算术减法
3. `arithmetic_times_op`：算术乘法
4. `arithmetic_divide_op`：算术除法
5. `arithmetic_negate_op`：取相反数

以上算子均为 **action operator**，其结果通过实现函数计算得到。


---

## 四、安全性

为保证推理引擎正确运行，规则与事实必须满足以下安全性约束。

### 1. Fact 安全性

1. 作为 Fact 的 `Assertion` 中 **不能包含 `Variable`**（包括初始事实和 `QueryStructure` 的前提事实）。
2. Fact 中不应包含含有 action operator 的 `Assertion`（待改进，后续可能允许）。

### 2. Rule 安全性

1. 规则 head 中出现的每个 `Variable`，必须在规则体转换为析取范式（DNF）后**每一个合取分支中都出现**（这一点需要改进）。
2. 每个合取分支中，凡是出现在

   * 否定 `Assertion` 中的变量，或
   * 含有 action operator 的 `CompoundTerm` 中的变量，

  必须在至少一个**肯定`Assertion`中、且不含 action operator** 的项（`CompoundTerm` | `Constant` | `Variable`）中出现。
3. 含有 action operator 的 `CompoundTerm` 需要为 `AtomCompoundTerm`。

#### 示例说明

* 安全规则示例：

```text
r(X) = r(Y) AND h(X) = h(Y) -> g(X) = 1
```

head 中的变量 `X` 在 body 的每个合取分支中均出现。


* 不安全示例 1：

```text
r(X) = r(Y) OR h(Z) = h(Y) -> g(X) = 1
```

原因：析取分支 `h(Z) = h(Y)` 中没有出现 head 中的变量 `X`。

* 不安全示例 2：

```text
r(X) = r(Y) AND NOT(h(Z) = h(Y)) -> g(X) = 1
```

原因：变量 `Z` 仅出现在否定的 `Assertion` 中，并未在非否定的 `Assertion` 中出现。

