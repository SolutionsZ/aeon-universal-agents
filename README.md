# AEON Universal Agents

**A universal `AGENTS.md` instruction file for coding agents.**

AEON Universal Agents is a practical, stack-neutral instruction file designed to make AI coding agents more objective, realistic, structured, and useful inside real software projects.

It tells an agent how to inspect a repository, respect existing documentation, avoid hallucinations, keep MVC responsibilities clean, build from scratch when needed, patch existing code safely, use the smallest safe amount of code, document changes, and test honestly.

This repository is for developers who want AI agents to behave less like chatbots and more like disciplined engineering assistants.

---

## Why this exists

Modern AI coding tools are powerful, but they often fail in predictable ways:

- They hallucinate files, commands, APIs, and test results.
- They add too much code.
- They introduce unnecessary dependencies.
- They ignore existing README files and repo instructions.
- They rewrite working systems instead of patching the correct layer.
- They overengineer simple tasks.
- They mix business logic, UI logic, services, and persistence.
- They forget to update documentation.
- They produce frontend code that is not mobile-friendly, accessible, or user-friendly.

AEON exists to reduce those failures.

The core principle is simple:

```txt
Be objective.
Verify before claiming.
Read repo instructions first.
Map before patch.
Use core code first.
Use the smallest safe amount of code.
Keep MVC responsibilities clear.
Keep frontend clean, mobile-first, professional, and user-friendly.
Test or state not tested.
No hallucinations.
No fluff.
Ship.
```

---

## What this file is

This repository contains a universal agent instruction file:

```txt
AEON_UNIVERSAL_AGENTS.md
```

You can use it as:

```txt
AGENTS.md
CLAUDE.md
.github/copilot-instructions.md
.cursor/rules/aeon.mdc
```

The recommended default name is:

```txt
AGENTS.md
```

`AGENTS.md` is becoming a common convention for giving coding agents project-specific instructions.

---

## What AEON teaches an agent to do

AEON instructs coding agents to:

### 1. Stay objective

Agents must not invent facts, files, commands, APIs, schemas, logs, benchmarks, or test results.

If something is unknown, the agent must say so.

```txt
VERIFIED
- ...

NOT VERIFIED
- ...

ASSUMPTION
- ...

IMPACT
- ...
```

---

### 2. Read the repository first

Before changing code, the agent must check for existing project truth:

```txt
AGENTS.md
CLAUDE.md
.github/copilot-instructions.md
.cursor/rules/
README.md
CONTRIBUTING.md
DEVELOPMENT.md
ARCHITECTURE.md
docs/
package scripts
Makefile
docker-compose.*
.env.example
CHANGELOG.md
MIGRATION*
```

Existing repo documentation overrides generic assumptions.

---

### 3. Use MVC as a thinking model

AEON uses MVC broadly, not as a forced framework.

```txt
MODEL      data, state, schemas, persistence, domain rules
VIEW       UI, rendered output, documents, reports, CLI/API output
CONTROLLER input handling, routes, commands, orchestration
SERVICE    reusable operations, APIs, storage, mail, queues, integrations
POLICY     validation, permissions, limits, business constraints
ADAPTER    mapping between formats, vendors, protocols, APIs, databases
WORKER     background jobs, scheduled tasks, queue consumers
INFRA      runtime, deployment, networking, CI/CD, observability
```

The goal is clear responsibility, not more folders.

---

### 4. Build from scratch properly

For greenfield work, AEON tells the agent to start with a runnable vertical slice:

```txt
input -> validation -> action -> output/state change -> error path -> run/test command
```

No architecture theater.
No Phase 3 before Phase 1 works.
No speculative systems.

---

### 5. Use core code first

“Vanilla” does not mean JavaScript.

It means core-code engineering:

```txt
core language
standard library
existing project utilities
small local helper
focused low-risk library
framework
```

Libraries and frameworks are allowed when they are beneficial, low-risk, and justified.

---

### 6. Use the smallest safe amount of code

More code is not better code.

AEON pushes agents to:

- delete before adding
- reuse before creating
- fix locally before rewriting
- avoid speculative architecture
- avoid abstractions without real pressure
- avoid dependency-first thinking

Agents must report code economy:

```txt
CODE ECONOMY
Added:
Removed:
Net complexity:
Why minimal:
```

---

### 7. Keep frontend clean and professional

Frontend work must be:

- mobile-first
- responsive
- accessible
- fast
- readable
- professional
- user-friendly
- consistent
- touch-friendly
- clear in loading, empty, success, and error states

KISS applies:

```txt
The user should understand what to do without explanation.
```

---

### 8. Keep documentation updated

Every change must consider documentation.

The agent checks whether the change affects:

- setup
- run commands
- test commands
- environment variables
- dependencies
- public API/output
- data model
- architecture
- deployment
- migrations
- known limitations

Final output must include:

```txt
DOCS
Updated:
Not updated:
Reason:
```

---

## Install manual

For step-by-step setup instructions for Claude Code, OpenAI Codex, GitHub Copilot, Cursor, OpenCode, Aider, Continue, Windsurf, and generic AI chat, see:

```txt
docs/INSTALL_FOR_DUMMIES.md
```

## Quick start

### Option 1: Use as `AGENTS.md`

Copy the universal file into your repository root:

```bash
cp AEON_UNIVERSAL_AGENTS.md AGENTS.md
```

Then commit it:

```bash
git add AGENTS.md
git commit -m "Add AEON universal agent instructions"
```

Your coding agent should now read it as project guidance.

---

### Option 2: Use with Claude Code

Copy it as:

```bash
cp AEON_UNIVERSAL_AGENTS.md CLAUDE.md
```

---

### Option 3: Use with GitHub Copilot custom instructions

Copy the relevant sections into:

```txt
.github/copilot-instructions.md
```

---

### Option 4: Use with Cursor

Place it in:

```txt
.cursor/rules/aeon.mdc
```

---

## Recommended repository structure

A simple public repository can look like this:

```txt
aeon-universal-agents/
├── README.md
├── AGENTS.md
├── AEON_UNIVERSAL_AGENTS.md
├── LICENSE
└── examples/
    ├── AGENTS.minimal.md
    ├── AGENTS.frontend.md
    └── AGENTS.backend.md
```

Recommended:

- Keep `AEON_UNIVERSAL_AGENTS.md` as the versioned source file.
- Keep `AGENTS.md` as the practical file users can copy directly.
- Add examples later if the community requests them.

---

## Suggested usage inside a project

After adding AEON to a repo, customize it with project-specific facts.

For example:

```md
# Project-specific additions

## Setup

```bash
npm install
npm run dev
```

## Test

```bash
npm test
npm run lint
```

## Architecture

- API routes are in `src/routes`.
- Business logic is in `src/services`.
- Database access is in `src/db`.
- UI components are in `src/components`.

## Do not

- Do not add new dependencies without approval.
- Do not change public API response shapes without updating docs.
- Do not claim tests passed unless they were run.
```

AEON is the universal base.
Your repo-specific notes should override it.

---

## Design philosophy

AEON is built around a few hard beliefs:

### Objective beats confident

An agent that says “I do not know” is better than an agent that invents.

### Small beats bloated

The best code is the smallest code that safely achieves the objective.

### Core code beats magic

Use the language and runtime directly where practical.

### Existing docs matter

The repository’s README, architecture docs, and agent instructions are the project truth.

### MVC is a thinking tool

Clear responsibility matters in every stack.

### Frontend quality matters

A feature is not finished if it works technically but is bad for users.

### Documentation is part of the codebase

If behavior changes, docs may need to change.

---

## Who this is for

AEON is useful for:

- solo developers
- open-source maintainers
- teams using AI coding agents
- developers working with large codebases
- developers who want less hallucination and less bloat
- teams that want more consistent AI-generated patches
- people using Claude Code, Codex, Copilot, Cursor, or other coding agents

---

## What this is not

AEON is not:

- a framework
- a package
- a runtime
- a prompt gimmick
- a replacement for engineering judgment
- a guarantee that an AI agent will always be correct

It is an instruction standard that pushes agents toward better engineering behavior.

---

## Roadmap

Possible future additions:

- minimal version
- frontend-focused version
- backend/API-focused version
- security-focused version
- AGENTS.md examples for common stacks
- comparison examples: bad agent output vs AEON-guided output
- community translations
- contribution guide

---

## Contributing

Contributions are welcome.

Good contributions:

- make the file more universal
- reduce hallucination risk
- improve safety
- improve clarity
- reduce bloat
- improve frontend/user-quality guidance
- improve documentation discipline
- improve test and verification discipline

Avoid contributions that:

- make it specific to one company or project
- force one framework or stack
- add hype language
- make the file unnecessarily long
- encourage agents to claim things they did not verify

---

## Versioning

This repository uses simple document versioning.

Current version:

```txt
v8
```

Recommended stable filename:

```txt
AGENTS.md
```

Versioned source filename:

```txt
AEON_UNIVERSAL_AGENTS.md
```

---

## License

Choose a license before publishing.

Recommended options:

- **MIT** if you want maximum reuse.
- **CC0** if you want to make it public domain-like.
- **Apache-2.0** if you want patent protection language.

For maximum developer adoption, MIT is a strong default.

---

## Core command

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

---

## Final note

AEON is simple on purpose.

The goal is not to make agents talk more.
The goal is to make them work better.
