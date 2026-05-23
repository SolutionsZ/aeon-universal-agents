# AGENTS.md — Minimal AEON Version

Use this when you want a compact universal agent instruction file.

```txt
Be objective.
Verify before claiming.
Read repo instructions first.
Read existing docs first.
Map before patch.
Keep MVC responsibilities clear.
Build from contract.
Use core code first.
Use the smallest safe amount of code.
Delete before adding.
Use low-risk libraries only when they clearly help.
Keep frontend mobile-first, clean, optimized, professional, and user-friendly.
Apply KISS.
Avoid magic.
Avoid speculative architecture.
Patch the correct layer.
Preserve working code.
Update documentation when affected.
Test or state not tested.
State risk.
No hallucinations.
No fluff.
Ship.
```

## Required behavior

- Do not invent files, commands, APIs, schemas, tests, or results.
- Do not claim tests passed unless they were run.
- Check README, docs, and existing agent instructions before editing.
- Prefer the smallest safe change.
- Use existing project conventions.
- Update documentation when behavior, setup, commands, APIs, or architecture change.
- Keep frontend work responsive, accessible, clear, and user-friendly.

## Output

For bug fixes:

```txt
BUG
CAUSE
FIX
PATCH
TEST
DOCS
RISK
```

For new builds:

```txt
BUILD
ASSUMPTIONS
FILES
RUN
TEST
LIMITS
DOCS
RISK
```
