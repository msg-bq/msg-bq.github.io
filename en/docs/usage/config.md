---

title: Config
parent: Usage
layout: page
nav_order: 10

---

# Configuration Parameter Reference 

---

## I. Overall Structure Overview

* `Config` is the **top-level configuration entry**, containing 6 sub-configuration blocks:

  * `run`: runtime control
  * `strategy`: inference strategy
  * `grounder`: grounder-related
  * `executor`: executor-related
  * `path`: path configuration
  * `engineering`: knowledge base related
* `config`: optional configuration file path (`.yaml/.yml/.json`), used to load configuration from a file.

**If the same field is set both in the command line and in the configuration file, the command line takes precedence**.
{: .note}

---

## II. RunControl: Runtime Control Parameters

```python
@dataclass
class RunControlConfig:
    """Runtime control."""
    iteration_limit: int = 300
    time_limit: int = 3000  # (WIP) Timeout termination logic not yet integrated
    log_level: Literal['DEBUG', 'INFO', 'RESULT', 'WARNING', 'ERROR', 'CRITICAL'] = 'INFO'
    trace: bool = False
    parallelism: bool = False  # (WIP) Whether to enable parallelism; not yet integrated
    semi_eval_with_equality: bool = True
    interactive_query_mode: Literal['interactive', 'first', 'all'] = 'first'
    save_solutions: bool = False
    include_final_facts: bool = False
```

### 1. `iteration_limit`

* **Type**: `int`
* **Default**: `300`
* **Meaning**:
  The **maximum number of rounds** of the inference loop. One round refers to a complete “instantiate → execute” cycle, i.e., given several facts and several rules, each rule is instantiated independently and the instantiated conclusions are saved when the premises are true. If the round limit is reached and the process still has not terminated, the system will consider it a timeout and stop inference.
  Under the default setting, one round corresponds to the execution of one rule.

---

### 2. `time_limit`

* **Type**: `int`
* **Default**: `3000` (seconds)
* **Meaning**:
  The **time limit** (seconds) for the inference process. In the current version, this field is kept only as a configuration item.

---

### 3. `log_level`

* **Allowed values**: `'DEBUG', 'INFO', 'RESULT', 'WARNING', 'ERROR', 'CRITICAL'`
* **Default**: `'INFO'`
* **Meaning**:
  Controls the log level; logs are output to both file and console.
*
* **Meaning of each level** (convention):

  * `DEBUG`: outputs the most detailed debug information (including low-level details).
  * `INFO`: general runtime information (recommended default).
  * `RESULT`: custom level (25); outputs only conclusive content such as inference termination status and inference results.
  * `WARNING`: outputs only warnings and above.
  * `ERROR`: outputs only errors and fatal errors.
  * `CRITICAL`: outputs only fatal errors.

---

### 4. `trace`

* **Type**: `bool`
* **Default**: `False`
* **Meaning**:
  Whether to enable inference path tracing (used together with the `Inference_Path` feature). When enabled, it records rule applications, the process of generating new facts, etc.
* **Impact**:

  * Helpful for debugging and visualizing the inference process.
  * Brings noticeable performance overhead.

When setting `--trace=True`, the engine records the complete inference process. After inference ends, you can obtain the inference path via `Inference_Path` and generate a visualization graph.

```python
from kele.control.infer_path import Inference_Path

path, terminal = Inference_Path.get_infer_graph()
Inference_Path.generate_infer_path_graph(path, terminal)
# The inference path graph will be generated as infer_path.html and saved in the working directory
```

If you only want to view the inference path of a specific `Assertion`:

```python
from kele.control.infer_path import Inference_Path

path, terminal = Inference_Path.get_infer_graph(assertion_1)
Inference_Path.generate_infer_path_graph(path, terminal)
# While generating the graph, the engine will print the inference path of that Assertion in the logs
```

---

### 5. `parallelism`

* **Type**: `bool`
* **Default**: `False`
* **Meaning**:
  Whether to enable parallel computation. The specific parallel details depend on the grounder/executor implementation.

---

### 6. `semi_eval_with_equality`

* **Type**: `bool`
* **Default**: `True`
* **Meaning**:
  Whether to consider **equality axioms** during the semi-naive evaluation (semi-evaluation) stage.
