---
title: HTTP API
---

# HTTP API 使用教程

这份文档面向 HTTP 调用方，介绍如何启动 KELE 的 HTTP 服务、如何调用推理接口，以及如何读取当前版本的返回结构。

> [!IMPORTANT]
> 本页描述的是稳定路径 `/v1/*` 之下的 **HTTP API schema v0.2**。
> 如果你需要查看归档的 `v0.1` 返回结构，请使用右上角的 **API 版本** 切换器。

## 版本模型

现在 KELE 的版本包括如下几种：

| 层级 | 示例 | 含义 |
| --- | --- | --- |
| 引擎版本 | `KELE 0.0.1` | 引擎自身的发布节奏 |
| HTTP 接口主版本 | `/v1/infer` | 稳定的请求路径族 |
| API schema 版本 | `X-Kele-Api-Version: 0.2.0` | 返回体结构的兼容版本 |

这样做的原因是：引擎内部能力和 HTTP 返回结构，不一定会按同样速度迭代。

对于调用方，建议这样判断兼容性：

- 把 `/v1/*` 当作传输层面的主版本
- 把 `X-Kele-Api-Version` 当作返回结构的兼容信号
- 不要只根据引擎版本去推断 HTTP 返回体长什么样

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

### 2.3 也可以使用 `kele-sdk`

