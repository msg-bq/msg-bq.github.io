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
4. 执行推理并查看结果日志  

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
# 初始事实为 fact1, fact2, fact3；规则为 rule1, rule2, rule3
```

## 4. 执行推理查询

使用 `QueryStructure` 指定查询问题后，可调用 `infer_query` 执行推理：

```python
from al_inference_engine.main import QueryStructure

querystructure_1 = QueryStructure(
    premises=fact_list_foo,   # 前提事实集
    question=fact_list_bar    # 待求解的问题集
)

inference_engine.infer_query(querystructure_1)
```

* `infer_query` 会返回整个 `FactBase` 的所有事实，一般无需手动处理返回值。
* 推理结果会通过日志输出。
* 对于给定的查询问题，引擎在找到**一个**可行解后将停止，不会穷举所有可能解（后续需要优化）。




## 5. 使用 continue_infer 做持续推理

有时你希望：

1. 先跑一轮推理；
2. 在外部根据结果加工出新的事实；
3. 将这些新事实加入引擎后，**在上一轮的基础上继续推理，而不是从头再来**。

此时可以使用 `continue_infer=True`：

```python
# 第一次推理：从头开始
facts_after_first = engine.infer_query(query, continue_infer=False)

# 外部根据结果生成一些新事实
new_fact1 = ...
new_fact2 = ...
engine.fact_base.add_facts([new_fact1, new_fact2], force_add=True)

# 第二次推理：在上一轮状态基础上继续
facts_after_second = engine.infer_query(query, continue_infer=True)
```

注意事项：

* 续接推理时不会重置 `FactBase` / `RuleBase` / 等价类信息；
* 日志会被分成两段记录（两次外层调用），时间统计需要结合上下文理解。

---

## 6. 如何查看推理情况

* `infer_query` 的返回值是终止时整个 `FactBase` 中的所有事实，一般无需逐条手动处理；
*  通过`Inference_Path`可以返回推理路径（待优化，目前不支持question为空时的查询），细节见[trace]({% link docs/usage/config.md %}#4-trace)介绍
* 实际使用中，也推荐通过日志（以及 trace / metrics）来查看其他信息：
  * 是否成功得到目标事实（问题是否被解决）；
  * 规则应用的顺序、推理路径、迭代次数等信息。

---

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

