---
title: 快速开始
layout: page
nav_order: 3
---

# 快速开始

---

完成安装后，运行
```markdown
python _examples/relationship.py --log_level RESULT
```

下面我们将对relationship示例做详细的分析。

顺序依次说明：

1. 问题与目标
2. 概念与算子建模（Concept / Operator）
3. 已知事实（Assertion）
4. 规则建模（Rule）
5. 构造查询（QueryStructure）
6. 调用推理引擎（InferenceEngine）

---

## 1. 问题与目标

自然语言问题如下：

> 已知：
>
> * `Alice` 是 `Bob` 的父母（`parent(Alice, Bob) = True` 为真）
> * `Bob` 是 `Carie` 的父母（`parent(Bob, Carie) = True` 为真）
>
> 规则：
>
> * 若 `X` 是 `Y` 的父母，且 `Y` 是 `Z` 的父母，则 `X` 是 `Z` 的祖父母。（由两个`parent(...) = True`的断言，通过传递性推理）
>
> 问题：
>
> * **Alice 是谁的祖父母？** （`grandparent(Alice, X) = True`）

在逻辑上，希望推理出结论：

```text
grandparent(Alice, Carie) = True
```

---

## 2. 导入基础类型与推理引擎入口

示例中需要用到以下几个核心类型：

* `Concept`：概念（类型），如 `Person`。
* `Operator`：算子，如 `parent`、`grandparent`。
* `Variable` / `Constant`：变量与常量。
* `CompoundTerm`：由算子 + 参数构成的复合项（例如 `parent(Alice, Bob)`）。
* `Assertion`：断言，形式为 `t1 = t2`。
* `Rule`：规则（head + body）。
* `InferenceEngine`、`QueryStructure`：推理引擎与查询结构。

```python
from kele.syntax import (
    Constant,
    Variable,
    Concept,
    Operator,
    CompoundTerm,
    Assertion,
    Rule,
)
from kele.main import InferenceEngine, QueryStructure
```

---

## 3. 概念与算子建模

### 3.1 概念建模：`Person`

本例的领域中仅有两种对象类型：**人**和**布尔值**。
用两个 `Concept` 表示：

```python
# === 概念：Person（人） ===
Person = Concept("Person")
from kele.knowledge_bases.builtin_base.builtin_concepts import BOOL_CONCEPT  # 已经内置于系统中
```

### 3.2 算子建模：`parent` 与 `grandparent`

需要两个二元算子：

1. `parent(X, Y)`：X 是 Y 的父母，此算子只用于表示关系，因此输出设为布尔值。
2. `grandparent(X, Y)`：X 是 Y 的祖父母，此算子只用于表示关系，因此输出设为布尔值。

两者都输入两个 `Person`，输出 `BOOL_CONCEPT`。

```python
# === 算子（Operator）===
parent_op = Operator(
    "parent",
    input_concepts=[Person, Person],
    output_concept=BOOL_CONCEPT
)

grandparent_op = Operator(
    "grandparent",
    input_concepts=[Person, Person],
    output_concept=BOOL_CONCEPT
)
```

此时 `parent_op` / `grandparent_op` 只是算子的名称，要通过后续的 `CompoundTerm(operator, [参数...])` 构造项，进一步通过项构造断言。

---

## 4. 常量与变量建模

### 4.1 变量：`X`, `Y`, `Z`

规则中需要泛化到任意人物，故引入三个变量：

```python
# === 变量 ===
X = Variable("X")
Y = Variable("Y")
Z = Variable("Z")
```

这些变量在规则中会出现在算子的参数位置，用于表示“任意符合概念约束的值”。

### 4.2 个体常量：`Alice`, `Bob`, `Carie`, `true_const`

具体人物用 `Constant` 表示，概念为 `Person`：

```python
# === 个体常量（人名） ===
alice = Constant("Alice", Person)
bob   = Constant("Bob", Person)
carie = Constant("Carie", Person)
from kele.knowledge_bases.builtin_base.builtin_facts import true_const
```

---

## 5. 已知事实（Assertion）

自然语言事实：

1. `parent(Alice, Bob) = True` 为真
2. `parent(Bob, Carie) = True` 为真

逻辑上记为：

```text
parent(Alice, Bob) = true_const
parent(Bob, Carie) = true_const
```

代码中，每条事实都是一个 `Assertion(t1, t2)`：

* `t1`：`CompoundTerm(parent_op, [alice, bob])`
* `t2`：`True`（即 `true_const`）

```python
# === 初始事实（Facts）===
facts = [
    # parent(Alice, Bob) = true_const
    Assertion(
        CompoundTerm(parent_op, [alice, bob]),
        true_const
    ),

    # parent(Bob, Carie) = true_const
    Assertion(
        CompoundTerm(parent_op, [bob, carie]),
        true_const
    ),
]
```

这样，事实被统一编码为显式的等式形式 `t1 = t2`的形式。

---

## 6. 规则建模（Rule + Formula）

### 6.1 自然语言到逻辑形式

