---
title: Config
parent: Usage
layout: page
nav_order: 10

---
# 配置参数说明

---


## 一、整体结构概览

* `Config` 是**顶层配置入口**，包含 6 个子配置块：

  * `run`：运行控制
  * `strategy`：推理策略
  * `grounder`：grounder 相关
  * `executor`：executor 相关
  * `path`：路径配置
  * `engineering`：知识库相关
* `config`：可选配置文件路径（`.yaml/.yml/.json`），用于从文件加载配置。

**同一个字段如果同时在命令行和配置文件中设置，以命令行为准**。
{: .note}

---

## 二、RunControl：运行控制参数

```python
@dataclass
class RunControlConfig:
    """Runtime control."""
    iteration_limit: int = 300
    time_limit: int = 3000  # (WIP) 超时终止逻辑暂未接入
    log_level: Literal['DEBUG', 'INFO', 'RESULT', 'WARNING', 'ERROR', 'CRITICAL'] = 'INFO'
    trace: bool = False
    parallelism: bool = False  # (WIP) 是否启用并行，暂未接入
    semi_eval_with_equality: bool = True
    interactive_query_mode: Literal['interactive', 'first', 'all'] = 'first'
    save_solutions: bool = False
    include_final_facts: bool = False
```

### 1. `iteration_limit`

* **类型**：`int`
* **默认值**：`300`
* **含义**：
  推理循环的**最大轮数**。一轮指一个 “实例化 → 执行” 的完整循环，即给定若干条事实和若干条规则，每条规则独立进行实例化并保存前提为真时的实例化结论。达到此轮数仍未终止，系统会认为超时并中止推理。
在默认设置时，一轮对应一条规则的执行。
---

### 2. `time_limit`

* **类型**：`int`
* **默认值**：`3000`（秒）
* **含义**：
  推理过程的**时间上限**（秒）。当前版本该字段作为配置项保留

---

### 3. `log_level`

* **取值范围**：`'DEBUG', 'INFO', 'RESULT', 'WARNING', 'ERROR', 'CRITICAL'`
* **默认值**：`'INFO'`
* **含义**：
  控制日志级别，日志会同时输出到文件和控制台。
* 
* **各级别含义**（约定）：

  * `DEBUG`：输出最详细的调试信息（包括底层细节）。
  * `INFO`：常规运行信息（推荐默认）。
  * `RESULT`：自定义级别（25），只输出推理中止状态与推理结果等结论性内容。
  * `WARNING`：仅输出警告和以上级别。
  * `ERROR`：仅输出错误和致命错误。
  * `CRITICAL`：仅输出致命错误。

---

### 4. `trace`

* **类型**：`bool`
* **默认值**：`False`
* **含义**：
  是否开启推理路径追踪（与 `Inference_Path` 功能配合使用）。开启后，会记录规则应用、生成新事实的过程等。
* **影响**：

  * 便于调试、可视化推理过程。
  * 会带来明显性能开销。

设置 `--trace=True` 时，引擎会记录完整的推理过程。推理结束后，可通过 `Inference_Path` 获取推理路径并生成可视化图。

```python
from kele.control.infer_path import Inference_Path

path, terminal = Inference_Path.get_infer_graph()
Inference_Path.generate_infer_path_graph(path, terminal)
# 推理路径图将生成 infer_path.html 保存在工作目录下
```

若只想查看某个特定 `Assertion` 的推理路径：

```python
from kele.control.infer_path import Inference_Path

path, terminal = Inference_Path.get_infer_graph(assertion_1)
Inference_Path.generate_infer_path_graph(path, terminal)
# 在生成图的同时，引擎会在日志中打印该 Assertion 的推理路径
```

---

### 5. `parallelism`

* **类型**：`bool`
* **默认值**：`False`
* **含义**：
  是否启用并行计算。具体并行细节取决于 grounder/executor 实现。

---

### 6. `semi_eval_with_equality` 

* **类型**：`bool`
* **默认值**：`True`
* **含义**：
  在半朴素求值（semi-evaluation）阶段是否考虑**等词公理**（equality axioms）。
* **效果**：

  * `True`：考虑等词公理，推理更完整，但会引入额外性能开销。
  * `False`：在不需要等价推理的场景，部分关闭相关计算，用于性能优化。

