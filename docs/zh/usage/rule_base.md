---
title: 规则库
---

# 规则库

---

## I. 它是什么

Rule Base 用来存放推理引擎中的抽象规则。可以把一条规则简单理解为：

```text
在这些条件下，可以推出这个结论
```

和会在单次推理中不断增长的 facts 不同，rules 通常是相对稳定的领域知识。

---

## II. 输入方式

### 2.1 当前 main 的文件形式

当前 `main` 分支下，基于路径的规则加载同样走 `kele/knowledge_bases/ast_io.py` 里的 `load_knowledge_base(path)`。

支持的格式：

* `.yaml`
* `.yml`
* `.json`

一个最小 YAML 示例是：

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

说明：

* 当前主线用 AST 风格的 YAML / JSON 作为规则文件接口。
* `head` 可以是单个 assertion 节点，也可以是 assertion 列表。
* `body` 可以是单个 fact/formula 节点，也可以是 fact 节点列表。
* formula 也走 AST 节点结构。
* 规则名通常放在 `id` 或 `name` 字段里。

规则仍然可以通过文件或目录路径加载：

```python
from kele.main import InferenceEngine

engine = InferenceEngine(
    facts=[fact1, fact2],
    rules="path/to/rules.yaml",
    concept_dir_or_path="path/to/concepts.yaml",
    operator_dir_or_path="path/to/operators.yaml",
)
```

### 2.2 Python 代码

在 Python 中，规则通过 `Rule` 类构造。
