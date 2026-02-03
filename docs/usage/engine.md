---
title: 引擎
---

# 推理引擎的创建与运行

---

## 1. 工作流程

1. 准备事实与规则
2. 创建推理引擎 `InferenceEngine`
3. 构造 `QueryStructure`
4. 执行推理并查看结果（EngineRunResult）与日志

> 注意：示例中的 `fact_x` / `rule_x` 只是占位符，请替换为你项目里的真实事实与规则对象。

## 2. 准备事实与规则

`InferenceEngine` 支持两种加载知识的方式：

1. **直接传入 Python 列表**：适合在代码中动态构造事实 / 规则
2. **传入目录或文件路径（str）**：由内部 `FactBase` / `RuleBase` 自动加载

```python
from kele.main import InferenceEngine

# 假设已经用 syntax 模块定义了一些事实与规则
# 例如：fact_is_human(alice) / rule_human_is_mortal 等
fact1 = ...
fact2 = ...
rule1 = ...
rule2 = ...

# 方式 1：通过列表构造引擎
engine = InferenceEngine(
    facts=[fact1, fact2],
    rules=[rule1, rule2],
)

# 方式 2：从目录或文件加载（内部会根据路径初始化 FactBase / RuleBase）
# engine = InferenceEngine(
#     facts="path/to/facts_dir_or_file",
#     rules="path/to/rules_dir_or_file",
# )
```

若 `facts=None` 或 `rules=None`，引擎会使用配置中的默认路径 `Args.path.fact_dir` / `Args.path.rule_dir`。

## 3. 创建 InferenceEngine

`InferenceEngine` 是推理引擎的核心类。创建时需要指定：

* 初始事实 `facts`
* 规则列表 `rules`

```python
from kele.main import InferenceEngine

inference_engine = InferenceEngine(
    facts=[fact1, fact2, fact3],
    rules=[rule1, rule2, rule3],
)
# 初始事实为 fact1, fact2, fact3；规则为 rule1, rule2, rule3
```

## 4. 执行一次推理查询

在通过 `QueryStructure` 指定查询后，调用 `infer_query` 执行推理：

```python
from kele.main import QueryStructure

querystructure_1 = QueryStructure(
    premises=fact_list_foo,   # premise fact set
    question=fact_list_bar    # question set to be solved
)

result = inference_engine.infer_query(querystructure_1)
```

### 4.1 输入格式：QueryStructure

`infer_query(query: QueryStructure, ...)` 的输入是 `QueryStructure`（严格模型，`extra="forbid"`），只包含两个字段：

| 字段       | 类型                  | 含义                                                                                                                                                                                         |
| ---------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `premises` | `Sequence[Assertion]` | 本次推理的前提/已知断言集合。每次运行开始时会被强制加入当前 `FactBase`（相当于 `force_add=True`），并进行自由变量检查。                                                                     |
| `question` | `Sequence[FACT_TYPE]` | 要求解的问题模式（可含变量）。引擎会寻找能使这些模式成立的变量绑定（解）。                                                                                                                   |

### 4.2 返回值：EngineRunResult

`infer_query(...)` **返回 `EngineRunResult`**，而不是直接返回事实列表。常见字段如下：

| 字段                           | 类型                                                        | 含义                                                                                                               |
| ------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `status`                       | `InferenceStatus`                                           | 终止状态（如 `SUCCESS` / `FIXPOINT_REACHED` / `MAX_*` / `EXTERNALLY_INTERRUPTED` 等）                             |
| `has_solution`                 | `bool`                                                      | 是否至少找到一个解（`solution_count > 0`）                                                                         |
| `is_success`                   | `bool \| None`                                              | 快速成功判断（内部结合 `status` 与是否有解）                                                                       |
| `is_partial_success`           | `bool \| None`                                              | 有解但由于资源限制/外部中断而提前终止（可能仍有更多解）                                                             |
| `solutions`                    | `list[Mapping[Variable, Constant \| CompoundTerm]]`         | 变量绑定列表；若 `Args.run.save_solutions=False`，该字段可能为空                                                     |
| `solution_count`               | `int`                                                       | 解的数量                                                                                                           |
| `final_facts`                  | `list[FACT_TYPE]`                                           | 仅当 `Args.run.include_final_facts=True` 时返回；否则为空列表                                                      |
| `fact_num`                     | `int`                                                       | 终止时事实总数（无论是否返回 `final_facts` 都会填充）                                                               |
| `iterations` / `executor_steps` | `int` / `int`                                               | 迭代次数 / 执行步数                                                                                                 |
| `terminated_by`                | `"initial_check" \| "executor" \| "main_loop" \| "unknown"` | 哪个阶段终止                                                                                                       |

