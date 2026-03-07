---
title: 语法
---

# 语法

---

## I. 核心语法与基本概念

本节介绍推理引擎的基础语法单元：`Constant`, `Concept`, `Variable`, `Operator`, `CompoundTerm`, `Assertion`, `Formula`, `Rule`。

### 1. Constant：常量

**常量**表示特定的个体实体，**必须隶属于至少一个给定概念（Concept）**，是不可再分的基本单元。

代码表示：

```python
from kele.syntax import Constant

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
from kele.syntax import Concept

concept_1 = Concept('concept_1')  # 声明一个名称为 concept_1 的概念
```

字符串表示：

```markdown
WIP
```

#### 2.1 注册包含关系（子概念）

在实际问题中，概念常常形成层级结构，例如 `int ⊆ real`，`rational ⊆ real`。
当算子参数期望 `real` 时，传入 `int` 也应被视为类型兼容。

1. **单条注册**：
   由 `Concept` 类的方法维护

```python
Concept.add_subsumption("int", "real")
```

2. **列表批量**：
   `add_subsumption` 的批量包装

```python
add_subsumptions([
    ("int", "real"),
    ("rational", "real"),
])
```

3. **映射（child -> parents）**：
   `add_subsumption` 的映射包装

```python
add_subsumptions_from_mapping({
    "int": ["real"],
    "rational": ["real"],
})
```

4. **字符串 DSL**（支持 `⊆` 和 `<=`；分隔符：逗号 / 分号 / 换行）：
   `add_subsumption` 的 DSL 包装

```python
add_subsumptions_from_string("""
    int ⊆ real, rational <= real;
    positive_int <= int
""")
```

5. **构造时指定父概念**：

```python
Concept("int", parents=["real"])
```

6. **链式设置父概念**：

```python
Concept("int").set_parents(["real"])
```

::: tip
以上方法可混用，重复声明会自动去重。
:::

**示例：注册包含关系**

```python
Real = Concept("real")
Int = Concept("int", parents=["real"])
PosInt = Concept("positive_int", parents=["int"])

to_real = Operator("to_real", input_concepts=["int"], output_concept="real")

# 期望 int；传入 positive_int 也可以（因为 positive_int ⊆ int）
t1 = CompoundTerm("to_real", [Constant(5, "positive_int")])  # 通过

t2 = CompoundTerm("to_real", [Constant(5, "real")])  # 抛出异常

register_concept_relations("int ⊆ real")

# 尝试注册反向包含会报错
try:
    Concept.add_subsumption("real", "int")
except ValueError as e:
    print("阻止互为子集：", e)
```

---

### 3. Variable：变量

**变量**表示逻辑表达式中的占位符，用来指代未知或待确定的对象。变量只允许出现在规则和查询中，**不得出现在事实库中**。

代码形式：

```python
from kele.syntax import Variable

variable_1 = Variable('variable_1')  # 声明名为 variable_1 的变量
```

::: tip
提示：同名变量会被视为相等（按 `name` 哈希/比较），即使它们是不同的对象实例。
:::

字符串形式：

```markdown
WIP
```

---

### 4. Operator：算子

**算子**表示作用于常量/概念的关系或计算。
定义算子时需要指定：

* 输入参数概念列表：`input_concepts`
* 输出概念：`output_concept`（仅支持一个）

代码形式：

```python
from kele.syntax import Operator

operator_1 = Operator(
    'operator_1',
    input_concepts=[concept_1, concept_2],
    output_concept=concept_3
)
# 声明算子 operator_1，输入概念为 concept_1 和 concept_2，输出概念为 concept_3
```

字符串形式：

```markdown
WIP
```

#### 4.1 Action on Operator（含外部实现的算子）

`Operator` 还允许通过 `implement_func` 参数指定一个函数，使成为**算子的外部实现**（后文简称可执行算子）。此时，算子的
输出值由 `implement_func` 函数计算得到，无需显式存入事实库。

代码形式：

