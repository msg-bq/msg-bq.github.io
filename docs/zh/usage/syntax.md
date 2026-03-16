---
title: 语法
---

# 语法

---

## I. 核心语法与基本概念

本节介绍引擎中的基础语法单元：`Constant`、`Concept`、`Variable`、`Operator`、`CompoundTerm`、`Assertion`、`Formula` 与 `Rule`、`ConflictRule`。

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

说明字段：

支持 `Constant(..., description="...")`。  
详见 [description 在各语法层级的一致行为](#description-behavior-across-syntax-levels)。

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

说明字段：

支持 `Concept(..., description="...")`。  
详见 [description 在各语法层级的一致行为](#description-behavior-across-syntax-levels)。

#### 2.1 子集关系录入

在实际问题中，概念存在层级：如 `int ⊆ real`、`rational ⊆ real`。
当某算子参数期望 `real`，传入 `int` 应被视为 **类型兼容**。

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

::: tip
以上录入方案都可混用，重复声明会被自动去重处理。
:::

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
from kele.syntax import Variable

variable_1 = Variable('variable_1')  # 声明一个名称为 variable_1 的变量
```

::: tip
提示：同名变量会被视为相等，即使它们是不同的对象实例。
:::

字符串表示：

```markdown
WIP
```

说明字段：

`Variable` 不提供 `description` 字段。

---

### 4. Operator：算子

**算子**用于表示常量、概念之间的关系或运算。定义一个算子时，需要指定：

* 输入参数的概念列表 `input_concepts`
* 输出概念 `output_concept`，限制为仅有一个

代码表示：

```python
from kele.syntax import Operator

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

说明字段：

支持 `Operator(..., description="...")`。  
详见 [description 在各语法层级的一致行为](#description-behavior-across-syntax-levels)。

#### 4.1 Action on Operator（含外部实现的算子）

`Operator` 还允许通过 `implement_func` 参数指定一个函数，使成为**算子的外部实现**（后文简称可执行算子）。此时，算子的输出值由 `implement_func` 函数计算得到，无需显式存入事实库。

代码表示：

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
使用 可执行算子 的 `CompoundTerm` 暂时必须是 `FlatCompoundTerm`（下文会介绍），暂时未支持完全的`CompoundTerm`，会在后续版本放开限制。
:::

::: tip
若某条 `Rule` 的某个 `CompoundTerm` 中包含 可执行算子，则该 `CompoundTerm` 中的所有 `Variable` 必须在**其他不包含 可执行算子**的 `Assertion` 中出现。
:::

---

### 5. CompoundTerm：复合项

**复合项**表示算子作用于一组参数后的表达式。参数元组中的元素可以是：

* `Constant`
* `Variable`
* 其他 `CompoundTerm`

代码表示：

```python
from kele.syntax import CompoundTerm

compoundterm_1 = CompoundTerm(operator_1, [constant_1, variable_1])
# 复合项，算子为 operator_1，参数为 (constant_1, variable_1)

compoundterm_2 = CompoundTerm(operator_2, [compoundterm_1, constant_2])
# 要求：operator_1 的输出概念 == operator_2 的第一个输入概念
```

字符串表示：

```markdown
WIP
```

说明字段：

支持 `CompoundTerm(..., description="...")`。  
详见 [description 在各语法层级的一致行为](#description-behavior-across-syntax-levels)。

::: tip
**合法性要求：** 对于一个合法的 `CompoundTerm`，参数元组中每一项的概念（或对应复合项的输出概念），必须与组成它的`Operator` 的 `input_concepts` 一一对应。
:::

---

### 5.1. FlatCompoundTerm：原子复合项

**原子复合项**是指参数中**不再包含其他 `CompoundTerm`** 的复合项。

代码表示：

```python
from kele.syntax import FlatCompoundTerm

atom_compoundterm_1 = FlatCompoundTerm(operator_1, [constant_1, variable_1])
# 原子复合项，算子为 operator_1，参数为 (constant_1, variable_1)
```

字符串表示：

```markdown
WIP
```

说明字段：

支持 `FlatCompoundTerm(..., description="...")`。  
详见 [description 在各语法层级的一致行为](#description-behavior-across-syntax-levels)。

通常不需要手动创建 `FlatCompoundTerm`，引擎会在满足条件时自动将 `CompoundTerm` 转换为 `FlatCompoundTerm`。

---

### 6. Assertion：断言

**断言**是表示知识的基本单位，表明 “左右两侧指代同一个对象/值”。

代码表示：

```python
from kele.syntax import Assertion

assertion_1 = Assertion(compoundterm_1, compoundterm_2)
# 断言 compoundterm_1 与 compoundterm_2 相等
```

字符串表示：

```markdown
WIP
```

说明字段：

支持 `Assertion(..., description="...")`。  
详见 [description 在各语法层级的一致行为](#description-behavior-across-syntax-levels)。

---

### 7. Formula：公式

**公式**由一个或多个 `Assertion` 通过逻辑连接词构成。支持的连接词包括：

* `'AND'`
* `'OR'`
* `'NOT'`
* `'IMPLIES'`
* `'IFF'`

历史写法 `'EQUAL'` 目前仍可兼容解析，但已标记为弃用。

::: tip
**布尔使用说明：** `Assertion` 与 `Formula` 是符号对象，不能直接作为 Python 的布尔值使用；其 `__bool__` 会抛出 `TypeError`。这样做是为了避免将 Python 的真值判断（如“非空即为 True”）与断言/公式的逻辑真值混淆。请始终在引擎中显式求值。
:::

代码表示：

```python
from kele.syntax import Formula

formula_1 = Formula(assertion_1, 'AND', assertion_2)
# 表示 assertion_1 AND assertion_2

formula_2 = Formula(formula_1, 'OR', assertion_3)
# 表示 (assertion_1 AND assertion_2) OR assertion_3
```

字符串表示：

```markdown
WIP
```

说明字段：

支持 `Formula(..., description="...")`。  
详见 [description 在各语法层级的一致行为](#description-behavior-across-syntax-levels)。

---

### 8. Rule：规则

**规则**由一个条件公式（body）和一个结论公式或断言（head）构成。推理引擎通过规则从已知事实中推导新事实。可以输入规则的优先级（priority）以控制执行顺序。

代码表示：

```python
from kele.syntax import Rule

rule_1 = Rule(assertion_3, formula_1)
# 若 formula_1 成立，则 assertion_3 也成立（注意：构造函数参数顺序为 head, body）
```

字符串表示：

```markdown
WIP
```

::: tip
1. `Rule` 的构造函数参数顺序为 `Rule(head, body, ...)`。建议使用关键字参数（`Rule(head=..., body=...)`）以避免误用。
2. 只有在 `Rule` 中，才允许在 `CompoundTerm` / `Assertion` 中出现 `Variable`。事实库中的事实中不允许有变量。
3. 引擎内部会将 `Rule中的Formula` 通过DNF转换为子句列表（仅含有 `Assertion` 和 `NOT Assertion`的合取式），并拆解为多条子规则；因此 `Formula` 主要起语法糖作用，不能覆盖各逻辑连接词的完整语义。
4. 规则的结论部分（head）仅支持**单个 `Assertion` 或仅由 `AND` 连接的 `Assertion`**。
:::

说明字段：

支持 `Rule(..., description="...")`。  
详见 [description 在各语法层级的一致行为](#description-behavior-across-syntax-levels)。

<a id="description-behavior-across-syntax-levels"></a>

### description 在各语法层级的一致行为

`description` 只用于给人阅读的说明，不影响推理结果。

支持该字段的语法结构：

* `Constant`, `Concept`, `Operator`
* `CompoundTerm`, `FlatCompoundTerm`
* `Assertion`, `Formula`
* `Rule`, `ConflictRule`

默认行为：

1. 不传时默认值是 `""`。
2. 系统不会自动拼接子结构的 description。

文本生成优先级：

1. 构造时显式传入 `description="..."`
2. 若未传且该结构配置了自动说明函数（`set_description_handler(...)`，见 II 节），使用函数结果
3. 否则回退为 `""`

同名行为：

1. `Concept` 和 `Operator` 按名称单例：再次创建时传空 description 会保留旧说明；传入不同的非空说明会报错。
2. `Constant` 不是单例；按名称读取时，会返回当前登记的最新对象说明。

---

## II. 特殊语法

本节与 description 相关的语法补充：

* [按名称读取说明（Constant / Concept / Operator）](#description-kv)
* [自动说明函数（term / assertion / formula / rule）](#description-auto-function)

### 1. Intro：出现/引入标记

`Intro(T)` 用于表示**某个 `CompoundTerm` 的实例是否出现在事实库中的某条断言中**。

代码表示：

```python
from kele.syntax import Intro, CompoundTerm

compoundterm_1 = CompoundTerm(operator_1, [constant_1, variable_1])
I1 = Intro(compoundterm_1)

# I1 为真，当且仅当存在形如
#   CompoundTerm(operator_1, [constant_1, any_constant])
# 的实例，作为 CompoundTerm 出现在 FactBase 的某个 Assertion 中
```

字符串表示：

```markdown
WIP
```

---

### 2. ConflictRule：检查型规则

`ConflictRule` 用于“检查型任务”：当某种不希望出现的状态被推出时，直接终止本次推理。
它常用于 CI 等检查性任务（例如规则一致性检查、禁用模式检查）。

代码表示：

```python
from kele.syntax import ConflictRule

conflict_rule = ConflictRule(
    body=[
        Assertion(CompoundTerm(parent_op, [X, Y]), true_const),
        Assertion(CompoundTerm(parent_op, [Y, X]), true_const),
    ],
    name="no_mutual_parent",
)
```

可与普通规则一起使用：

```python
rules = [normal_rule_1, normal_rule_2, conflict_rule]
```

运行行为：

1. 当 `ConflictRule.body` 被推出时，引擎会返回 `InferenceStatus.CONFLICT_DETECTED` 并终止。
2. 终止原因可从 `EngineRunResult.conflict_reason` 获取（包含 `rule_name`、`rule_body`、`evidence`）。

说明字段：

支持 `ConflictRule(..., description="...")`。

---

<a id="description-kv"></a>

### 3. 按名称读取说明（Constant / Concept / Operator）

对于 `Constant`、`Concept`、`Operator`，可以按名称读取 `description`。

使用步骤：

1. 创建引擎时开启 `enable_description_registry=True`
2. 创建 `Concept` / `Operator` / `Constant` 时填写 `description`
3. 调用 `engine.get_description_by_key(...)` 读取说明

```python
from kele.main import InferenceEngine
from kele.syntax import Concept, Operator, Constant
from kele.knowledge_bases.builtin_base.builtin_concepts import BOOL_CONCEPT

engine = InferenceEngine(facts=[], rules=[], enable_description_registry=True)

person = Concept("Person", description="所有人实体")
parent = Operator("parent", [person, person], BOOL_CONCEPT, description="父母关系")
alice = Constant("Alice", person, description="示例人物")

engine.get_description_by_key("Person")  # "所有人实体"
engine.get_description_by_key("parent")  # "父母关系"
engine.get_description_by_key("Alice")   # "示例人物"
```

如果同一个名称在多个类别中都存在，请显式指定 `registry_type`：

```python
engine.get_description_by_key("Person", registry_type="concept")
# registry_type 可选: "constant" | "concept" | "operator"
```

<a id="description-auto-function"></a>

### 4. 自动说明函数（term / assertion / formula / rule）

部分语法结构在你未传 `description="..."` 时，可以自动生成说明文本。

支持结构：

* `CompoundTerm` / `FlatCompoundTerm`
* `Assertion`
* `Formula`
* `Rule`（以及继承 `Rule` 的 `ConflictRule`）

通过 `set_description_handler(...)` 设置：

```python
from kele.syntax import CompoundTerm, Concept, Constant, Operator
from kele.syntax.mixins import SupportsDescription

concept = Concept("Thing", description="示例概念")
operator = Operator("tag", [concept], concept, description="示例算子")
constant = Constant("Alice", concept, description="示例常量")

def auto_desc(obj: SupportsDescription) -> str:
    if isinstance(obj, CompoundTerm):
        return f"custom:{obj.operator.name}"
    return "custom"

CompoundTerm.set_description_handler(auto_desc)

term_1 = CompoundTerm(operator, [constant])  # 未显式传 description
term_2 = CompoundTerm(operator, [constant], description="手工说明")

term_1.description  # "custom:tag"
term_2.description  # "手工说明"（显式传入优先）

CompoundTerm.set_description_handler(None)  # 重置
```

`Constant`、`Concept`、`Operator` 不使用该自动函数，直接使用构造时传入的文本。

---

### 5. QueryStructure：查询结构

`QueryStructure` 用于向推理引擎指定一个查询问题，需要提供：

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

在 `kele.knowledge_bases.builtin_base.builtin_concepts` 中定义了若干内置概念：

1. **`FREEVARANY`**：占位符概念，不应在对外接口中使用，且与任意Concept兼容。

   ::: danger
   自定义 `"FREEVARANY"` 概念会被拒绝，请不要强行定义，以免影响占位符行为。
   :::

2. **`BOOL_CONCEPT`**：布尔值概念，所有布尔值应隶属于该概念，并使用预设的 `true_const`, `false_const`。

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
6. `arithmetic_equation_op`：算术等式算子，输出属于 `EQUATION_CONCEPT`（例如 `(1 + 2) = 3` 这类表达式底层使用的就是它）

其中前 5 个均为 **可执行算子**，其结果通过实现函数计算得到。`arithmetic_equation_op` 则是算术表达式使用的内置等式算子。

---

## IV. 安全性

为保证推理引擎正确运行，规则与事实必须满足以下安全性约束。

### 1. Fact 安全性

作为 Fact 的 `Assertion` 中 **不能包含 `Variable`**（包括初始事实和 `QueryStructure` 的前提事实）。

### 2. Rule 安全性

对于不安全的规则，引擎会使用 `Intro` 主动补齐并抛出 warning，以保障使用流畅。但此举容易拖慢运行速度，建议理解本节内容并人工优化规则。为便于非引擎专业使用者阅读，下文使用分段、而非递归的方式定义安全性。

0. 为规则 body 的每个 `Assertion` 分配一个T/F的布尔值，考虑可以令 body 为真的所有分配，如果一个 `Assertion` 在所有分配下均为真，则称其为 T 类型的 `Assertion`。
1. 规则中出现的每个 `Variable`，都应该在 T 类型的 `Assertion` 中出现过。
2. 含有 可执行算子 的 `CompoundTerm` 中的变量，必须在至少一个**T 类型的、且不含可执行算子** 的 `Assertion` 中出现。
3. 含有 可执行算子 的 `CompoundTerm` 需要为 `FlatCompoundTerm`。

#### 示例说明

* 安全规则示例：

```text
r(X) = r(Y) AND h(X) = h(Y) -> g(X) = 1
```

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