如果你不想直接处理原始 HTTP 请求和 JSON 响应，也可以使用 [`kele-sdk`](https://github.com/USTC-KnowledgeComputingLab/kele-sdk)。

它在原始 API 之上提供了一些更方便的快捷属性，例如 `engine_result`、`metric_log`、`engine_status`、`conflict_reason` 等。

需要注意的是，SDK 为了兼容性和易用性，会对部分字段做轻量整理，因此它暴露的对象结构与 KELE 原始 HTTP API 返回的 JSON 可能有轻微差异。

`kele-sdk` 更适合按 **API schema 版本** 声明兼容范围，而不只是跟随引擎版本号。更具体地说，SDK 应该优先检查 `X-Kele-Api-Version`，并明确文档里支持哪些 schema 版本。

具体字段和快捷属性说明请参考 `kele-sdk` 的 [README](https://github.com/USTC-KnowledgeComputingLab/kele-sdk/blob/main/README.md)。

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

返回示例：

```json
{
  "status": "ok",
  "session": {
    "uuid": "<上传返回的 uuid>"
  },
  "files": {
    "uploaded": [
      {
        "name": "geometry_for_wo_tool_complex_2.py"
      }
    ],
    "count": 1
  },
  "error": null
}
```

再执行：

```bash
curl -X POST <base-url>/v1/infer \
  -F "uuid=<上传返回的 uuid>" \
  -F "entrypoint=geometry_for_wo_tool_complex_2.py"
```

## 4. `/v1/infer` 返回结构

当前版本把返回体分成几个 section：

| Section | 类型 | 说明 |
| --- | --- | --- |
| `status` | `string` | API 层状态 |
| `session` | `object` | 当前工作目录信息 |
| `input` | `object` | 本次请求的输入信息 |
| `execution` | `object \| null` | 子进程执行结果 |
| `result` | `object \| null` | 推理引擎的结构化结果 |
| `error` | `object \| null` | 业务校验错误 |

几个容易混淆的点：

- `session.uuid` 是当前工作目录 ID。
- `input.files` 只描述本次请求里实际上传的文件；如果只是复用已有 `uuid`，这里可能是空列表。
- `execution.metrics` 是 metrics JSON，对应旧格式里的顶层 `metric`。
- `result` 对应旧格式里的顶层 `engine_result`。
- `error` 为 `null` 表示本次请求没有业务校验错误。

返回示例：

```json
{
  "status": "ok",
  "session": {
    "uuid": "b6f63b58-0f13-4c5c-8fd5-3ac3aa0c9f0f"
  },
  "input": {
    "entrypoint": "geometry_for_wo_tool_complex_2.py",
    "files": [
      {
        "name": "geometry_for_wo_tool_complex_2.py"
      }
    ]
  },
  "execution": {
    "status": "ok",
    "exit_code": 0,
    "stdout": "...",
    "stderr": "",
    "log": "...",
    "metrics": {}
  },
  "result": {
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
  "error": null
}
```

## 5. 如何理解返回结果

### 5.1 顶层 `status`

顶层 `status` 表示 HTTP API 这一层有没有正常处理请求。

- `ok`：接口流程正常结束
- `error`：请求参数或入口文件有问题

它不等于“推理成功”。

### 5.2 `execution.status` 和 `exit_code`

`execution` 这一层描述的是入口脚本子进程的执行情况。

- `execution.status = "ok"`：子进程退出码为 `0`
- `execution.status = "error"`：子进程退出码非 `0`
- `execution.exit_code`：入口脚本的真实退出码

这也不等于“推理引擎一定成功”，因为引擎自己的终止状态在 `result.status` 里。

### 5.3 `result`

`result` 是最重要的业务结果字段，相当于旧版本中的 `engine_result`。通常先看这些字段：

- `result.status`
- `result.fact_num`
- `result.terminated_by`
- `result.conflict_reason`

## 6. `result` 字段说明

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

- `result.status` 会变成 `CONFLICT_DETECTED`
- `conflict_reason` 会给出结构化原因

`conflict_reason` 包含：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `rule_name` | `string` | 触发冲突的规则名 |
| `rule_body` | `string` | 冲突规则 body 文本 |
| `evidence` | `list[string]` | 命中冲突的证据事实 |

## 7. `/v1/kbs` 返回结构

`POST /v1/kbs` 只负责上传文件，不会执行入口脚本。成功返回示例：

```json
{
  "status": "ok",
  "session": {
    "uuid": "b6f63b58-0f13-4c5c-8fd5-3ac3aa0c9f0f"
  },
  "files": {
    "uploaded": [
      {
        "name": "geometry_for_wo_tool_complex_2.py"
      }
    ],
    "count": 1
  },
  "error": null
}
```

其中：

- `session.uuid` 可用于后续复用这个工作目录
- `files.uploaded` 只描述本次请求上传的文件
- `files.count` 是本次请求上传文件数

## 8. API version header

所有响应都会带一个版本头：

```text
X-Kele-Api-Version: 0.2.0
```

如果你要做客户端兼容判断，可以优先读取这个 header。

## 9. 常见错误返回

### 9.1 入口文件不是 `.py`

```json
{
  "status": "error",
  "session": {
    "uuid": "...."
  },
  "input": {
    "entrypoint": "main.txt",
    "files": [
      {
        "name": "main.txt"
      }
    ]
  },
  "execution": null,
  "result": null,
  "error": {
    "status": "error",
    "code": "invalid_entrypoint",
    "detail": "Entrypoint file must be a .py file"
  }
}
```

### 9.2 找不到入口文件

```json
{
  "status": "error",
  "session": {
    "uuid": "...."
  },
  "input": {
    "entrypoint": "main.py",
    "files": []
  },
  "execution": null,
  "result": null,
  "error": {
    "status": "error",
    "code": "missing_entrypoint",
    "detail": "Entrypoint file main.py not found in uploaded files"
  }
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

## 10. 关于 `final_facts`

当前 HTTP API 不再强制开启 `final_facts` 返回。按当前默认配置，常见情况是：

- `result.include_final_facts = false`
- `result.final_facts = null`
- `result.final_facts_text = null`

如果服务端运行配置显式开启了 `include_final_facts`，这两个字段才会返回实际列表内容。

调用方应该先检查 `result.include_final_facts`，再决定是否直接读取这两个字段。

如果你的场景对返回体大小比较敏感，这也是更稳妥的默认行为。

## 11. 安全边界

这个服务会把你上传的 Python 入口脚本作为子进程直接执行。

因此它本质上是“远程执行上传脚本”的接口，只应该部署在可信环境中，例如：

- 内网
- 受控的研究环境
- 你自己管理的推理服务节点

不要把它直接暴露给不可信公网调用方。