```python
from kele.syntax import Operator

def action_func(term):
    # term 为 FlatCompoundTerm；读取 term.arguments 进行计算
    # 返回值需为 TERM_TYPE（通常为 Constant 或 FlatCompoundTerm），并满足 output_concept
    return result

action_op = Operator(
    name="action_op",
    input_concepts=[input_concept1, input_concept2],
    output_concept=output_concept,
    implement_func=action_func,
)
```

::: warning
使用 可执行算子 的 `CompoundTerm` 暂时必须是 `FlatCompoundTerm`（下文会介绍），暂时未支持完全的`CompoundTerm`，会在
后续版本放开限制。
:::

::: tip
若某条 `Rule` 的某个 `CompoundTerm` 中包含 可执行算子，则该 `CompoundTerm` 中的所有 `Variable` 必须在**其他不包含 可执行算子**的 `Assertion` 中出现。
:::

---

### 5. CompoundTerm：复合项

**复合项**表示一个算子作用于若干参数。参数可以是：

* `Constant`
* `Variable`
* 其他 `CompoundTerm`

代码形式：

```python
from kele.syntax import CompoundTerm

compoundterm_1 = CompoundTerm(operator_1, [constant_1, variable_1])
# operator_1(c1, v1)

compoundterm_2 = CompoundTerm(operator_2, [compoundterm_1, constant_2])
# 要求 operator_1 的输出概念 = operator_2 的第一个输入概念
```

字符串形式：

```markdown
WIP
```

::: tip
**合法性要求：** 对于一个合法的 `CompoundTerm`，参数元组中每一项的概念（或对应复合项的输出概念），必须与组成它的`Operator` 的 `input_concepts` 一一对应。
:::

---

### 5.1 原子复合项 FlatCompoundTerm

**原子复合项**指参数中不含 `CompoundTerm` 的复合项。

代码形式：

```python
from kele.syntax import FlatCompoundTerm

atom_compoundterm_1 = FlatCompoundTerm(operator_1, [constant_1, variable_1])
# 原子复合项
```

字符串形式：

```markdown
WIP
```

通常无需手动创建 `FlatCompoundTerm`，引擎会在条件满足时自动转换。

---

### 6. Assertion：断言

**断言**是知识的基本单元，表示“左侧和右侧指代同一对象/值”。

代码形式：

```python
from kele.syntax import Assertion

assertion_1 = Assertion(compoundterm_1, compoundterm_2)
# 断言 compoundterm_1 等于 compoundterm_2
```

字符串形式：

```markdown
WIP
```

---

### 7. Formula：公式

**公式**由一个或多个 `Assertion` 通过逻辑连接词组合而成。支持的连接词包括：

* `'AND'`
* `'OR'`
* `'NOT'`
* `'IMPLIES'`
* `'EQUAL'`

::: tip
**布尔用法**：`Assertion` 与 `Formula` 是符号对象，不能作为 Python 布尔值使用。
:::

代码形式：

```python
from kele.syntax import Formula

formula_1 = Formula(assertion_1, 'AND', assertion_2)
# 表示 assertion_1 AND assertion_2

formula_2 = Formula(formula_1, 'OR', assertion_3)
# 表示 (assertion_1 AND assertion_2) OR assertion_3
```

字符串形式：

```markdown
WIP
```

---

### 8. Rule：规则

**规则**由条件公式（body）与结论（head）组成。

代码形式：

```python
from kele.syntax import Rule

rule_1 = Rule(assertion_3, formula_1)
# 若 formula_1 成立，则 assertion_3 成立
```

字符串形式：

```markdown
WIP
```

::: tip
1. `Rule` 的构造参数顺序是 `Rule(head, body, ...)`，建议使用关键字参数 `Rule(head=..., body=...)`。
2. 变量仅允许在规则中出现，FactBase 中的事实不能包含变量。
3. 引擎内部会将 `Formula` 转为 DNF 并拆成多条规则，因此 `Formula` 仅作语法糖，不覆盖所有逻辑连接词语义。
4. 规则头仅支持**单个 `Assertion`** 或仅由 `AND` 连接的一组 `Assertion`。
:::

