---
title: HTTP API
---

# HTTP API 使用教程

这份文档面向 HTTP 调用方，介绍如何启动 KELE 的 HTTP 服务、如何调用推理接口，以及如何读取返回结果。

## 1. 适用场景

适合下面这种使用方式：

- 你在服务器上部署 KELE
- 调用方通过 HTTP 上传脚本和知识库文件
- 调用方只关心接口协议和返回结果，不直接接触 KELE 源码

## 2. 启动服务

### 2.1 启动命令

在项目根目录执行：

```bash
uvicorn kele.api:app --host 0.0.0.0 --port 8000
```

如果你使用 `uv`：

```bash
uv run uvicorn kele.api:app --host 0.0.0.0 --port 8000
```

### 2.2 服务地址

如果你本地启动服务，默认地址示例：

```text
http://127.0.0.1:8000
```

## 3. 核心接口：`POST /v1/infer`

这是最常用的接口。它会：

1. 接收上传文件，或复用已有 `uuid`
2. 找到 `entrypoint` 指定的 Python 文件
3. 用子进程执行这个脚本
4. 收集 `stdout`、`stderr`、日志、metrics
5. 返回结构化推理结果

### 3.1 请求格式

`multipart/form-data`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `files` | 多文件 | 否 | 要上传的文件；如果文件已经上传过，可以不传 |
| `entrypoint` | `string` | 否 | 要执行的入口脚本路径，默认是 `main.py` |
| `uuid` | `string` | 否 | 复用已有工作目录 |

### 3.2 最小示例

单文件调用示例：

```bash
curl -X POST <base-url>/v1/infer \
  -F "entrypoint=geometry_for_wo_tool_complex_2.py" \
  -F "files=@geometry_for_wo_tool_complex_2.py"
```

如果文件不在当前目录，把 `@geometry_for_wo_tool_complex_2.py` 换成实际路径。

### 3.3 复用已上传文件

先上传：

```bash
curl -X POST <base-url>/v1/kbs \
  -F "files=@geometry_for_wo_tool_complex_2.py"
```

得到：

```json
{
  "uuid": "<上传返回的 uuid>",
  "status": "ok"
}
```

再执行：

```bash
curl -X POST <base-url>/v1/infer \
  -F "uuid=<上传返回的 uuid>" \
  -F "entrypoint=geometry_for_wo_tool_complex_2.py"
```

## 4. `/v1/infer` 返回结构

返回体通常包含这些字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `stdout` | `string` | 入口脚本标准输出 |
| `stderr` | `string` | 入口脚本标准错误输出 |
| `exit_code` | `int` | 子进程退出码 |
| `metric` | `object` | metrics 文件内容 |
| `log` | `string` | 日志文本 |
| `engine_result` | `object \| null` | 结构化推理结果 |
| `uuid` | `string` | 当前工作目录 ID |
| `status` | `"ok" \| "error"` | API 层状态 |

返回示例：

```json
{
  "stdout": "...",
  "stderr": "",
  "exit_code": 0,
  "metric": {},
  "log": "...",
  "engine_result": {
    "format_version": "0.1",
    "status": "SUCCESS",
    "fact_num": 12,
    "include_final_facts": false,
    "iterations": 3,
    "execute_steps": 5,
    "terminated_by": "executor",
    "solution_count": 1,
    "question": {
      "premises": [],
      "question": []
    },
    "question_text": {
      "premises": [],
      "question": []
    },
    "solutions": [],
    "conflict_reason": null,
    "final_facts": null,
    "final_facts_text": null
  },
  "uuid": "b6f63b58-0f13-4c5c-8fd5-3ac3aa0c9f0f",
  "status": "ok"
}
```

## 5. 如何理解返回结果

### 5.1 顶层 `status`

顶层 `status` 表示 HTTP API 这一层有没有正常处理请求。

- `ok`：接口流程正常结束
- `error`：请求参数或入口文件有问题

它不等于“推理成功”。

