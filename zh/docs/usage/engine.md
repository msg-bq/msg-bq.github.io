---
title: 推理引擎
parent: 使用指南
layout: page
nav_order: 9
---

# 创建与运行推理引擎

---

## 1. 使用流程

1. 准备事实与规则  
2. 创建推理引擎 `InferenceEngine`  
3. 构造 `QueryStructure`  
4. 执行推理并查看结果（EngineRunResult）与日志  

> 说明：示例中的 `fact_x` / `rule_x` 只是占位符，你可以替换成自己项目中的事实与规则对象。

## 2. 准备事实与规则

`InferenceEngine` 支持两种方式加载知识：

1. **直接传入 Python 列表**：适合在代码中动态构造事实 / 规则  
2. **传入目录或文件路径（str）**：由内部的 `FactBase` / `RuleBase` 自动加载


```python
from kele.main import InferenceEngine

# 假设你已经用 syntax 模块定义好了若干事实与规则
# 例如：fact_is_human(alice) / rule_human_is_mortal 等
fact1 = ...
fact2 = ...
rule1 = ...
rule2 = ...

# 方式一：从列表创建引擎
engine = InferenceEngine(
    facts=[fact1, fact2],
    rules=[rule1, rule2],
)

# 方式二：从目录或文件加载（内部会根据路径初始化 FactBase / RuleBase）
# engine = InferenceEngine(
#     facts="path/to/facts_dir_or_file",
#     rules="path/to/rules_dir_or_file",
# )
```

如果你在初始化时将 `facts=None` 或 `rules=None`，引擎会使用配置中 `Args.path.fact_dir` / `Args.path.rule_dir` 指定的默认路径。


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

## 4. 执行推理查询

使用 `QueryStructure` 指定查询问题后，可调用 `infer_query` 执行推理：

```python
from kele.main import QueryStructure

querystructure_1 = QueryStructure(
    premises=fact_list_foo,   # 前提事实集
    question=fact_list_bar    # 待求解的问题集
)

result = inference_engine.infer_query(querystructure_1)
```

### 4.1 输入格式：QueryStructure

`infer_query(query: QueryStructure, ...)` 的输入是 `QueryStructure`（严格模型，`extra="forbid"`），只包含两个字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `premises` | `Sequence[Assertion]` | 本次推理的前提/已知断言。每次运行开始会被强制加入当前 `FactBase`（等价于 `force_add=True`），并做 free variable 检查。 |
| `question` | `Sequence[FACT_TYPE]` | 待求解的问题模式（可包含变量）。引擎会寻找使这些模式成立的变量绑定（solutions）。 |

### 4.2 返回值：EngineRunResult

`infer_query(...)` **返回 `EngineRunResult`**，而不是直接返回 facts 列表。常用字段如下：

| 字段 | 类型                                                          | 含义                                                                             |
|---|-------------------------------------------------------------|--------------------------------------------------------------------------------|
| `status` | `InferenceStatus`                                           | 终止状态（如 `SUCCESS` / `FIXPOINT_REACHED` / `MAX_*` / `EXTERNALLY_INTERRUPTED` 等）。 |
| `has_solution` | `bool`                                                      | 是否找到至少一个解（`solution_count > 0`）。                                               |
| `is_success` | `bool \| None`                                              | 成功与否的快速判断（内部会结合 `status` 和是否有解）。                                               |
| `is_partial_success` | `bool \| None`                                              | 有解但由于资源限制/外部中断提前停止（可能还有更多解）。                                                   |
| `solutions` | `list[Mapping[Variable, Constant \| CompoundTerm]]`         | 变量绑定列表；若配置 `Args.run.save_solutions=False`，这里可能为空。                             |
| `solution_count` | `int`                                                       | 解的数量。                                                                          |
| `final_facts` | `list[FACT_TYPE]`                                           | 仅在 `Args.run.include_final_facts=True` 时返回；否则为空列表。                             |
| `fact_num` | `int`                                                       | 终止时 fact 总数（无论是否返回 `final_facts` 都会填充）。                                        |
| `iterations` / `executor_steps` | `int` / `int`                                               | 迭代次数 / 执行步数。                                                                   |
| `terminated_by` | `"initial_check" \| "executor" \| "main_loop" \| "unknown"` | 在哪个阶段终止。                                                                       |