---

## II. 特殊语法

### 1. Intro：出现/引入标记

`Intro(T)` 用于表示**某个 `CompoundTerm` 的实例是否出现在事实库中的某条断言中**。

代码形式：

```python
from kele.syntax import Intro, CompoundTerm

compoundterm_1 = CompoundTerm(operator_1, [constant_1, variable_1])
I1 = Intro(compoundterm_1)

# I1 为真，当且仅当存在形如
#   CompoundTerm(operator_1, [constant_1, 任意常量])
# 出现在 FactBase 的某个 Assertion 中
```

字符串形式：

```markdown
WIP
```

---

### 2. QueryStructure：查询结构

`QueryStructure` 指定推理引擎的查询问题，需提供：

* `premises`：前提事实列表
* `question`：待求解的问题（公式或断言）列表，多个公式或断言会被看做合取式（即同时满足）。

代码表示：

```python
from kele.main import QueryStructure

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

## III. 内置语法与内置算子

### 1. 内置概念

内置概念定义在 `kele.knowledge_bases.builtin_base.builtin_concepts`：

1. **`FREEVARANY`**：占位概念，不用于外部 API，兼容任意 Concept。

   ::: danger
   不能自定义 `"FREEVARANY"` 概念，否则会破坏占位行为。
   :::

2. **`BOOL_CONCEPT`**：布尔概念。所有布尔值都属于此概念，并使用内置 `true_const` / `false_const`。

3. **`COMPLEX_NUMBER_CONCEPT`**：复数概念。

4. **`EQUATION_CONCEPT`**：算术方程概念。

### 2. 内置常量

* `true_const`：表示 `True`
* `false_const`：表示 `False`

### 3. 内置算子

在 `kele.knowledge_bases.builtin_base.builtin_operators` 中提供以下算术相关算子，均作用于复数（隶属于 `COMPLEX_NUMBER_CONCEPT`）：

1. `arithmetic_plus_op`：算术加法
2. `arithmetic_minus_op`：算术减法
3. `arithmetic_times_op`：算术乘法
4. `arithmetic_divide_op`：算术除法
5. `arithmetic_negate_op`：取相反数

以上算子均为 **可执行算子**，其结果通过实现函数计算得到。

---

## IV. 安全性

为保证推理引擎正确运行，规则与事实需满足以下安全约束。

### 1. Fact 安全性

作为 Fact 的 `Assertion` 中 **不能包含 `Variable`**（包括初始事实和 `QueryStructure` 的前提事实）。

### 2. Rule 安全性

对于不安全的规则，引擎会使用 `Intro` 主动补齐并抛出 warning，以保障使用流畅。但此举容易拖慢运行速度，建议理解本节内容并人工优化规则。为便于非引擎专业使用者阅读，下文使用分段、而非递归的方式定义安全性。

0. 为规则 body 的每个 `Assertion` 分配一个T/F的布尔值，考虑可以令 body 为真的所有分配，如果一个 `Assertion` 在所有分配下均为真，则称其为 T 类型的 `Assertion`。
1. 规则中出现的每个 `Variable`，都应该在 T 类型的 `Assertion` 中出现过。
2. 含有 可执行算子 的 `CompoundTerm` 中的变量，必须在至少一个**T 类型的、且不含可执行算子** 的 `Assertion` 中出现。
3. 任意包含可执行算子的 `CompoundTerm` 必须为 `FlatCompoundTerm`。

#### 示例说明

* 安全规则示例：

```text
r(X) = r(Y) AND h(X) = h(Y) -> g(X) = 1
```

* 不安全示例 1：

```text
r(X) = r(Y) OR h(Z) = h(Y) -> g(X) = 1
```

原因：在析取分支 `h(Z) = h(Y)` 中，head 的变量 `X` 没有出现。

* 不安全示例 2：

```text
r(X) = r(Y) AND NOT(h(Z) = h(Y)) -> g(X) = 1
```

原因：变量 `Z` 仅出现在否定的 `Assertion` 中，并未在非否定的 `Assertion` 中出现。