> 获取“全部事实”的两种方式：
>
> * 若 `result.include_final_facts=True`：使用 `result.final_facts`
> * 否则：使用 `inference_engine.get_facts()`（总是返回当前 FactBase 的全部事实）

示例：

```python
result = result = inference_engine.infer_query(querystructure_1)

# 是否成功（推荐：结合 has_solution + is_success / is_partial_success）
if result.is_success:
    ...

# 获取事实
facts = result.final_facts if result.include_final_facts else inference_engine.get_facts()
```

### 4.3 输出模式与日志

* `infer_query` 会通过日志输出关键过程信息（`EngineRunResult.log_message()` 也提供总结信息）。
* 对于一个给定的查询，引擎提供三种 `interactive_query_mode` 来控制“解的输出模式”：

  * **交互模式**：按 `;` 继续，按 Enter 提交，否则退出
  * **单解模式**：直接输出第一个解
  * **全解模式**：直接输出所有解
  * 详细配置说明见 [interactive_query_mode](./config#7-interactive_query_mode)

## 5. 使用 resume 进行连续推理

有时你希望：

1. 先执行一轮推理；
2. 基于结果外部推导出新事实；
3. 将新事实加入引擎，并**在上一轮基础上继续推理，而不是重新开始**。

此时可以使用 `resume=True`：

```python
# 第一次推理：从头开始
result_first = engine.infer_query(query, resume=False)  # 第一次调用必须是 resume=False

# 基于结果外部生成新事实
new_fact1 = ...
new_fact2 = ...
querystructure_2 = QueryStructure(
    premises=[new_fact1, new_fact2],
    question=question_list
)
# 第二次推理：在上一轮基础上继续
result_second = engine.infer_query(querystructure_2, resume=True)
facts_after_second = result_second.final_facts  # 或：engine.get_facts()
```

注意事项：

* 若第一次调用就设 `resume=True`，会抛出 `ValueError`；请先用 `resume=False` 跑一遍。
* `resume=True` 表示“在上一轮引擎状态上继续”：不会重置推理状态信息，并会注入新的 `premises`；
* 若需要更换 `premises` / `rules`，请用 `resume=False` 重新开始。
* 日志会记录为两个片段（两次外层调用）；时间统计需结合上下文理解。

---

## 6. 如何查看推理状态

* `infer_query` 返回 `EngineRunResult`（见第 4 节），可通过 `status / is_success / is_partial_success / has_solution` 快速判断是否命中。
* 若需要事实：

  * 当 `result.include_final_facts=True`：直接使用 `result.final_facts`
  * 否则：使用 `inference_engine.get_facts()` 获取当前 `FactBase` 的全部事实
* 关于推理路径：

  * 建议开启 `Args.run.trace=True`，结合 trace / 日志 / metrics 来分析规则触发与推理过程（详见 [trace](./config#4-trace)）。

---

## 7. 调试与常见问题

1. **如何判断推理是否真正“命中”了问题？**

   * 建议直接查看 `EngineRunResult`：`has_solution` / `is_success` / `is_partial_success` + `status`；日志中也会输出 `result.log_message()` 总结。
   * 也可以关注日志里 `main_loop_manager` 的终止状态（是否达到目标，是否达到迭代上限等）。

2. **为什么我觉得应该能推出，但结果没有出来？**

   * 检查事实 / 规则是否正确加载（可以打印 `engine.fact_base.get_facts()` 与 `engine.rule_base.rules`）；
   * 检查 `question` 是否匹配事实中的谓词 / 术语（例如变量与常量名是否一致）；
   * 检查是否被迭代上限 `Args.run.iteration_limit` 或执行步数上限 `Args.executor.executing_max_steps` 限制。
   * 若开启了 trace，可沿推理路径分析哪条规则生效、哪条失败。

3. **如何集成到自己的项目中？**

   * 业务侧准备事实与规则（可来自配置文件、数据库、外部系统）；
   * 封装服务并暴露统一查询接口；内部构造 `QueryStructure` 并调用 `InferenceEngine.infer_query`；
   * 基于日志与 trace 输出，将推理结果映射成业务可理解结构（如可视化推理路径、返回解释文本）。
   * MCP（WIP）
   * 结合任务场景自定义事实和规则选择模块，细节见[custom modules](../custom_module)
   * 与其他工具集成等（WIP）
