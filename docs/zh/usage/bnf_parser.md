---
title: 知识库 AST I/O
---

# 知识库 AST I/O

---

## 1. 当前 main 实际使用的是什么

当前 `main` 分支使用的是基于 AST 的知识库文件加载方式。

现在主线上的文件加载核心在：

* `kele/knowledge_bases/ast_io.py`
* `kele/knowledge_bases/fact_base.py`
* `kele/knowledge_bases/rule_base.py`
* `kele/knowledge_bases/ontology_base.py`

实际含义是：

* facts / rules 通过 **YAML / YML / JSON** 的 AST 结构加载
* ontology 通过 **Python 模块** 或 **YAML / YML** 文件加载

---

## 2. 入口位置

### 1. FactBase / RuleBase

当 `FactBase` 或 `RuleBase` 接收到路径时，当前主线会调用 `load_knowledge_base(path)`。

支持的路径形式：

* 单个 `.yaml` / `.yml` / `.json` 文件
* 一个目录，目录下包含 `.yaml` / `.yml` / `.json` 文件

### 2. Ontology 加载

`load_ontologies(concept_dir_or_path, operator_dir_or_path)` 当前支持：

* `.py` 本体模块
* `.yaml` / `.yml` 本体文件

`InferenceEngine` 入口参数名仍然是：

```python
from kele.main import InferenceEngine

engine = InferenceEngine(
    facts="path/to/facts.yaml",
    rules="path/to/rules.yaml",
    concept_dir_or_path="path/to/concepts.yaml",
    operator_dir_or_path="path/to/operators.yaml",
)
```

---

## 3. 顶层 YAML / JSON 分区

AST loader 会读取这些顶层 section：

* `Concepts`
* `Operators`
* `Facts`
* `Rules`

一个文件里可以只放其中一部分，也可以混合放置。

---

## 4. 主要节点结构

### 1. Concept 条目

```yaml
Concepts:
  - id: C001
    name: Number
    comment: 数
    parent:
      - ComplexNumber
```

当前主线真正使用的字段有：

* `name`
* `parent` 或 `parents`
* `comment` 或 `description`

### 2. Operator 条目

```yaml
Operators:
  - id: OP001
    symbol: Abs
    input_type:
      - ComplexNumber
    output_type: NonNegativeNumber
    comment: 绝对值
```

当前主线真正使用的字段有：

* `symbol`
* `input_type`
* `output_type`
* `comment` 或 `description`

### 3. term 节点

```yaml
type: constant
value: Alice
concepts:
  - Person
```

```yaml
type: variable
name: X
```

```yaml
type: compound
operator: Parent
arguments:
  - {type: constant, value: Alice, concepts: [Person]}
  - {type: constant, value: Bob, concepts: [Person]}
```

### 4. assertion 节点

```yaml
type: assertion
lhs:
  type: compound
  operator: Parent
  arguments:
    - {type: constant, value: Alice, concepts: [Person]}
    - {type: constant, value: Bob, concepts: [Person]}
rhs:
  type: constant
  value: True
  concepts:
    - Bool
```

### 5. formula 节点

```yaml
type: formula
connective: AND
left:
  type: assertion
  lhs: {type: variable, name: X}
  rhs: {type: variable, name: X}
right:
  type: assertion
  lhs: {type: variable, name: Y}
  rhs: {type: variable, name: Y}
```

当前主线支持的 connective：

* `AND`
* `OR`
* `NOT`
* `IMPLIES`
* `IFF`

另外，loader 也兼容旧写法 `EQUAL`，读入时会转成 `IFF`。

---

## 5. 最小示例

### 1. Concepts

```yaml
Concepts:
  - id: C001
    name: Number
```

### 2. Operators

```yaml
Operators:
  - id: OP001
    symbol: Abs
    input_type:
      - Number
    output_type: Number
```

### 3. Facts

```yaml
Facts:
  - FactID: F0001
    content:
      type: assertion
      lhs:
        type: compound
        operator: Parent
        arguments:
          - {type: constant, value: Alice, concepts: [Person]}
          - {type: constant, value: Bob, concepts: [Person]}
      rhs:
        type: constant
        value: True
        concepts:
          - Bool
```

### 4. Rules

```yaml
Rules:
  - id: R001
    head:
      type: assertion
      lhs:
        type: compound
        operator: Grandparent
        arguments:
          - {type: variable, name: X}
          - {type: variable, name: Z}
      rhs:
        type: constant
        value: True
        concepts:
          - Bool
    body:
      - type: assertion
        lhs:
          type: compound
          operator: Parent
          arguments:
            - {type: variable, name: X}
            - {type: variable, name: Y}
        rhs:
          type: constant
          value: True
          concepts:
            - Bool
      - type: assertion
        lhs:
          type: compound
          operator: Parent
          arguments:
            - {type: variable, name: Y}
            - {type: variable, name: Z}
        rhs:
          type: constant
          value: True
          concepts:
            - Bool
    priority: 0
```

---

## 6. 当前限制与注意点

* `FactBase` 路径加载当前支持 AST 风格的 YAML / YML / JSON。
* `RuleBase` 路径加载走同一套 AST loader。
* `load_ontologies(...)` 当前只直接接通 `.py`、`.yaml`、`.yml`；JSON ontology 文件还没有接到这个入口。
* operator 条目里的 `post_fixed` 目前会被忽略，并给出 warning。
* 代码里已经明确标注 AST load / dump 仍处于 active development 状态。

---

## 7. 与其他文档的关系

建议这样分工阅读：

* [syntax](./syntax)：运行时 Python 对象
* [ontology_base](./ontology_base)：当前主线的 ontology 文件写法
* [fact_base](./fact_base)：当前主线的 fact 文件结构
* [rule_base](./rule_base)：当前主线的 rule 文件结构
* 本页：整体的文件级 AST I/O 入口和节点结构