---

### 7. `interactive_query_mode`

* **类型**：`Literal['interactive', 'first', 'all']`
* **默认值**：`'first'`
* **含义**：
  控制推理引擎输出查询结果的模式。
* **取值说明**：

  * `'interactive'`（交互式模式）：
    * 每找到一个解后暂停，等待用户输入
    * 按 `;` 继续寻找下一个解
    * 按回车提交当前结果并结束
    * 其他输入则退出查询
  * `'first'`（一个解模式）：
    * 找到第一个满足条件的解后立即停止
    * 直接输出该解
  * `'all'`（所有解模式）：
    * 穷尽所有可能的解
    * 一次性输出所有满足条件的结果

* **使用建议**：
  * 调试或探索性查询：使用 `'interactive'` 模式，逐步查看结果
  * 只需一个答案的场景：使用 `'first'` 模式，提升性能（默认）
  * 需要完整结果集：使用 `'all'` 模式

---

### 8. `save_solutions`

* **类型**：`bool`
* **默认值**：`False`
* **含义**：是否记录和返回找到的解。设置为False时，找到的解只会记录在终端和日志中。
---

### 9. `include_final_facts`

* **类型**：`bool`
* **默认值**：`False`
* **含义**：
  控制推理引擎返回的 `EngineRunResult` 是否包含 `final_facts` 字段。

  * `False`：`final_facts` 为空列表（不返回最终事实内容），但 `fact_num` 仍然会返回最终事实数量。
  * `True`：`final_facts` 会返回推理终止时 fact_base 中的全部事实（初始事实 + 推理派生事实）。

* **使用建议**：
  * 日常/生产运行建议保持 `False`（避免返回体过大）。
  * 调试、分析推理结果或需要导出完整事实库时设为 `True`。

* **补充**：
  也可以在序列化时通过 `EngineRunResult.to_dict(include_final_facts=...)` 临时控制是否输出 `final_facts`。


## 三、InferenceStrategy：推理策略与模型行为

```python
@dataclass
class InferenceStrategyConfig:
    """Inference strategy and model behavior."""
    select_rules_num: int | Literal[-1] = -1
    select_facts_num: int | Literal[-1] = -1
    grounding_rule_strategy: Literal['SequentialCyclic', 'SequentialCyclicWithPriority'] = "SequentialCyclic"
    grounding_term_strategy: Literal['Exhausted'] = "Exhausted"
    question_rule_interval: int = 1
```

### 1. `select_rules_num`

* **类型**：`int | -1`
* **默认值**：`-1`
* **含义**：
  在引擎推理之前，从已知规则中选取**用于推理的规则数量上限**。

  * `-1`：不限制，使用全部规则。
  * `>=1`：每轮最多只从规则集中选取这么多规则参与。

> 本参数控制的是初始规则数量，丢弃的规则无法在后续推理中使用。在没有性能良好的挑选机制时，一般设置为-1。

---

### 2. `select_facts_num`

* **类型**：`int | -1`
* **默认值**：`-1`
* **含义**：
  在引擎推理之前，从已知事实中选取**用于推理的事实数量上限**。

  * `-1`：不限制，使用全部事实。
  * `>=1`：每轮只用一部分事实参与推理。

> 本参数控制的是初始事实数量，丢弃的事实难以在后续推理中被推出。在没有性能良好的挑选机制时，一般设置为-1。

---

### 3. `grounding_rule_strategy`

* **类型**：`'SequentialCyclic', 'SequentialCyclicWithPriority'`（允许通过继承`RuleSelectionStrategy`自定义）
* **默认值**：`"SequentialCyclic"`
* **含义**：
  在 grounding 阶段选择规则的策略：

  * `SequentialCyclic`：顺序轮询所有规则，即依次遍历，循环使用。
  * `SequentialCyclicWithPriority`：在顺序轮询基础上考虑规则优先级（具体优先级策略由输入决定）。

---

### 4. `grounding_term_strategy`

* **类型**：`'Exhausted'`（允许通过继承`TermSelectionStrategy`自定义）
* **默认值**：`"Exhausted"`
* **含义**：
  在 grounding 中选择 term 的策略。目前支持 `"Exhausted"`，表示使用所有已知事实进行推理。

