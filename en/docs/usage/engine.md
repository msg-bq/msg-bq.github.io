---

title: Engine
parent: Usage
layout: page
nav_order: 9
---

# Creating and Running the Inference Engine

---

## 1. Workflow

1. Prepare facts and rules
2. Create the inference engine `InferenceEngine`
3. Construct `QueryStructure`
4. Run inference and inspect the result (EngineRunResult) and logs

> Note: `fact_x` / `rule_x` in the examples are just placeholders; you can replace them with the facts and rule objects in your own project.

## 2. Prepare Facts and Rules

`InferenceEngine` supports two ways to load knowledge:

1. **Pass in Python lists directly**: suitable for dynamically constructing facts / rules in code
2. **Pass in a directory or file path (str)**: automatically loaded by the internal `FactBase` / `RuleBase`

```python
from kele.main import InferenceEngine

# Suppose you have already defined some facts and rules with the syntax module
# For example: fact_is_human(alice) / rule_human_is_mortal, etc.
fact1 = ...
fact2 = ...
rule1 = ...
rule2 = ...

# Option 1: create the engine from lists
engine = InferenceEngine(
    facts=[fact1, fact2],
    rules=[rule1, rule2],
)

# Option 2: load from a directory or file (internally initializes FactBase / RuleBase based on the path)
# engine = InferenceEngine(
#     facts="path/to/facts_dir_or_file",
#     rules="path/to/rules_dir_or_file",
# )
```

If you initialize with `facts=None` or `rules=None`, the engine will use the default paths specified by `Args.path.fact_dir` / `Args.path.rule_dir` in the configuration.

## 3. Create InferenceEngine

`InferenceEngine` is the core class of the inference engine. When creating it, you need to specify:

* Initial facts `facts`
* Rule list `rules`

```python
from kele.main import InferenceEngine

inference_engine = InferenceEngine(
    facts=[fact1, fact2, fact3],
    rules=[rule1, rule2, rule3],
)
# Initial facts are fact1, fact2, fact3; rules are rule1, rule2, rule3
```

## 4. Execute an Inference Query

After specifying the query with `QueryStructure`, you can call `infer_query` to run inference:

```python
from kele.main import QueryStructure

querystructure_1 = QueryStructure(
    premises=fact_list_foo,   # premise fact set
    question=fact_list_bar    # question set to be solved
)

result = inference_engine.infer_query(querystructure_1)
```

### 4.1 Input Format: QueryStructure

The input to `infer_query(query: QueryStructure, ...)` is `QueryStructure` (a strict model, `extra="forbid"`), which contains only two fields:

| Field      | Type                  | Description                                                                                                                                                                                   |
| ---------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `premises` | `Sequence[Assertion]` | Premises/known assertions for this run. At the start of each run, they are forcibly added to the current `FactBase` (equivalent to `force_add=True`), and a free variable check is performed. |
| `question` | `Sequence[FACT_TYPE]` | The question patterns to be solved (may contain variables). The engine will look for variable bindings (solutions) that make these patterns hold.                                             |

### 4.2 Return Value: EngineRunResult

`infer_query(...)` **returns `EngineRunResult`**, rather than directly returning a facts list. Common fields are as follows:

| Field                           | Type                                                        | Meaning                                                                                                     |
| ------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `status`                        | `InferenceStatus`                                           | Termination status (e.g., `SUCCESS` / `FIXPOINT_REACHED` / `MAX_*` / `EXTERNALLY_INTERRUPTED`, etc.).       |
| `has_solution`                  | `bool`                                                      | Whether at least one solution was found (`solution_count > 0`).                                             |
| `is_success`                    | `bool \| None`                                              | A quick success check (internally combines `status` and whether there is a solution).                       |
| `is_partial_success`            | `bool \| None`                                              | Has solutions but stopped early due to resource limits/external interruption (there may be more solutions). |
| `solutions`                     | `list[Mapping[Variable, Constant \| CompoundTerm]]`         | List of variable bindings; if `Args.run.save_solutions=False`, this may be empty.                           |
| `solution_count`                | `int`                                                       | Number of solutions.                                                                                        |
| `final_facts`                   | `list[FACT_TYPE]`                                           | Returned only when `Args.run.include_final_facts=True`; otherwise an empty list.                            |
| `fact_num`                      | `int`                                                       | Total number of facts at termination (filled regardless of whether `final_facts` is returned).              |
| `iterations` / `executor_steps` | `int` / `int`                                               | Number of iterations / execution steps.                                                                     |
| `terminated_by`                 | `"initial_check" \| "executor" \| "main_loop" \| "unknown"` | Which stage terminated.                                                                                     |

