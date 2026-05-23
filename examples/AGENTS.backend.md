# AGENTS.md — Backend/API-Focused AEON Example

Use this in backend, API, service, or worker repositories.

## Core command

```txt
Be objective.
Read repo docs first.
Map data flow before patching.
Keep domain, model, controller, service, policy, adapter, worker, and infra responsibilities clear.
Use core code first.
Use the smallest safe amount of code.
Avoid unnecessary dependencies.
Validate input.
Authorize at boundaries.
Use transactions/idempotency where needed.
Test or state not tested.
Update documentation when affected.
No hallucinations.
No fluff.
Ship.
```

## Backend checklist

```txt
Input:
Validation:
Auth:
Business rule:
Persistence:
Side effects:
Output:
Errors:
Idempotency:
Observability:
```

## Rules

- Do not invent endpoints, schemas, or environment variables.
- Do not trust client-provided ownership.
- Do not swallow state-changing errors.
- Do not retry non-transient failures.
- Do not change response shape without documenting it.
- Use transactions for multi-step writes.
- Avoid N+1 queries.
- Add indexes only when justified by access patterns.
- Update README/API docs when commands, env vars, endpoints, or behavior change.

## Output

```txt
API
Input:
Validation:
Action:
Output:
Errors:

PATCH
...

TEST
...

DOCS
...

RISK
...
```
