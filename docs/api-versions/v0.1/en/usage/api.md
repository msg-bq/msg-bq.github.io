---
title: HTTP API
---

# HTTP API Guide

> [!WARNING]
> This page documents the archived **HTTP API schema v0.1**.
> It is kept for older clients only. For current integrations, switch back to `v0.2`.

## Scope

Schema `v0.1` still uses the same endpoint family:

- `POST /v1/infer`
- `POST /v1/kbs`
- `GET /v1/healthz`
- `GET /v1/readyz`

The main difference is the **response body shape**. Unlike `v0.2`, this version uses a flat top-level payload.

## `/v1/infer` Request

Request format is still `multipart/form-data`.

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `files` | multiple files | no | Files to upload; can be omitted if the workspace already exists |
| `entrypoint` | `string` | no | Python entrypoint path; default is `main.py` |
| `uuid` | `string` | no | Reuse an existing workspace |

Example:

```bash
curl -X POST <base-url>/v1/infer \
  -F "entrypoint=relationship.py" \
  -F "files=@relationship.py"
```

## `v0.1` Success Response Shape

In `v0.1`, `/v1/infer` returns a flat object:

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

Compared with `v0.2`:

- there is no `session`
- there is no `input`
- there is no `execution`
- there is no nested `error` object
- `engine_result` is still a top-level field
- `metric` and `log` are still top-level fields

## `/v1/kbs` Response Shape

In `v0.1`, upload-only responses are also flat:

```json
{
  "status": "ok",
  "uuid": "e7e965d3-6875-4880-a587-cc027122eab1"
}
```

## Common Validation Errors

Entrypoint is not a `.py` file:

```json
{
  "status": "error",
  "uuid": "....",
  "detail": "Entrypoint file must be a .py file",
  "engine_result": null
}
```

Entrypoint file not found:

```json
{
  "status": "error",
  "uuid": "....",
  "detail": "Entrypoint file main.py not found in uploaded files",
  "engine_result": null
}
```

## Compatibility Note

If you maintain an older client or SDK:

- treat this page as the contract for the flat `v0.1` response shape
- do not expect the `X-Kele-Api-Version: 0.2.0` layout here
- migrate to `v0.2` when you need the nested `session/input/execution/result/error` structure
