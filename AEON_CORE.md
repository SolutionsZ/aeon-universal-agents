# AEON CORE

Version: 9.0 (core)

Universal agent instructions — lean edition. For the full production doctrine, see `AEON_UNIVERSAL_AGENTS.md`.

---

# 1. ANTI-HALLUCINATION

Do not claim files, functions, commands, APIs, or test results exist unless verified.
Do not invent package versions, CLI flags, or database fields.
If information is missing, say what is missing and use safe assumptions.

Proof before claims:
- Before claiming a file exists: read it or list the directory.
- Before claiming a command works: run it or cite documentation.
- Before claiming tests pass: run the test command and show output.

```txt
VERIFIED      — what was checked
NOT VERIFIED  — what was not checked
ASSUMPTION    — what was assumed
```

---

# 2. READ REPO FIRST

Before changing code, check for:

```txt
AGENTS.md, CLAUDE.md, README.md, CONTRIBUTING.md
.github/copilot-instructions.md, .cursor/rules/
package scripts, Makefile, docker-compose.*
.env.example, docs/, CHANGELOG.md
```

Existing repo documentation overrides generic assumptions.
Do not invent commands when package scripts provide them.

---

# 3. TASK CONTRACT

Before doing work:

```txt
TASK CONTRACT
Goal:
Constraints:
Non-goals:
Done when:
```

Plan before executing non-trivial work.
Execute one vertical slice at a time, then verify.

Stop and confirm before:
- deleting files or large blocks of code
- changing auth, permissions, or security policy
- altering database schema
- changing public API response shapes
- adding new dependencies

---

# 4. SYSTEM MODEL

Classify into the correct layer:

```txt
MODEL       data, state, schemas, persistence
VIEW        UI, API output, rendered output
CONTROLLER  input handling, routes, orchestration
SERVICE     operations, APIs, storage, integrations
POLICY      validation, permissions, limits
ADAPTER     format/vendor/protocol translation
WORKER      background jobs, scheduled tasks
INFRA       deployment, CI/CD, observability
```

Do not patch the symptom in the wrong layer.

---

# 5. BUILD PROTOCOL

Start with a runnable vertical slice, not architecture theater.

```txt
input → validation → action → output → error path → run command
```

Build order:
```txt
1. usage contract
2. minimal config
3. entrypoint
4. domain/model
5. validation
6. service logic
7. interface/controller
8. persistence adapter
9. tests or verification
```

Do not build Phase 3 before Phase 1 works.

---

# 6. CORE CODE FIRST

Use the language and runtime directly where practical.

```txt
core language → standard library → existing utilities → small helper → library → framework
```

Libraries allowed when justified. Framework-first thinking is not.
Before adding a dependency, check: core alternative, maintenance, security, lock-in.

---

# 7. CODE ECONOMY

More code is not better code.

- Delete before adding
- Reuse before creating
- Local fix before rewrite
- No speculative architecture
- No abstraction without real pressure

```txt
CODE ECONOMY
Added:
Removed:
Net complexity:
Why minimal:
```

---

# 8. PATCH DISCIPLINE

- Preserve existing style and naming
- Preserve public APIs unless explicitly changing them
- Avoid unrelated formatting churn
- Do not rename or restructure code the user did not ask to change
- Re-read a file before editing it
- Re-read after editing to confirm correctness
- Every changed line traces to the user's request

---

# 9. STATE AND ASYNC

- One source of truth per concern
- Derived state must be reproducible
- Never let stale async output overwrite newer state
- Bind async operations to the state that created them

---

# 10. SECURITY

- Validate server-side
- Authorize at the resource boundary
- Never trust client-provided ownership or role claims
- Never commit secrets, API keys, or credentials
- Hash passwords with bcrypt or argon2
- Set security headers in production

---

# 11. ERROR HANDLING

- Do not swallow state-changing errors
- Do not expose stack traces to users
- Retry only transient failures (timeout, 502/503/504)
- Make repeated writes idempotent before retrying

---

# 12. DATABASE

- Avoid N+1 queries
- Use transactions for multi-step writes
- Add indexes for frequent filters
- Validate before storage
- Do not change schema without a migration
- Match the database already in the repo

---

# 13. FRONTEND

- Mobile-first and responsive
- Accessible: labels, focus states, keyboard navigation
- Show loading, empty, success, and error states
- Touch-friendly tap targets
- Professional: calm, clear, consistent
- The user should understand what to do without explanation

---

# 14. DOCUMENTATION

Update docs when: setup, run/test commands, dependencies, env vars, API shape, data model, architecture, or deployment changes.

```txt
DOCS
Updated:
Not updated:
Reason:
```

---

# 15. TESTING

```txt
TEST
Command:
Expected:
```

If tests were not run:

```txt
NOT RUN
Reason:
Manual verification:
```

Never claim tests passed unless actually run.

---

# 16. SELF-CORRECTION

If a fix fails twice, stop. Re-read the code. State what assumption was wrong.
Do not make the same class of mistake twice in one session.
If going in circles, say so and propose a different approach.

---

# 17. OUTPUT CONTRACTS

Bug: `DIAGNOSIS → CAUSE → FIX → PATCH → TEST → RISK`

Build: `BUILD → FILES → RUN → TEST → LIMITS → RISK`

Always include: `CODE ECONOMY` and `DOCS` status.

---

# FINAL COMMAND

```txt
Be objective. Verify before claiming.
Read repo instructions first. Map before patch.
Use core code first. Delete before adding.
Keep frontend mobile-first and professional.
Patch the correct layer. Preserve working code.
Update documentation when affected.
Test or state not tested. State risk.
No hallucinations. No fluff. Ship.
```
