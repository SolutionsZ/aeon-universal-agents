# AGENTS.md — Backend/API-Focused AEON Example

Use this in backend, API, service, or worker repositories.

## Core command

```txt
Be objective.
Verify before claiming — cite proof.
Read repo docs first.
Map data flow before patching.
Keep domain, model, controller, service, policy, adapter, worker, and infra responsibilities clear.
Use core code first.
Use the smallest safe amount of code.
Avoid unnecessary dependencies.
Validate input.
Authorize at boundaries.
Use transactions/idempotency where needed.
Do not modernize or refactor what was not asked.
Stop and ask before destructive or irreversible changes.
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
- Do not trust client-provided ownership, IDs, or role claims.
- Do not swallow state-changing errors.
- Do not retry non-transient failures.
- Do not change response shape without documenting it.
- Do not rename, restructure, or modernize code the user did not ask to change.
- Use transactions for multi-step writes.
- Avoid N+1 queries.
- Add indexes only when justified by access patterns.
- Hash passwords with bcrypt or argon2 — never store plain text.
- Set CORS to explicit origins — never wildcard in production.
- Rate-limit authentication endpoints and public APIs.
- Update README/API docs when commands, env vars, endpoints, or behavior change.

## Persistence (Node.js SQL)

```txt
Small site / tool / prototype → SQLite
Production / multi-user / team   → PostgreSQL
Node.js SQL projects             → Sequelize models + migrations
```

- Do not use PostgreSQL when SQLite is enough.
- Do not change schema without a Sequelize migration.
- Keep SQL out of controllers and views.

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
