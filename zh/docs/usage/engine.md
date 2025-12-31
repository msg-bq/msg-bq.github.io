---
title: Engine
parent: Usage
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
from al_inference_engine.main import InferenceEngine

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
````

如果你在初始化时将 `facts=None` 或 `rules=None`，引擎会使用配置中 `Args.path.fact_dir` / `Args.path.rule_dir` 指定的默认路径。


## 3. 创建 InferenceEngine

`InferenceEngine` 是推理引擎的核心类。创建时需要指定：

* 初始事实 `facts`
* 规则列表 `rules`

```python
from al_inference_engine.main import InferenceEngine

inference_engine = InferenceEngine(
    facts=[fact1, fact2, fact3],
    rules=[rule1, rule2, rule3],
)
# 初始事实为 fact1, fact2, fact3；规则为 rule1, 

```
## 4. 执行推理查询

使用 `QueryStructure` 指定查询问题后，可调用 `infer_query` 执行推理：

```python
from al_inference_engine.main import QueryStructure

querystructure_1 = QueryStructure(
    premises=premise_list,     # 前提/已知事实（Assertion 列表），会在本次推理开始时强制加入 FactBase
    question=question_list     # 待求解的问题（FACT_TYPE 列表）
)

result = inference_engine.infer_query(querystructure_1)

# 你可以根据返回值做判断 / 统计
print(result.status, result.solution_count)
```

* `infer_query` 返回 `EngineRunResult`（包含 `status` / `solution_count` / `solutions` / `final_facts` 等字段）。
* `result.solutions` 只有在配置里开启 `Args.run.save_solutions=True` 时才会保存详细绑定；否则通常只保证 `solution_count` 可用。
* `result.final_facts` 是否包含事实由配置 `Args.run.include_final_facts` 控制；若关闭则会是空列表。你也可以用 `engine.get_facts()` 随时读取当前 `FactBase` 的全量事实（但并非所有能由等词公理推出的事实）。
* 推理过程与结果依然会通过日志输出。
* 对于给定的查询问题，引擎存在三种 `mode` 可供选择以输出结果:
  * **交互式模式**:按 `;` 继续,按回车提交,否则退出
  * **一个解模式**:直接输出第一个解
  * **所有解模式**:直接输出所有解
  * 详细配置说明见 [interactive_query_mode]({% link docs/usage/config.md %}#7-interactive_query_mode)



## 5. 使用 resume 做持续推理

有时你希望：

1. 先跑一轮推理；
2. 在外部根据结果加工出新的事实；
3. 将这些新事实加入引擎后，**在上一轮的基础上继续推理，而不是从头再来**。

此时可以使用 `resume=True`：

```python
# 第一次推理：从头开始（首次必须 resume=False）
result_first = engine.infer_query(query, resume=False)

# 需要事实时：
# - 若开启了 Args.run.include_final_facts=True，可直接用 result_first.final_facts
# - 否则用 engine.get_facts() 读取 FactBase 当前全量事实
facts_after_first = result_first.final_facts  # or: engine.get_facts()

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

* 续接推理时不会重置 `FactBase` / `RuleBase` / 等价类信息；
* 日志会被分成两段记录（两次外层调用），时间统计需要结合上下文理解。

---

## 6. 如何查看推理情况

* `infer_query` 的返回值是 `EngineRunResult`：可直接查看 `status` / `has_solution` / `solution_count` / `iterations` / `executor_steps` 等字段；需要事实时可用 `result.final_facts`（取决于 `Args.run.include_final_facts`）或 `engine.get_facts()`。
* 如需推理路径，建议开启 `trace` 并通过日志 / trace 输出查看；当前接口不保证直接返回完整的推理路径结构，细节见 [trace]({% link docs/usage/config.md %}#4-trace)。
* 实际使用中，也推荐通过日志（以及 trace / metrics）来查看其他信息：
  * 是否成功得到目标事实（问题是否被解决、是否有解）；
  * 规则应用的顺序、推理路径、迭代次数等信息。
## 7. 调试与常见问题

1. **怎么看推理到底有没有「命中」问题？**

   * 关注日志中由 `main_loop_manager` 输出的终止状态，例如是否达成目标、是否达到迭代上限等；

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