> 想拿到“全量事实”有两种方式：  
> - 如果 `result.include_final_facts=True`：用 `result.final_facts`  
> - 否则：用 `inference_engine.get_facts()`（始终返回当前 FactBase 的全部事实）

示例：

```python
result = result = inference_engine.infer_query(querystructure_1)

# 是否成功（推荐：结合 has_solution + is_success / is_partial_success）
if result.is_success:
    ...

# 取事实
facts = result.final_facts if result.include_final_facts else inference_engine.get_facts()
```

### 4.3 输出模式与日志

* `infer_query` 会通过日志输出关键过程信息（同时 `EngineRunResult.log_message()` 也会给出摘要）。
* 对于给定的查询问题，引擎存在三种 `interactive_query_mode` 用于控制“解的输出方式”：
  * **交互式模式**：按 `;` 继续，按回车提交，否则退出
  * **一个解模式**：直接输出第一个解
  * **所有解模式**：直接输出所有解
  * 详细配置说明见 [interactive_query_mode]({% link docs/usage/config.md %}#7-interactive_query_mode)

## 5. 使用 resume 做持续推理

有时你希望：

1. 先跑一轮推理；
2. 在外部根据结果加工出新的事实；
3. 将这些新事实加入引擎后，**在上一轮的基础上继续推理，而不是从头再来**。

此时可以使用 `resume=True`：

```python
# 第一次推理：从头开始
result_first = engine.infer_query(query, resume=False)  # 第一次调用必须 resume=False

# 外部根据结果生成一些新事实
new_fact1 = ...
new_fact2 = ...
querystructure_2 = QueryStructure(
    premises=[new_fact1, new_fact2],
    question=question_list
)
# 第二次推理：在上一轮状态基础上继续
result_second = engine.infer_query(querystructure_2, resume=True)
facts_after_second = result_second.final_facts  # or: engine.get_facts()
```

注意事项：

* 如果在第一次调用就设置 `resume=True`，会抛出 `ValueError`；请先 `resume=False` 跑过一轮。
* `resume=True` 会被视为“在上一轮引擎状态上继续”，不会重置推理状态信息，同时会注入新的 `premises`；
* 如果你需要变更 `premises` / `rules`，请用 `resume=False` 重新开始一轮。
* 日志会被分成两段记录（两次外层调用），时间统计需要结合上下文理解。

---

## 6. 如何查看推理情况

* `infer_query` 返回 `EngineRunResult`（见第 4 节），你可以用 `status / is_success / is_partial_success / has_solution` 快速判断推理是否命中。
* 如果你需要事实：
  * `result.include_final_facts=True` 时：直接用 `result.final_facts`
  * 否则：用 `inference_engine.get_facts()` 获取当前 `FactBase` 的全量事实
* 推理路径相关：
  * 建议开启 `Args.run.trace=True`，结合 trace / 日志 / metrics 来分析规则触发与推理过程（详见 [trace]({% link docs/usage/config.md %}#4-trace)）。

---

## 7. 调试与常见问题

1. **怎么看推理到底有没有「命中」问题？**

   * 建议直接看 `EngineRunResult`：`has_solution` / `is_success` / `is_partial_success` + `status`；日志里也会打印 `result.log_message()` 摘要。
   * 同时也可以关注日志中 `main_loop_manager` 的终止状态（是否达成目标、是否达到迭代上限等）。

2. **为什么我觉得应该能推出来，但结果没出来？**

   * 检查：事实 / 规则是否正确加载（可以打印 `engine.fact_base.get_facts()` 与 `engine.rule_base.rules`）；
   * 检查：`question` 是否和事实里的谓词 / 项一致（例如变量、常量命名是否统一）；
   * 检查：是否被迭代次数 `Args.run.iteration_limit` 或执行步数 `Args.executor.executing_max_steps` 限制住。
   * 如果开启 trace，可以结合推理路径来分析哪条规则起了作用，哪些失败。

3. **如何集成到自己的项目里？**

   * 在业务侧准备好事实与规则（可从配置文件、数据库、外部系统读入）；
   * 封装一个服务，对外暴露统一的查询接口，内部构造 `QueryStructure` 并调用 `InferenceEngine.infer_query`；
   * 根据日志和 trace 输出，将推理结果映射为业务上可理解的结构（例如可视化推理路径、返回解释文本等）。
   * MCP (WIP)
   * 结合任务场景自定义事实和规则选择模块，细节见[custom modules]({% link docs/custom_module.md %})
   * 其他的一些tool之类的结合（WIP）