规则内容：

> 如果 X 是 Y 的父母，且 Y 是 Z 的父母，那么 X 是 Z 的祖父母。

转为逻辑公式：

```text
parent(X, Y) = true_const, parent(Y, Z) = true_const
  → grandparent(X, Z) = true_const
```

### 6.2 使用 `Assertion` 表达前提（body）

前提由两个 `Assertion` 构成：

```python
body = [
    Assertion(
        CompoundTerm(parent_op, [X, Y]),
        true_const
    ),
    Assertion(
        CompoundTerm(parent_op, [Y, Z]),
        true_const
    ),
]
```

### 6.3 使用 `Assertion` 表达结论（head）

结论为一个 `Assertion`：

```python
head = Assertion(
    CompoundTerm(grandparent_op, [X, Z]),
    true_const
)
```

### 6.4 组合成规则 `Rule`

将 `head` 与 `body` 封装为规则对象：

```python
# === 规则（Rule）===
# parent(X, Y) = true_const ∧ parent(Y, Z) = true_const
#   → grandparent(X, Z) = true_const
R1 = Rule(
    head=head,
    body=body
)

rules = [R1]
```

至此，一条自然语言规则被完整编码。

---

## 7. 构造查询（QueryStructure）

本例的问题是：

> Alice 是谁的祖父母？

在逻辑上可写为：

```text
grandparent(Alice, X) = true_const ?
```

即寻找哪些 `X` 使得命题 `grandparent(Alice, X)` 为真。

构造相应的 `Assertion`：

```python
query_assertion = Assertion(
    CompoundTerm(grandparent_op, [alice, X]),
    true_const
)
```

再将事实与查询封装为 `QueryStructure`：

```python
# === 查询（Query）===
query_question = QueryStructure(
    premises=facts,          # 本次查询使用的前提（事实）
    question=[query_assertion]  # 要询问的命题：grandparent(Alice, X) = true_const ?
)
```

---

## 8. 调用推理引擎（InferenceEngine）

最后，构造推理引擎实例并执行查询。

```python
# === 推理引擎 ===
inference_engine = InferenceEngine(
    facts=[],   # 示例中不使用全局 facts，全部事实放在 QueryStructure.premises
    rules=rules
)

result = inference_engine.infer_query(query_question)
print(result)
```

推理过程（概念层面）为：

1. 在前提中找到两条事实：

   * `parent(Alice, Bob) = true_const`
   * `parent(Bob, Carie) = true_const`
2. 利用规则 R1，匹配到 `X = Alice, Y = Bob, Z = Carie`，推出：

   * `grandparent(Alice, Carie) = true_const`
3. 回答查询 `grandparent(Alice, X) = true_const ?` 时，给出解：

   * `X = Carie`。

---

## 9. 完整示例代码

```python
from kele.knowledge_bases.builtin_base.builtin_concepts import BOOL_CONCEPT
from kele.syntax import (
    Constant,
    Variable,
    Concept,
    Operator,
    CompoundTerm,
    Assertion,
    Rule,
    Formula,
)
from kele.main import InferenceEngine, QueryStructure

# === 概念 ===
Person = Concept("Person")

# === 布尔常量：true_const ===
true_const = Constant("true_const", BOOL_CONCEPT)

# === 算子（Operator）===
parent_op = Operator(
    "parent",
    input_concepts=[Person, Person],
    output_concept=BOOL_CONCEPT
)

grandparent_op = Operator(
    "grandparent",
    input_concepts=[Person, Person],
    output_concept=BOOL_CONCEPT
)

# === 变量 ===
X = Variable("X")
Y = Variable("Y")
Z = Variable("Z")

# === 个体常量（人名） ===
alice = Constant("Alice", Person)
bob   = Constant("Bob", Person)
carie = Constant("Carie", Person)

# === 初始事实（Facts）===
facts = [
    Assertion(
        CompoundTerm(parent_op, [alice, bob]),
        true_const
    ),
    Assertion(
        CompoundTerm(parent_op, [bob, carie]),
        true_const
    ),
]

# === 规则（Rule）===
# parent(X, Y) = true_const ∧ parent(Y, Z) = true_const
#   → grandparent(X, Z) = true_const
R1 = Rule(
    head=Assertion(
        CompoundTerm(grandparent_op, [X, Z]),
        true_const
    ),
    body=Formula(
        Assertion(
            CompoundTerm(parent_op, [X, Y]),
            true_const
        ),
        "AND",
        Assertion(
            CompoundTerm(parent_op, [Y, Z]),
            true_const
        ),
    )
)

rules = [R1]

# === 查询（Query）===
query_question = QueryStructure(
    premises=facts,
    question=[
        Assertion(
            CompoundTerm(grandparent_op, [alice, X]),
            true_const
        )
    ]
)

# === 推理引擎 ===
inference_engine = InferenceEngine(
    facts=[],  # 本例中不使用全局 facts
    rules=rules
)

result = inference_engine.infer_query(query_question)
print(result)
```
