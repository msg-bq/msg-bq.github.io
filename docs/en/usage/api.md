---
title: HTTP API
---

# HTTP API Guide

This page is written for HTTP API consumers. It explains how to start the KELE HTTP service, upload files, run inference, and read the response payload.

## 1. When to Use This API

This fits the following workflow:

- you deploy KELE on a server
- callers upload scripts and KB files through HTTP
- callers only care about the interface contract and returned data

## 2. Start the Service

### 2.1 Dependencies

The HTTP service requires at least:

- `fastapi`
- `uvicorn`
- `python-multipart`

### 2.2 Start Command

Run from the project root:

```bash
uvicorn kele.api:app --host 0.0.0.0 --port 8000
```

If you use `uv`:

```bash
uv run uvicorn kele.api:app --host 0.0.0.0 --port 8000
```

Example base URL:

```text
http://127.0.0.1:8000
```

## 3. Endpoint Overview

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/v1/healthz` | Liveness check |
| `GET` | `/v1/readyz` | Readiness check |
| `POST` | `/v1/kbs` | Upload files without running |
| `POST` | `/v1/infer` | Upload files and run the entrypoint |

## 4. Health Checks

### 4.1 `GET /v1/healthz`

```bash
curl http://127.0.0.1:8000/v1/healthz
```

Response:

```json
{
  "status": "ok"
}
```

### 4.2 `GET /v1/readyz`

```bash
curl http://127.0.0.1:8000/v1/readyz
```

Response:

```json
{
  "status": "ok"
}
```

## 5. File Upload Endpoint

### 5.1 `POST /v1/kbs`

This endpoint uploads files only. It does not run the entrypoint. Use it when you want to upload `main.py`, rule files, fact files, and then execute them later.

### 5.2 Request Format

`multipart/form-data`

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `files` | multiple files | yes | Files to upload |
| `uuid` | `string` | no | Existing workspace ID; creates a new one if omitted |

### 5.3 Example

```bash
curl -X POST http://127.0.0.1:8000/v1/kbs   -F "files=@main.py"   -F "files=@rules.py"   -F "files=@facts.py"
```

Example response:

```json
{
  "uuid": "b6f63b58-0f13-4c5c-8fd5-3ac3aa0c9f0f",
  "status": "ok"
}
```

## 6. What `uuid` Does

The service assigns a `uuid` to each temporary workspace.

Typical usage:

1. call `/v1/kbs` to upload files
2. save the returned `uuid`
3. call `/v1/infer` with the same `uuid`

This avoids re-uploading the same files repeatedly.

## 7. Inference Endpoint

### 7.1 `POST /v1/infer`

This endpoint:

1. writes uploaded files into the workspace
2. locates the Python file specified by `entrypoint`
3. runs that script as a subprocess
4. collects `stdout`, `stderr`, logs, and metrics
5. returns the structured engine result

### 7.2 Request Format

`multipart/form-data`

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `files` | multiple files | no | Files to upload; can be omitted if already uploaded through `/v1/kbs` |
| `entrypoint` | `string` | no | Python entrypoint path; default is `main.py` |
| `uuid` | `string` | no | Reuse an existing workspace |

### 7.3 Minimal Example

```bash
curl -X POST http://127.0.0.1:8000/v1/infer   -F "files=@main.py"   -F "files=@rules.py"   -F "files=@facts.py"   -F "entrypoint=main.py"
```

### 7.4 Reuse Uploaded Files

Upload first:

```bash
curl -X POST http://127.0.0.1:8000/v1/kbs   -F "files=@main.py"   -F "files=@rules.py"   -F "files=@facts.py"
```

Then run:

```bash
curl -X POST http://127.0.0.1:8000/v1/infer   -F "uuid=b6f63b58-0f13-4c5c-8fd5-3ac3aa0c9f0f"   -F "entrypoint=main.py"
```

## 8. `/v1/infer` Response Shape

The response usually contains these top-level fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `stdout` | `string` | Standard output from the entrypoint script |
| `stderr` | `string` | Standard error from the entrypoint script |
| `exit_code` | `int` | Subprocess exit code |
| `metric` | `object` | Metrics payload |
| `log` | `string` | Log text |
| `engine_result` | `object \| null` | Structured reasoning result |
| `uuid` | `string` | Current workspace ID |
| `status` | `"ok" \| "error"` | API-layer status |

Example response:

```json
{
  "stdout": "...",
  "stderr": "",
  "exit_code": 0,
  "metric": {},
  "log": "...",
  "engine_result": {
    "format_version": "engine-run-result.v1",
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

## 9. How to Read the Response

### 9.1 Top-Level `status`

Top-level `status` tells you whether the HTTP API processed the request normally.

- `ok`: request flow completed normally
- `error`: request parameters or entrypoint file are invalid

It does not mean the reasoning itself succeeded.

### 9.2 `exit_code`

`exit_code` is the subprocess exit code of the entrypoint script.

- `0`: normal exit
- non-zero: script error or abnormal termination

### 9.3 `engine_result`

`engine_result` is the main business payload. In practice, these fields are usually the first ones to inspect:

- `engine_result.status`
- `engine_result.fact_num`
- `engine_result.terminated_by`
- `engine_result.conflict_reason`

## 10. `engine_result` Fields

### 10.1 Core Fields

| Field | Type | Meaning |
| --- | --- | --- |
| `format_version` | `string` | Protocol version, currently `engine-run-result.v1` |
| `status` | `string` | Terminal reasoning status such as `SUCCESS`, `FIXPOINT_REACHED`, `CONFLICT_DETECTED` |
| `fact_num` | `int` | Number of facts at termination |
| `include_final_facts` | `bool` | Whether `final_facts` is actually present |
| `iterations` | `int` | Main-loop iteration count |
| `execute_steps` | `int` | Executor step count |
| `terminated_by` | `string` | Which stage caused termination |
| `solution_count` | `int` | Number of solutions |

### 10.2 Question Fields

| Field | Type | Meaning |
| --- | --- | --- |
| `question.premises` | `list` | Premises in AST form |
| `question.question` | `list` | Query items in AST form |
| `question_text.premises` | `list[string]` | Readable premise text |
| `question_text.question` | `list[string]` | Readable query text |

### 10.3 Solution Fields

Each item in `solutions` looks like:

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

| Field | Type | Meaning |
| --- | --- | --- |
| `bindings[].variable` | `string` | Variable name |
| `bindings[].term` | `object` | Bound value in AST form |
| `bindings[].term_text` | `string` | Readable bound value |
| `display` | `string` | Ready-to-display summary |

### 10.4 Conflict Fields

If reasoning triggers a conflict rule:

- `engine_result.status` becomes `CONFLICT_DETECTED`
- `conflict_reason` contains the structured conflict details

`conflict_reason` includes:

| Field | Type | Meaning |
| --- | --- | --- |
| `rule_name` | `string` | Name of the conflict rule |
| `rule_body` | `string` | Conflict rule body text |
| `evidence` | `list[string]` | Evidence facts that triggered the conflict |

## 11. Why `final_facts` Is Missing by Default

By default, the API does not include the full `final_facts` payload, so you will usually see:

- `include_final_facts = false`
- `final_facts = null`
- `final_facts_text = null`

This keeps the response body smaller.

If your API consumers need the full fact base, the protocol still needs to be extended further.

## 12. Common Error Responses

### 12.1 Entrypoint Is Not a `.py` File

```json
{
  "detail": "Entrypoint file must be a .py file",
  "engine_result": null,
  "uuid": "....",
  "status": "error"
}
```

### 12.2 Entrypoint File Not Found

```json
{
  "detail": "Entrypoint file main.py not found in uploaded files",
  "engine_result": null,
  "uuid": "....",
  "status": "error"
}
```

### 12.3 Server-Side 500

If the API itself throws an exception, FastAPI returns:

```json
{
  "detail": "Error processing: ..."
}
```

That means request processing failed, not just normal reasoning failure.

## 13. Full Example Flow

### 13.1 Start the Service

```bash
uvicorn kele.api:app --host 0.0.0.0 --port 8000
```

### 13.2 Upload Files

```bash
curl -X POST http://127.0.0.1:8000/v1/kbs   -F "files=@main.py"   -F "files=@rules.py"   -F "files=@facts.py"
```

### 13.3 Run Inference

```bash
curl -X POST http://127.0.0.1:8000/v1/infer   -F "uuid=<uuid-from-the-previous-step>"   -F "entrypoint=main.py"
```

### 13.4 Read the Result

Recommended fields to check first:

- `exit_code`
- `engine_result.status`
- `engine_result.fact_num`
- `engine_result.terminated_by`
- `engine_result.conflict_reason`

## 14. Security Boundary

This service executes the uploaded Python entrypoint as a subprocess.

So it is effectively a remote code execution interface and should only be deployed in trusted environments, such as:

- internal networks
- controlled research environments
- infrastructure you manage yourself

Do not expose it directly to untrusted public users.
