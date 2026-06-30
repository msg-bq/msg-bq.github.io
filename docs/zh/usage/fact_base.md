---
title: 事实库
---

# 事实库

---

## I. 它是什么

Fact Base 是推理过程中使用的事实集合，里面可以包含：

* 预先给定的领域事实
* 从外部系统导入的事实
* 推理过程中不断派生出来的新事实

在当前实现里，主要可以理解为两层：

* `facts`：系统知道的完整事实集合
* `cur_facts`：某一轮推理里当前实际参与计算的事实子集

---

## II. 输入方式

### 2.1 当前 main 的文件形式

当前 `main` 分支下，基于路径的事实加载走的是 `kele/knowledge_bases/ast_io.py` 里的 `load_knowledge_base(path)`。

支持的文件格式：

* `.yaml`
* `.yml`
* `.json`

支持的路径形式：

* 单个文件
* 包含上述文件的目录

当前主线要求事实文件采用 AST 形状。一个最小 YAML 示例是：

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

说明：

* 当前主线认的是 AST 风格的 YAML / JSON。
* `Facts` 中每一项真正被读取的是 `content` 字段。
* `content` 必须能解析成 `Assertion`。
* `FactBase` 在存储时仍然会检查自由变量，所以实际 fact 文件应保持为 ground facts。
* `FactID`、自定义元数据等字段可以放在文件里，但运行时真正依赖的是能构造语法对象的 AST 内容。

同一个 YAML / JSON 文件里也可以同时包含 `Concepts` 和 `Operators`，因为 `load_knowledge_base(...)` 会一起读取这些 section。

如果通过引擎加载 facts，入口仍然是：

```python
from kele.main import InferenceEngine

engine = InferenceEngine(
    facts="path/to/facts.yaml",
    rules=[rule1, rule2],
    concept_dir_or_path="path/to/concepts.yaml",
    operator_dir_or_path="path/to/operators.yaml",
)
```

### 2.2 Python 代码

在 Python 中，事实通常直接写成 `Assertion` 对象。
