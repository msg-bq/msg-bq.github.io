---
title: 本体库
---

# 本体库

---

Ontology Base 包含 Concepts 和 Operators。Concept 用来描述领域里“有哪些类型的对象”，Operator 用来描述这些对象之间的关系或计算。

---

## 示例

### 1. 数学示例

**Concepts**：

* `Real`
* `Point`
* `Degree`

**Operators**：

* `Line_length(Point, Point) -> Real`
* `Angle_degree(Point, Point, Point) -> Degree`

### 2. 亲属关系示例

**Concepts**：

* `Person`

**Operators**：

* `parent(Person, Person) -> Bool`
* `grandparent(Person, Person) -> Bool`

---

## 当前 main 的文件形式

当前 `main` 支持两类 ontology 加载方式：

* Python 模块
* YAML / YML 文件

`InferenceEngine` 里对应的参数名仍然是：

* `concept_dir_or_path`
* `operator_dir_or_path`

### 1. YAML Concept 条目

```yaml
Concepts:
  - id: C001
    name: Person
    comment: 人
  - id: C002
    name: Student
    parent:
      - Person
```

当前主线真正使用的字段有：

* `name`
* `parent` 或 `parents`
* `comment` 或 `description`

### 2. YAML Operator 条目

```yaml
Operators:
  - id: OP001
    symbol: Parent
    input_type:
      - Person
      - Person
    output_type: Bool
    comment: 父母关系
```

当前主线真正使用的字段有：

* `symbol`
* `input_type`
* `output_type`
* `comment` 或 `description`

### 3. Python 本体模块

你也可以继续把 ontology 定义放在 Python 文件里，并通过 `load_ontologies(...)` 加载。

这仍然是当前主线内置 ontology 的默认组织方式。

---

## 与 Facts / Rules 的对齐

Ontology 文件里定义的 concept 和 operator 名称，应当在 facts / rules 文件里保持一致复用。

例如先定义：

```yaml
Concepts:
  - id: C001
    name: Person
Operators:
  - id: OP001
    symbol: Parent
    input_type:
      - Person
      - Person
    output_type: Bool
  - id: OP002
    symbol: Grandparent
    input_type:
      - Person
      - Person
    output_type: Bool
```

那么后续 fact / rule 的 AST 节点里就可以直接复用 `Parent`、`Grandparent`、`Person` 这些名字。

实践上建议：

* 先定义 concept 层级，再定义依赖它们的 operators
* YAML 里保持一条 list item 对应一个 ontology 条目
* ontology、facts、rules 之间复用完全一致的 concept / operator 名称
* 注意 `load_ontologies(...)` 当前直接接通的是 `.py`、`.yaml`、`.yml`；JSON ontology 文件还没有接到这个入口
