---
title: HTTP API
---

# HTTP API 使用教程

> [!WARNING]
> 本页描述的是归档的 **HTTP API schema v0.1**。
> 它只用于兼容旧调用方；新的接入请切回 `v0.2`。

## 适用范围

`v0.1` 仍然使用同一组接口路径：

- `POST /v1/infer`
- `POST /v1/kbs`
- `GET /v1/healthz`
- `GET /v1/readyz`

它和 `v0.2` 的核心区别不在路径，而在于 **返回体结构**。`v0.1` 使用的是扁平顶层结构。

## `/v1/infer` 请求格式

请求仍然是 `multipart/form-data`。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `files` | 多文件 | 否 | 要上传的文件；如果工作目录里已经有文件，可以不传 |
| `entrypoint` | `string` | 否 | 要执行的 Python 入口文件，默认 `main.py` |
| `uuid` | `string` | 否 | 复用已有工作目录 |

示例：

```bash
curl -X POST <base-url>/v1/infer \
  -F "entrypoint=relationship.py" \
  -F "files=@relationship.py"
```

## `v0.1` 成功返回结构

在 `v0.1` 里，`/v1/infer` 返回的是一个扁平对象：

```json
{
  "status": "ok",
  "uuid": "4c0df74e-adf3-42e9-bb7a-d71ee3dfd17a",
  "stdout": "",
  "stderr": "...",
  "exit_code": 0,
  "metric": {},
  "log": "...",
  "engine_result": {
    "format_version": "0.1",
    "status": "SUCCESS",
    "fact_num": 7,
    "include_final_facts": true,
    "iterations": 1,
    "execute_steps": 2,
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
    "final_facts": [],
    "final_facts_text": []
  }
}
```

和 `v0.2` 相比：

- 没有 `session`
- 没有 `input`
- 没有 `execution`
- 没有嵌套的 `error`
- `engine_result` 还是顶层字段
- `metric` 和 `log` 也还是顶层字段

## `/v1/kbs` 返回结构

在 `v0.1` 里，单纯上传文件的返回也比较扁平：

```json
{
  "status": "ok",
  "uuid": "e7e965d3-6875-4880-a587-cc027122eab1"
}
```

## 常见校验错误

入口文件不是 `.py`：

```json
{
  "status": "error",
  "uuid": "....",
  "detail": "Entrypoint file must be a .py file",
  "engine_result": null
}
```

找不到入口文件：

```json
{
  "status": "error",
  "uuid": "....",
  "detail": "Entrypoint file main.py not found in uploaded files",
  "engine_result": null
}
```

## 兼容性说明

如果你维护的是旧版调用方或旧版 SDK：

- 应该把本页视为扁平 `v0.1` 返回结构的契约
- 不要期待出现 `X-Kele-Api-Version: 0.2.0` 对应的嵌套布局
- 当你需要 `session/input/execution/result/error` 这种新结构时，再迁移到 `v0.2`