* **Effect**:

  * `True`: considers equality axioms; inference is more complete, but introduces extra performance overhead.
  * `False`: in scenarios where equivalence reasoning is not needed, partially disables related computation for performance optimization.

---

### 7. `interactive_query_mode`

* **Type**: `Literal['interactive', 'first', 'all']`

* **Default**: `'first'`

* **Meaning**:
  Controls the mode in which the inference engine outputs query results.

* **Value description**:

  * `'interactive'` (interactive mode):

    * pauses after finding each solution and waits for user input
    * press `;` to continue searching for the next solution
    * press Enter to submit the current result and end
    * other input exits the query
  * `'first'` (single-solution mode):

    * stops immediately after finding the first solution that satisfies the condition
    * outputs that solution directly
  * `'all'` (all-solutions mode):

    * exhausts all possible solutions
    * outputs all satisfying results at once

* **Usage suggestions**:

  * Debugging or exploratory queries: use `'interactive'` mode to view results step by step
  * When only one answer is needed: use `'first'` mode to improve performance (default)
  * When a complete result set is needed: use `'all'` mode

---

### 8. `save_solutions`

* **Type**: `bool`
* **Default**: `False`
* **Meaning**: Whether to record and return the solutions found. When set to False, found solutions are only recorded in the terminal and logs.

---

### 9. `include_final_facts`

* **Type**: `bool`

* **Default**: `False`

* **Meaning**:
  Controls whether the returned `EngineRunResult` includes the `final_facts` field.

  * `False`: `final_facts` is an empty list (does not return final fact content), but `fact_num` will still return the number of final facts.
  * `True`: `final_facts` returns all facts in the fact_base at inference termination (initial facts + derived facts).

* **Usage suggestions**:

  * For daily/production runs, keep `False` (to avoid oversized return payloads).
  * Set to `True` for debugging, analyzing inference results, or exporting the complete fact base.

* **Supplement**:
  You can also temporarily control whether to output `final_facts` during serialization via `EngineRunResult.to_dict(include_final_facts=...)`.

## III. InferenceStrategy: Inference Strategy and Model Behavior

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

* **Type**: `int | -1`
* **Default**: `-1`
* **Meaning**:
  Before engine inference, select an **upper limit on the number of rules used for inference** from known rules.

  * `-1`: no limit; use all rules.
  * `>=1`: per round, at most this many rules are selected from the rule set to participate.

> This parameter controls the initial number of rules; discarded rules cannot be used in subsequent inference. When there is no good selection mechanism, it is generally set to -1.

---

### 2. `select_facts_num`

* **Type**: `int | -1`
* **Default**: `-1`
* **Meaning**:
  Before engine inference, select an **upper limit on the number of facts used for inference** from known facts.

  * `-1`: no limit; use all facts.
  * `>=1`: per round, only a subset of facts participates in inference.

> This parameter controls the initial number of facts; discarded facts are difficult to be derived in subsequent inference. When there is no good selection mechanism, it is generally set to -1.

---

### 3. `grounding_rule_strategy`

* **Type**: `'SequentialCyclic', 'SequentialCyclicWithPriority'` (customizable by inheriting `RuleSelectionStrategy`)
* **Default**: `"SequentialCyclic"`
* **Meaning**:
  Strategy for selecting rules during the grounding stage:

  * `SequentialCyclic`: sequentially cycles through all rules, i.e., traverses in order and loops.
  * `SequentialCyclicWithPriority`: considers rule priority on top of sequential cycling (the specific priority policy depends on the input).

---

### 4. `grounding_term_strategy`

* **Type**: `'Exhausted'` (customizable by inheriting `TermSelectionStrategy`)
* **Default**: `"Exhausted"`
* **Meaning**:
  Strategy for selecting terms in grounding. Currently supports `"Exhausted"`, which means using all known facts for inference.

---

## IV. GrounderConfig: Grounder-Related Parameters

```python
@dataclass
class GrounderConfig:
    """Grounder-related parameters"""
    grounding_rules_num_every_step: int | Literal[-1] = -1
    grounding_facts_num_for_each_rule: int | Literal[-1] = -1
    allow_unify_with_nested_term: bool = True
    drop_variable_node: bool = True  # (WIP) Specific behavior depends on grounder implementation
    conceptual_fuzzy_unification: bool = True
```

