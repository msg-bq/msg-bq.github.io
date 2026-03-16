---
title: HTTP API
---

# HTTP API Guide

This page is written for HTTP API consumers. It explains how to start the KELE HTTP service, call the inference endpoint, and read the current response shape.

## 1. When to Use This API

This fits the following workflow:

- you deploy KELE on a server
- callers upload scripts and KB files through HTTP
- callers only care about the interface contract and returned data

## 2. Start the Service

### 2.1 Start Command

Run from the project root:

```bash
uvicorn kele.api:app --host 0.0.0.0 --port 8000
```

If you use `uv`:

```bash
uv run uvicorn kele.api:app --host 0.0.0.0 --port 8000
```

### 2.2 Base URL

If you start the service locally, the default base URL is:

```text
http://127.0.0.1:8000
```

## 3. Core Endpoint: `POST /v1/infer`

This is the main endpoint. It:

1. accepts uploaded files, or reuses an existing `uuid`
2. locates the Python file specified by `entrypoint`
3. runs that script as a subprocess
4. collects `stdout`, `stderr`, logs, and metrics
5. returns the structured reasoning result

### 3.1 Request Format

`multipart/form-data`

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `files` | multiple files | no | Files to upload; can be omitted if already uploaded |
| `entrypoint` | `string` | no | Python entrypoint path; default is `main.py` |
| `uuid` | `string` | no | Reuse an existing workspace |

### 3.2 Minimal Example

Single-file example:

```bash
curl -X POST <base-url>/v1/infer \
  -F "entrypoint=geometry_for_wo_tool_complex_2.py" \
  -F "files=@geometry_for_wo_tool_complex_2.py"
```

If the file is not in your current directory, replace `@geometry_for_wo_tool_complex_2.py` with the real file path.

### 3.3 Reuse Uploaded Files

Upload first:

```bash
curl -X POST <base-url>/v1/kbs \
  -F "files=@geometry_for_wo_tool_complex_2.py"
```

Example response:

```json
{
  "status": "ok",
  "session": {
    "uuid": "<uuid returned by /v1/kbs>"
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

Then run:

```bash
curl -X POST <base-url>/v1/infer \
  -F "uuid=<uuid returned by /v1/kbs>" \
  -F "entrypoint=geometry_for_wo_tool_complex_2.py"
```

## 4. `/v1/infer` Response Shape

The current API groups the response into several sections:

| Section | Type | Meaning |
| --- | --- | --- |
| `status` | `string` | API-layer status |
| `session` | `object` | Current workspace information |
| `input` | `object` | Input information for this request |
| `execution` | `object \| null` | Subprocess execution result |
| `result` | `object \| null` | Structured reasoning result from the engine |
| `error` | `object \| null` | Business validation error |

A few details are easy to miss:

- `session.uuid` is the current workspace ID.
- `input.files` only lists files uploaded in this request. If you only reuse an existing `uuid`, it may be an empty list.
- `execution.metrics` is the metrics JSON. It replaces the old top-level `metric` field.
- `result` replaces the old top-level `engine_result` field.
- `error = null` means this request has no business validation error.

Example response:

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
    "include_final_facts": true,
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
    "final_facts": [],
    "final_facts_text": []
  },
  "error": null
}
```

## 5. How to Read the Response

### 5.1 Top-Level `status`

Top-level `status` tells you whether the HTTP API processed the request normally.

- `ok`: the request flow completed normally
- `error`: the request parameters or entrypoint file are invalid

It does not mean the reasoning itself succeeded.

### 5.2 `execution.status` and `exit_code`

The `execution` section describes what happened when the entrypoint script ran as a subprocess.

- `execution.status = "ok"`: the subprocess exited with code `0`
- `execution.status = "error"`: the subprocess exited with a non-zero code
- `execution.exit_code`: the real subprocess exit code

This still does not mean the reasoning engine necessarily succeeded. The engine's own terminal status is in `result.status`.

### 5.3 `result`

`result` is the main business payload. It is the same structured reasoning result that used to live in the old top-level `engine_result` field. In practice, these are usually the first fields to inspect:

- `result.status`
- `result.fact_num`
- `result.terminated_by`
- `result.conflict_reason`

## 6. `result` Fields

### 6.1 Core Fields

| Field | Type | Meaning |
| --- | --- | --- |
| `format_version` | `string` | Protocol version, currently `0.1` |
| `status` | `string` | Terminal reasoning status such as `SUCCESS`, `FIXPOINT_REACHED`, `CONFLICT_DETECTED` |
| `fact_num` | `int` | Number of facts at termination |
| `include_final_facts` | `bool` | Whether `final_facts` is actually present |
| `iterations` | `int` | Main-loop iteration count |
| `execute_steps` | `int` | Executor step count |
| `terminated_by` | `string` | Which stage caused termination |
| `solution_count` | `int` | Number of solutions |

### 6.2 Question Fields

| Field | Type | Meaning |
| --- | --- | --- |
| `question.premises` | `list` | Premises in AST form |
| `question.question` | `list` | Query items in AST form |
| `question_text.premises` | `list[string]` | Readable premise text |
| `question_text.question` | `list[string]` | Readable query text |

### 6.3 Solution Fields

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

### 6.4 Conflict Fields

If reasoning triggers a conflict rule:

- `result.status` becomes `CONFLICT_DETECTED`
- `conflict_reason` contains the structured conflict details

`conflict_reason` includes:

| Field | Type | Meaning |
| --- | --- | --- |
| `rule_name` | `string` | Name of the conflict rule |
| `rule_body` | `string` | Conflict rule body text |
| `evidence` | `list[string]` | Evidence facts that triggered the conflict |

## 7. `/v1/kbs` Response Shape

`POST /v1/kbs` only uploads files. It does not execute an entrypoint script. Example success response:

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

Here:

- `session.uuid` can be reused in later requests
- `files.uploaded` only describes files uploaded in this request
- `files.count` is the number of uploaded files in this request

## 8. API Version Header

Every response also carries a version header:

```text
X-Kele-Api-Version: 0.2.0
```

If you need client-side compatibility checks, this header is the first place to look.

## 9. Common Error Responses

### 9.1 Entrypoint Is Not a `.py` File

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

### 9.2 Entrypoint File Not Found

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

### 9.3 Server-Side 500

If the API itself throws an exception, FastAPI returns:

```json
{
  "detail": "Error processing: ..."
}
```

That means request processing failed, not just a normal reasoning failure.

## 10. About `final_facts`

The current API requests the full `final_facts` payload from the engine, so the common case is:

- `result.include_final_facts = true`
- `result.final_facts` is present
- `result.final_facts_text` is present

Callers should still check `result.include_final_facts` before relying on those fields.

If response size matters for your use case, remember that `final_facts` can make the payload significantly larger.

## 11. Security Boundary

This service executes the uploaded Python entrypoint as a subprocess.

So it is effectively a remote code execution interface and should only be deployed in trusted environments, such as:

- internal networks
- controlled research environments
- infrastructure you manage yourself

Do not expose it directly to untrusted public users.