---

## 四、GrounderConfig：Grounder 相关参数

```python
@dataclass
class GrounderConfig:
    """Grounder相关参数"""
    grounding_rules_num_every_step: int | Literal[-1] = -1
    grounding_facts_num_for_each_rule: int | Literal[-1] = -1
    allow_unify_with_nested_term: bool = True
    drop_variable_node: bool = True  # (WIP) 具体行为依赖 grounder 实现
    conceptual_fuzzy_unification: bool = True
```

### 1. `grounding_rules_num_every_step`

* **类型**：`int | -1`
* **默认值**：`-1`
* **含义**：
  每一个 grounding 步骤中，最多选择多少条规则进行实例化。
* **使用建议**：

  * 结合 `InferenceStrategy.select_rules_num` 一起理解：

    * `select_rules_num` 控制初始规则子集；
    * `grounding_rules_num_every_step` 对于每一个iteration，控制 grounder 内部每次实例化多少条规则。

---

### 2. `grounding_facts_num_for_each_rule`

* **类型**：`int | -1`
* **默认值**：`-1`
* **含义**：
  对每一条规则，在 grounding 时最多使用多少个事实进行匹配。

---

### 3. `allow_unify_with_nested_term`

* **类型**：`bool`
* **默认值**：`True`
* **含义**：
  是否允许 `Variable` 与**嵌套的 `CompoundTerm`** 做 unification。
* **效果**：

  * `True`：变量可以被替换为 `CompoundTerm`，使得规则能够匹配更复杂结构。
  * `False`：变量只与非复合项绑定，unification 更简单、速度更快，但completeness会有一定损失。

---

## 五、ExecutorConfig：Executor 相关参数

```python
@dataclass
class ExecutorConfig:
    """Executor相关参数"""
    executing_rule_num: int | Literal[-1] = -1
    executing_max_steps: int | Literal[-1] = -1
    anti_join_used_facts: bool = True
```

### 1. `executing_rule_num`

* **类型**：`int | -1`
* **默认值**：`-1`
* **含义**：
  每轮 executor 实际执行的**实例化规则**数量上限。
* **说明**：

  * 与 `InferenceStrategy.select_rules_num` / `GrounderConfig.grounding_rules_num_every_step` 共同组成对推理规模的多层限制。

> 丢弃的实例化规则难以在后续推理中被重新生成，因此在没有性能良好的挑选机制时，一般设置为-1。

---

### 2. `executing_max_steps`

* **类型**：`int | -1`
* **默认值**：`-1`
* **含义**：
  允许最多执行的实例化规则数，与全局的 `iteration_limit` 区别开，是更细粒度的限制。
---

### 3. `anti_join_used_facts`

* **类型**：`bool`
* **默认值**：`True`
* **含义**：
  是否对“已经生成过的实例化规则”做简单的差集，**避免重复使用相关事实生成同样的结果**。
* **效果**：
  * `True`：记录上一次为真的结果，与当前结果做 anti-join，用于丢弃重复事实。
    * 重复事实很多时：可以明显提升效率。
    * 重复事实很少时：维护这套记录本身有开销，可能略微变慢。
  * `False`：不做 anti-join，逻辑简单但可能不断生成重复事实。

---

## 六、PathConfig：路径与资源依赖配置

```python
@dataclass
class PathConfig:
  """路径与资源依赖配置"""
  rule_dir: str = './'
  fact_dir: str = './'
  log_dir: str = './log'
```

### 1. `rule_dir`

* **类型**：`str`
* **默认值**：`'./'`
* **含义**：
  规则文件所在目录路径。可用于加载外部规则文件（例如 `.py` 或某种规则 DSL）。

### 2. `fact_dir`

* **类型**：`str`
* **默认值**：`'./'`
* **含义**：
  初始事实文件所在目录路径。

### 3. `log_dir`

* **类型**：`str`
* **默认值**：`'./log'`
* **含义**：
  日志文件输出目录。`_init_logger` 会在该目录下创建形如 `{run_id}_run.log` 的日志文件。
* **注意**：

  * 目录如果不存在，会自动创建。
  * 可根据部署环境改成绝对路径（如 `/var/log/kele`）。

---

