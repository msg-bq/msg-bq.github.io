---
title: 快速开始
---

# Quick Start

---

在安装完成后运行

```markdown
python _examples/relationship.py --log_level RESULT
```

下面我们将详细分析 relationship 示例。

讲解顺序如下：

1. 问题与目标
2. 概念 / 算子建模（Concept / Operator）
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
> * 如果 `X` 是 `Y` 的父母，并且 `Y` 是 `Z` 的父母，则 `X` 是 `Z` 的祖父母。（由两个 `parent(...) = True` 断言的传递推理）
>
> 问题：
>
> * **Alice 是谁的祖父母？**（`grandparent(Alice, X) = True`）

逻辑上，我们希望推导出结论：

```text
grandparent(Alice, Carie) = True
```

---

## 2. 导入基础类型与推理引擎入口

示例使用了以下核心类型：

* `Concept`：概念（类型），如 `Person`
* `Operator`：算子，如 `parent` 与 `grandparent`
* `Variable` / `Constant`：变量与常量
* `CompoundTerm`：复合项（算子 + 参数）
* `Assertion`：断言，形式为 `t1 = t2`
* `Rule`：规则（head + body）
* `InferenceEngine`, `QueryStructure`：推理引擎与查询结构

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

本例的领域中只有两种对象：**人**与**布尔值**。
它们分别由两个 `Concept` 表示：

```python
# === Concept: Person (human) ===
Person = Concept("Person")
from kele.knowledge_bases.builtin_base.builtin_concepts import BOOL_CONCEPT  # already built into the system
```

### 3.2 算子建模：`parent` 与 `grandparent`

我们需要两个二元算子：

1. `parent(X, Y)`：X 是 Y 的父母。该算子仅用于表达关系，因此输出设为布尔值。
2. `grandparent(X, Y)`：X 是 Y 的祖父母。该算子仅用于表达关系，因此输出设为布尔值。

二者输入均为两个 `Person`，输出为 `BOOL_CONCEPT`。

```python
# === Operators (Operator) ===
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

在此时，`parent_op` / `grandparent_op` 只是算子的名字。你随后通过 `CompoundTerm(operator, [args...])` 构造项，并进一步通过项构造断言。

---

## 4. 常量与变量建模

### 4.1 变量：`X`, `Y`, `Z`

为将规则泛化到任意人，我们引入三个变量：

```python
# === Variables ===
X = Variable("X")
Y = Variable("Y")
Z = Variable("Z")
```

这些变量出现在规则的算子参数位置上，表示“满足概念约束的任意值”。

### 4.2 具体常量：`Alice`, `Bob`, `Carie`, `true_const`

具体人名用带 `Person` 概念的 `Constant` 表示：

```python
# === Individual constants (names) ===
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

逻辑表示为：

```text
parent(Alice, Bob) = true_const
parent(Bob, Carie) = true_const
```

在代码中，每条事实是一个 `Assertion(t1, t2)`：

* `t1`：`CompoundTerm(parent_op, [alice, bob])`
* `t2`：`True`（即 `true_const`）

```python
# === Initial facts (Facts) ===
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

这样，事实被统一编码为显式的等式形式 `t1 = t2`。

---

## 6. 规则建模（Rule + Formula）

### 6.1 从自然语言到逻辑形式

规则内容：

> 如果 X 是 Y 的父母，且 Y 是 Z 的父母，则 X 是 Z 的祖父母。

转成逻辑公式：

```text
parent(X, Y) = true_const, parent(Y, Z) = true_const
  → grandparent(X, Z) = true_const
```

### 6.2 用 `Assertion` 表示前提（body）

前提由两个 `Assertion` 组成：

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

### 6.3 用 `Assertion` 表示结论（head）

结论是一个 `Assertion`：

```python
head = Assertion(
    CompoundTerm(grandparent_op, [X, Z]),
    true_const
)
```

### 6.4 合成为规则 `Rule`

将 `head` 与 `body` 包装成规则对象：

```python
# === Rule (Rule) ===
# parent(X, Y) = true_const ∧ parent(Y, Z) = true_const
#   → grandparent(X, Z) = true_const
R1 = Rule(
    head=head,
    body=body
)

rules = [R1]
```

至此，一条自然语言规则已完成编码。

---

## 7. 构造查询（QueryStructure）

本例中的问题是：

> Alice 是谁的祖父母？

逻辑写作：

```text
grandparent(Alice, X) = true_const ?
```

即，找出使 `grandparent(Alice, X)` 为真的 `X`。

构造对应断言：

```python
query_assertion = Assertion(
    CompoundTerm(grandparent_op, [alice, X]),
    true_const
)
```

然后将事实与查询包装为 `QueryStructure`：

```python
# === Query (Query) ===
query_question = QueryStructure(
    premises=facts,             # premises (facts) used in this query
    question=[query_assertion]  # proposition to ask: grandparent(Alice, X) = true_const ?
)
```

---

## 8. 调用推理引擎（InferenceEngine）

最后，构造推理引擎实例并执行查询。

```python
# === Inference engine ===
inference_engine = InferenceEngine(
    facts=[],   # this example does not use global facts; all facts are placed in QueryStructure.premises
    rules=rules
)

result = inference_engine.infer_query(query_question)
print(result)
```

推理过程（概念上）如下：

1. 在前提中找到两条事实：

   * `parent(Alice, Bob) = true_const`
   * `parent(Bob, Carie) = true_const`
2. 使用规则 R1，匹配得到 `X = Alice, Y = Bob, Z = Carie`，并推出：

   * `grandparent(Alice, Carie) = true_const`
3. 当回答查询 `grandparent(Alice, X) = true_const ?` 时，返回解：

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

# === Concepts ===
Person = Concept("Person")

# === Boolean constant: true_const ===
true_const = Constant("true_const", BOOL_CONCEPT)

# === Operators (Operator) ===
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

# === Variables ===
X = Variable("X")
Y = Variable("Y")
Z = Variable("Z")

# === Individual constants (names) ===
alice = Constant("Alice", Person)
bob   = Constant("Bob", Person)
carie = Constant("Carie", Person)

# === Initial facts (Facts) ===
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

# === Rule (Rule) ===
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

# === Query (Query) ===
query_question = QueryStructure(
    premises=facts,
    question=[
        Assertion(
            CompoundTerm(grandparent_op, [alice, X]),
            true_const
        )
    ]
)

# === Inference engine ===
inference_engine = InferenceEngine(
    facts=[],  # this example does not use global facts
    rules=rules
)

result = inference_engine.infer_query(query_question)
print(result)
```