> There are two ways to get “all facts”:
>
> * If `result.include_final_facts=True`: use `result.final_facts`
> * Otherwise: use `inference_engine.get_facts()` (always returns all facts in the current FactBase)

Example:

```python
result = result = inference_engine.infer_query(querystructure_1)

# Whether successful (recommended: combine has_solution + is_success / is_partial_success)
if result.is_success:
    ...

# Get facts
facts = result.final_facts if result.include_final_facts else inference_engine.get_facts()
```

### 4.3 Output Modes and Logs

* `infer_query` outputs key process information via logs (and `EngineRunResult.log_message()` also provides a summary).
* For a given query, the engine provides three `interactive_query_mode` values to control the “solution output mode”:

  * **Interactive mode**: press `;` to continue, press Enter to submit, otherwise exit
  * **One-solution mode**: directly output the first solution
  * **All-solutions mode**: directly output all solutions
  * See [interactive_query_mode]({% link docs/usage/config.md %}#7-interactive_query_mode) for detailed configuration.

## 5. Use resume for Continuous Inference

Sometimes you want to:

1. Run one round of inference first;
2. Externally derive new facts based on the results;
3. Add these new facts to the engine and **continue inference on top of the previous round, rather than starting over**.

In this case, you can use `resume=True`:

```python
# First inference: start from scratch
result_first = engine.infer_query(query, resume=False)  # the first call must be resume=False

# Externally generate some new facts based on the results
new_fact1 = ...
new_fact2 = ...
querystructure_2 = QueryStructure(
    premises=[new_fact1, new_fact2],
    question=question_list
)
# Second inference: continue from the previous state
result_second = engine.infer_query(querystructure_2, resume=True)
facts_after_second = result_second.final_facts  # or: engine.get_facts()
```

Notes:

* If you set `resume=True` on the first call, it will raise `ValueError`; please run once with `resume=False` first.
* `resume=True` is treated as “continue on the previous engine state”: it will not reset inference state information, and it will inject new `premises`;
* If you need to change `premises` / `rules`, restart a round with `resume=False`.
* Logs will be recorded in two segments (two outer calls); time statistics need to be interpreted in context.

---

## 6. How to Inspect Inference Status

* `infer_query` returns `EngineRunResult` (see Section 4). You can quickly judge whether the query is hit via `status / is_success / is_partial_success / has_solution`.
* If you need facts:

  * When `result.include_final_facts=True`: use `result.final_facts` directly
  * Otherwise: use `inference_engine.get_facts()` to get all facts in the current `FactBase`
* About inference paths:

  * It is recommended to enable `Args.run.trace=True`, and analyze rule triggering and the inference process with trace / logs / metrics (see [trace]({% link docs/usage/config.md %}#4-trace)).

---

## 7. Debugging and Common Questions

1. **How do I know whether the inference really “hit” the question?**

   * It is recommended to look directly at `EngineRunResult`: `has_solution` / `is_success` / `is_partial_success` + `status`; the logs will also print the `result.log_message()` summary.
   * You can also pay attention to the termination status of `main_loop_manager` in the logs (whether the goal is reached, whether the iteration limit is reached, etc.).

2. **Why do I feel it should be derivable, but the result didn’t come out?**

   * Check whether facts / rules are loaded correctly (you can print `engine.fact_base.get_facts()` and `engine.rule_base.rules`);
   * Check whether `question` matches the predicates / terms in the facts (e.g., whether variable and constant names are consistent);
   * Check whether it is constrained by the iteration limit `Args.run.iteration_limit` or the execution step limit `Args.executor.executing_max_steps`.
   * If trace is enabled, you can analyze which rule took effect and which failed along the inference path.

3. **How do I integrate it into my own project?**

   * Prepare facts and rules on the business side (can be read from config files, databases, external systems);
   * Wrap a service and expose a unified query interface; internally construct `QueryStructure` and call `InferenceEngine.infer_query`;
   * Based on logs and trace output, map inference results into business-understandable structures (e.g., visualize inference paths, return explanatory text).
   * MCP (WIP)
   * Customize fact and rule selection modules for task scenarios; see [custom modules]({% link docs/custom_module.md %})
   * Integration with some other tools, etc. (WIP)