### 1. `grounding_rules_num_every_step`

* **Type**: `int | -1`
* **Default**: `-1`
* **Meaning**:
  In each grounding step, the maximum number of rules to instantiate.
* **Usage suggestions**:

  * Understand it together with `InferenceStrategy.select_rules_num`:

    * `select_rules_num` controls the initial rule subset;
    * `grounding_rules_num_every_step` controls, for each iteration, how many rules the grounder instantiates each time internally.

---

### 2. `grounding_facts_num_for_each_rule`

* **Type**: `int | -1`
* **Default**: `-1`
* **Meaning**:
  For each rule, the maximum number of facts used for matching during grounding.

---

### 3. `allow_unify_with_nested_term`

* **Type**: `bool`
* **Default**: `True`
* **Meaning**:
  Whether to allow a `Variable` to unify with a **nested `CompoundTerm`**.
* **Effect**:

  * `True`: a variable can be replaced by a `CompoundTerm`, enabling rules to match more complex structures.
  * `False`: variables bind only to non-compound terms; unification is simpler and faster, but completeness will be reduced to some extent.

---

## V. ExecutorConfig: Executor-Related Parameters

```python
@dataclass
class ExecutorConfig:
    """Executor-related parameters"""
    executing_rule_num: int | Literal[-1] = -1
    executing_max_steps: int | Literal[-1] = -1
    anti_join_used_facts: bool = True
```

### 1. `executing_rule_num`

* **Type**: `int | -1`
* **Default**: `-1`
* **Meaning**:
  Per round, the upper limit of the number of **instantiated rules** actually executed by the executor.
* **Explanation**:

  * Together with `InferenceStrategy.select_rules_num` / `GrounderConfig.grounding_rules_num_every_step`, it forms multi-level limits on inference scale.

> Discarded instantiated rules are difficult to be regenerated in subsequent inference, so when there is no good selection mechanism, it is generally set to -1.

---

### 2. `executing_max_steps`

* **Type**: `int | -1`
* **Default**: `-1`
* **Meaning**:
  The maximum number of instantiated rules allowed to execute. Unlike the global `iteration_limit`, this is a finer-grained limit.

---

### 3. `anti_join_used_facts`

* **Type**: `bool`
* **Default**: `True`
* **Meaning**:
  Whether to perform a simple set difference on “instantiated rules that have already been generated” to **avoid repeatedly using related facts to generate the same results**.
* **Effect**:

  * `True`: records the previously true results and anti-joins them with the current results to discard duplicate facts.

    * When there are many duplicate facts: can significantly improve efficiency.
    * When there are few duplicates: maintaining this record has overhead and may be slightly slower.
  * `False`: no anti-join; logic is simpler but may keep generating duplicate facts.

---

## VI. PathConfig: Path and Resource Dependency Configuration

```python
@dataclass
class PathConfig:
  """Path and resource dependency configuration"""
  rule_dir: str = './'
  fact_dir: str = './'
  log_dir: str = './log'
```

### 1. `rule_dir`

* **Type**: `str`
* **Default**: `'./'`
* **Meaning**:
  Directory path where rule files are located. Can be used to load external rule files (e.g., `.py` or some rule DSL).

### 2. `fact_dir`

* **Type**: `str`
* **Default**: `'./'`
* **Meaning**:
  Directory path where initial fact files are located.

### 3. `log_dir`

* **Type**: `str`
* **Default**: `'./log'`
* **Meaning**:
  Log output directory. `_init_logger` will create a log file named `{run_id}_run.log` under this directory.
* **Notes**:

  * If the directory does not exist, it will be created automatically.
  * It can be changed to an absolute path depending on the deployment environment (e.g., `/var/log/kele`).

---

## VII. KBConfig (engineering): Knowledge Base Related Parameters

```python
@dataclass
class KBConfig:
    """Knowledge base related parameters"""
    fact_cache_size: int | Literal[-1] = -1
    close_world_assumption: bool = True
```

### 1. `fact_cache_size` (WIP)