## 七、KBConfig（engineering）：知识库相关参数

```python
@dataclass
class KBConfig:
    """知识库相关参数"""
    fact_cache_size: int | Literal[-1] = -1
    close_world_assumption: bool = True
```

### 1. `fact_cache_size`（WIP）

* **类型**：`int | -1`
* **默认值**：`-1`
* **含义**：
  知识库中事实库的大小限制。

  * `-1`：不限制大小。
  * `>=0`：容量上限，具体策略由底层实现决定（例如 LRU）。

> 丢弃的事实需要再后续推理中重新推出，带来更高的耗时

---

### 2. `close_world_assumption`

* **类型**：`bool`

* **默认值**：`True`

* **含义**：
  是否采用**封闭世界假设（Closed World Assumption, CWA）**：

  * `True`：凡是事实库中没有记录的事实，默认为 **False**，而不是 Unknown。
  * `False`：尝试向开放世界假设靠拢，但目前支持尚不完善。

* **使用建议**：

  * 目前建议保持 `True`，以获得行为稳定、语义清晰的封闭世界。
  * 如需实验开放世界行为，请知悉其语义暂不完整，仅供试验。

---

## 八、顶层 Config 及配置文件机制

### 1. Config 字段汇总

```python
@dataclass
class Config:
    run: OmitArgPrefixes[RunControlConfig]
    strategy: OmitArgPrefixes[InferenceStrategyConfig]
    grounder: OmitArgPrefixes[GrounderConfig]
    executor: OmitArgPrefixes[ExecutorConfig]
    path: OmitArgPrefixes[PathConfig]
    engineering: OmitArgPrefixes[KBConfig]
    config: str | None = None  # 配置文件路径
```

* `run`：见上文 RunControl。
* `strategy`：见 InferenceStrategy。
* `grounder`：见 GrounderConfig。
* `executor`：见 ExecutorConfig。
* `path`：见 PathConfig。
* `engineering`：见 KBConfig。
* `config`：

  * **类型**：`str | None`
  * **含义**：命令行中指定的配置文件路径（相对或绝对）。
  * **支持格式**：`.yaml` / `.yml` / `.json`。

### 2. 配置文件加载流程

1. 命令行解析：

   ```python
   cli_config, unknown = tyro.cli(Config, return_unknown_args=True)
   ```

   未识别的参数会给出 warning 并被忽略。

2. 如果 `cli_config.config` 不为空，则调用 `_load_config_file` 读取文件：

   * YAML：`yaml.safe_load`
   * JSON：`json.load`

3. 合并配置：先用配置文件构造默认 `Config`，再用 `tyro.cli(..., default=...)` 解析命令行并覆盖默认值：

   * 字段级别：**命令行（CLI）覆盖配置文件**（配置文件作为默认/兜底）。

4. 生成最终 `Config` 实例，并基于其中参数初始化 logger。

---

### 3. 示例：完整 YAML 配置模板

下面是一个可供文档或用户参考的示例：

```yaml
# config.yaml

run:
  iteration_limit: 500
  time_limit: 600
  log_level: "INFO"        # DEBUG / INFO / RESULT / WARNING / ERROR / CRITICAL
  trace: false
  parallelism: false
  semi_eval_with_equality: true

strategy:
  select_rules_num: -1
  select_facts_num: -1
  grounding_rule_strategy: "SequentialCyclic"      # or SequentialCyclicWithPriority
  grounding_term_strategy: "Exhausted"

grounder:
  grounding_rules_num_every_step: -1
  grounding_facts_num_for_each_rule: -1
  allow_unify_with_nested_term: true
  drop_variable_node: true

executor:
  executing_rule_num: -1
  executing_max_steps: -1
  anti_join_used_facts: true

path:
  rule_dir: "./rules"
  fact_dir: "./facts"
  log_dir: "./log"

engineering:
  fact_cache_size: -1
  close_world_assumption: true
```

配置文件运行方式示例：

```bash
python -m examples.relationship --config config.yaml
# 如有命令行同时传入 run.* 等字段，以命令行值为准（命令行优先）
```


命令行调用示例

```bash
python main.py --trace True --log_level DEBUG
# 开启推理过程跟踪，日志级别设为 DEBUG
```