### 5.2 `exit_code`

`exit_code` 是入口脚本子进程的退出码。

- `0`：脚本正常退出
- 非 `0`：脚本执行出错或异常退出

### 5.3 `engine_result`

`engine_result` 是最重要的业务结果字段，通常先看这些字段：

- `engine_result.status`
- `engine_result.fact_num`
- `engine_result.terminated_by`
- `engine_result.conflict_reason`

## 6. `engine_result` 字段说明

### 6.1 基础字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `format_version` | `string` | 当前协议版本，固定为 `0.1` |
| `status` | `string` | 推理终止状态，如 `SUCCESS`、`FIXPOINT_REACHED`、`CONFLICT_DETECTED` |
| `fact_num` | `int` | 终止时事实总数 |
| `include_final_facts` | `bool` | 是否真的包含 `final_facts` |
| `iterations` | `int` | 主循环迭代次数 |
| `execute_steps` | `int` | executor 步数 |
| `terminated_by` | `string` | 哪个阶段触发终止 |
| `solution_count` | `int` | 解的数量 |

### 6.2 问题字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `question.premises` | `list` | AST 形式的前提事实 |
| `question.question` | `list` | AST 形式的问题 |
| `question_text.premises` | `list[string]` | 可读的前提文本 |
| `question_text.question` | `list[string]` | 可读的问题文本 |

### 6.3 解字段

`solutions` 是一个列表，每个元素形如：

```json
{
  "bindings": [
    {
      "variable": "X",
      "term": {},
      "term_text": "Alice"
    }
  ],
  "display": "X=Alice"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `bindings[].variable` | `string` | 变量名 |
| `bindings[].term` | `object` | AST 形式的绑定值 |
| `bindings[].term_text` | `string` | 绑定值的可读文本 |
| `display` | `string` | 适合直接展示的文本 |

### 6.4 冲突字段

如果推理触发 conflict rule：

- `engine_result.status` 会变成 `CONFLICT_DETECTED`
- `conflict_reason` 会给出结构化原因

`conflict_reason` 包含：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `rule_name` | `string` | 触发冲突的规则名 |
| `rule_body` | `string` | 冲突规则 body 文本 |
| `evidence` | `list[string]` | 命中冲突的证据事实 |

## 7. 其他接口

| 方法 | 路径 | 作用 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/v1/kbs` | 只上传文件 | 适合先上传文件，再配合 `uuid` 调用 `/v1/infer` |
| `GET` | `/v1/healthz` | 存活检查 | 正常返回 `{"status":"ok"}` |
| `GET` | `/v1/readyz` | 就绪检查 | 正常返回 `{"status":"ok"}` |

## 8. 为什么默认没有 `final_facts`

当前 API 默认不会把完整 `final_facts` 放进返回体，因此通常会看到：

- `include_final_facts = false`
- `final_facts = null`
- `final_facts_text = null`

这样做是为了避免返回体过大。

如果你的调用方需要全量事实库，当前版本还需要继续扩展协议。

## 9. 常见错误返回

### 9.1 入口文件不是 `.py`

```json
{
  "detail": "Entrypoint file must be a .py file",
  "engine_result": null,
  "uuid": "....",
  "status": "error"
}
```

### 9.2 找不到入口文件

```json
{
  "detail": "Entrypoint file main.py not found in uploaded files",
  "engine_result": null,
  "uuid": "....",
  "status": "error"
}
```

### 9.3 服务端 500

如果 API 自身报错，FastAPI 会返回：

```json
{
  "detail": "Error processing: ..."
}
```

这表示请求处理失败，不是普通的推理失败。

## 10. 安全边界

这个服务会把你上传的 Python 入口脚本作为子进程直接执行。

因此它本质上是“远程执行上传脚本”的接口，只应该部署在可信环境中，例如：

- 内网
- 受控的研究环境
- 你自己管理的推理服务节点

不要把它直接暴露给不可信公网调用方。