* **Type**: `int | -1`
* **Default**: `-1`
* **Meaning**:
  Size limit of the fact base in the knowledge base.

  * `-1`: no size limit.
  * `>=0`: capacity upper limit; the specific policy is determined by the underlying implementation (e.g., LRU).

> Discarded facts need to be re-derived in subsequent inference, leading to higher time cost.

---

### 2. `close_world_assumption`

* **Type**: `bool`

* **Default**: `True`

* **Meaning**:
  Whether to adopt the **Closed World Assumption (CWA)**:

  * `True`: any fact not recorded in the fact base is considered **False** by default, rather than Unknown.
  * `False`: attempts to move toward the open world assumption, but current support is not yet complete.

* **Usage suggestions**:

  * Currently recommended to keep `True` for stable behavior and clear semantics under a closed world.
  * If experimenting with open world behavior, note that its semantics are not yet complete and are for experimentation only.

---

## VIII. Top-Level Config and Configuration File Mechanism

### 1. Summary of Config Fields

```python
@dataclass
class Config:
    run: OmitArgPrefixes[RunControlConfig]
    strategy: OmitArgPrefixes[InferenceStrategyConfig]
    grounder: OmitArgPrefixes[GrounderConfig]
    executor: OmitArgPrefixes[ExecutorConfig]
    path: OmitArgPrefixes[PathConfig]
    engineering: OmitArgPrefixes[KBConfig]
    config: str | None = None  # Configuration file path
```

* `run`: see RunControl above.
* `strategy`: see InferenceStrategy.
* `grounder`: see GrounderConfig.
* `executor`: see ExecutorConfig.
* `path`: see PathConfig.
* `engineering`: see KBConfig.
* `config`:

  * **Type**: `str | None`
  * **Meaning**: configuration file path specified in the command line (relative or absolute).
  * **Supported formats**: `.yaml` / `.yml` / `.json`.

### 2. Configuration File Loading Flow

1. Command-line parsing:

   ```python
   cli_config, unknown = tyro.cli(Config, return_unknown_args=True)
   ```

   Unrecognized parameters will trigger a warning and be ignored.

2. If `cli_config.config` is not empty, call `_load_config_file` to read the file:

   * YAML: `yaml.safe_load`
   * JSON: `json.load`

3. Merge configuration: first construct a default `Config` from the config file, then parse the command line with `tyro.cli(..., default=...)` to override defaults:

   * Field-level: **CLI overrides configuration file** (configuration file as default/fallback).

4. Generate the final `Config` instance and initialize the logger based on its parameters.

---

### 3. Example: Complete YAML Configuration Template

Below is an example for documentation or user reference:

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

Example of running with a configuration file:

```bash
python -m examples.relationship --config config.yaml
# If command line also passes run.* and other fields, command line values take precedence (CLI first)
```

Example of command-line invocation:

```bash
python main.py --trace True --log_level DEBUG
# Enable inference process tracing and set log level to DEBUG
```

Example of building user config directly using classes in code:

```python
from kele.config import (
    Config,
    EngineeringConfig,
    ExecutorConfig,
    GrounderConfig,
    PathConfig,
    RunControlConfig,
    StrategyConfig,
)

config = Config(
    run=RunControlConfig(
        iteration_limit=500,
        time_limit=600,
        log_level="INFO",
        trace=False,
        parallelism=False,
        semi_eval_with_equality=True,
    ),
    strategy=StrategyConfig(
        select_rules_num=-1,
        select_facts_num=-1,
        grounding_rule_strategy="SequentialCyclic",
        grounding_term_strategy="Exhausted",
    ),
    grounder=GrounderConfig(
        grounding_rules_num_every_step=-1,
        grounding_facts_num_for_each_rule=-1,
        allow_unify_with_nested_term=True,
        drop_variable_node=True,
    ),
    executor=ExecutorConfig(
        executing_rule_num=-1,
        executing_max_steps=-1,
        anti_join_used_facts=True,
    ),
    path=PathConfig(
        rule_dir="./rules",
        fact_dir="./facts",
        log_dir="./log",
    ),
    engineering=EngineeringConfig(
        fact_cache_size=-1,
        close_world_assumption=True,
    ),
)
```
