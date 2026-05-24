# AEON Universal Agents

**Generate, lint, and improve `AGENTS.md` files for AI coding agents.**

AEON is a universal `AGENTS.md` standard plus a zero-dependency CLI that helps coding agents read the repo first, avoid hallucinations, write less code, preserve structure, update docs, and test honestly.

---

## Quick start

```bash
git clone https://github.com/SolutionsZ/aeon-universal-agents.git
cd aeon-universal-agents/tools/aeon-cli
```

**Generate an AGENTS.md for your project:**

```bash
node bin/aeon.js init --stdout           # preview (auto-detects your stack)
node bin/aeon.js init /path/to/project   # generate project-specific file
```

**Or use a template profile:**

```bash
node bin/aeon.js init --profile core       # lean universal rules (~250 lines)
node bin/aeon.js init --profile full       # full production doctrine (~1400 lines)
node bin/aeon.js init --profile minimal    # bare minimum
node bin/aeon.js init --profile frontend   # frontend/UI focused
node bin/aeon.js init --profile backend    # backend/API focused
```

**Lint an existing AGENTS.md:**

```bash
node bin/aeon.js lint AGENTS.md
```

**Scan for all instruction files:**

```bash
node bin/aeon.js scan /path/to/project
```

Or copy directly:

```bash
cp AEON_CORE.md /path/to/your/project/AGENTS.md        # lean
cp AEON_UNIVERSAL_AGENTS.md /path/to/your/project/AGENTS.md  # full
```

| Tool | Filename |
|------|----------|
| Universal / default | `AGENTS.md` |
| Claude Code | `CLAUDE.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Cursor | `.cursor/rules/aeon.mdc` |

---

## CLI output example

```
$ node bin/aeon.js lint AGENTS.md

  ╭─────────────────────╮
  │  AEON CLI v3.0.0    │
  ╰─────────────────────╯

  ── Score ──
  92 / A

  ── Stats ──
  248 lines  14 sections  8 code blocks

  ── Rule Extraction ──
  ████████████████████ 88% actionable
  12 enforceable  8 actionable  2 vague  (22 total)

  ── Coverage ──
  ✓ Setup commands          ✓ Run commands
  ✓ Test commands           ✓ Project structure
  ✓ Do-not rules            ✓ Definition of done
  ✓ Conventions             ✓ Security notes
  – Error handling          – Environment config

  0 errors  1 warnings  2 info
```

---

## Before and after AEON

**Without AEON — agent says:**

> "I updated the API and tests pass."

**What actually happened:**
- did not run tests
- changed response shape without versioning
- ignored README
- added 2 new dependencies
- no docs update

**With AEON — agent says:**

> "Changed one validation guard in `src/policy/input.js:42`. Tests not run — no test command found in package.json. Docs not updated — public behavior did not change. Added: 3 lines. Removed: 1 line. Risk: low."

---

## What this repository includes

```txt
AGENTS.md                      ← canonical copy file (full standard)
AEON_UNIVERSAL_AGENTS.md       ← versioned source (v9.0)
AEON_CORE.md                   ← lean core version (~250 lines)
tools/aeon-cli/                ← CLI: generate, scan, lint
examples/                      ← scoped variants (minimal, frontend, backend)
docs/INSTALL_FOR_DUMMIES.md    ← step-by-step setup for every coding agent
```

---

## What AEON teaches agents to do

### 1. Stay objective

Agents must not invent facts, files, commands, APIs, schemas, logs, or test results.

```txt
VERIFIED         — what was actually checked
NOT VERIFIED     — what was not checked
ASSUMPTION       — what was assumed
IMPACT           — what could go wrong
```

### 2. Read the repository first

Before changing code, check for existing project truth: `README.md`, `AGENTS.md`, `package.json` scripts, `Makefile`, `docs/`, `.env.example`, and architecture files. Existing repo docs override generic assumptions.

### 3. Use MVC as a thinking model

Clear responsibility, not more folders:

```txt
MODEL       data, state, schemas, persistence
VIEW        UI, rendered output, API responses
CONTROLLER  input handling, routes, orchestration
SERVICE     operations, integrations, mail, queues
POLICY      validation, permissions, limits
ADAPTER     format/vendor/protocol translation
WORKER      background jobs, scheduled tasks
INFRA       deployment, CI/CD, observability
```

### 4. Build from scratch properly

Start with a runnable vertical slice, not architecture theater:

```txt
input → validation → action → output → error path → run command
```

### 5. Use core code first

Use the language and runtime directly. Libraries when justified. Frameworks when beneficial. No dependency-first thinking.

### 6. Write the smallest safe amount of code

Delete before adding. Reuse before creating. No speculative architecture. Report code economy.

### 7. Keep frontend clean and professional

Mobile-first. Responsive. Accessible. Fast. Touch-friendly. Clear loading, empty, and error states. The coder is also the designer.

### 8. Keep documentation updated

Every change considers: setup, run commands, test commands, env vars, dependencies, API shape, data model, architecture, deployment, known limits.

---

## CLI details

The CLI lives in `tools/aeon-cli/`. Zero dependencies. Pure Node.js (`fs` + `path`). Requires Node 18+.

### `aeon init` — Generate AGENTS.md

Scans your project and generates a project-specific AGENTS.md.

| Detects | Examples |
|---------|----------|
| Runtime | Node.js, Python, Go, Rust, Ruby, PHP, Java, Elixir |
| Framework | Express, Next, React, Vue, Django, Flask, FastAPI, Gin, Actix, + more |
| ORM | Sequelize, Prisma, TypeORM, Drizzle, Mongoose, SQLAlchemy, + more |
| Tests | Jest, Vitest, Mocha, pytest, go test, cargo test |
| Linter | ESLint, Biome, Prettier, Ruff, Flake8, mypy |
| Structure | MVC pattern, src/lib layout, test dirs, Docker, CI/CD |

### `aeon lint` — Analyze quality

Scores your AGENTS.md across five dimensions:

| Dimension | Weight | Checks |
|-----------|--------|--------|
| Essential coverage | 30% | Setup, run, test commands; structure; do-not rules |
| Recommended coverage | 15% | Conventions, security, error handling, env config |
| Quality | 20% | Vague language, anti-patterns, duplicates, empty sections |
| Size discipline | 10% | Line count vs agent context window limits |
| Rule actionability | 25% | Enforceable vs actionable vs vague rules |

### `aeon scan` — Discover instruction files

Finds all agent instruction files in a repo: `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `copilot-instructions.md`, `.cursor/rules/*.md`.

---

## Suggested usage inside a project

After adding AEON to a repo, customize it with project-specific facts:

**Setup and commands:**

```bash
npm install
npm run dev
npm test
npm run lint
```

**Architecture notes:**

- API routes are in `src/routes`.
- Business logic is in `src/services`.
- Database access is in `src/db`.

**Do-not rules:**

- Do not add new dependencies without approval.
- Do not change public API response shapes without updating docs.
- Do not claim tests passed unless they were run.

AEON is the universal base. Your repo-specific notes should override it.

---

## Install manual

For step-by-step setup instructions for Claude Code, OpenAI Codex, GitHub Copilot, Cursor, OpenCode, Aider, Continue, Windsurf, and generic AI chat, see `docs/INSTALL_FOR_DUMMIES.md`.

---

## Design philosophy

| Principle | Meaning |
|-----------|---------|
| Objective beats confident | "I do not know" beats inventing facts |
| Small beats bloated | Smallest safe code wins |
| Core code beats magic | Use the language directly where practical |
| Existing docs matter | The repo's README is project truth |
| MVC is a thinking tool | Clear responsibility in every stack |
| Frontend quality matters | Not done if it works but looks broken |
| Docs are part of code | Behavior changes may need doc changes |

---

## Who this is for

- Solo developers and open-source maintainers
- Teams using AI coding agents
- Developers who want less hallucination and less bloat
- People using Claude Code, Codex, Copilot, Cursor, or other coding agents

---

## Contributing

See `CONTRIBUTING.md`. Good contributions make the standard more universal, reduce hallucination risk, improve safety, reduce bloat, or improve clarity. Avoid contributions that force one framework, add hype language, or encourage agents to claim things they did not verify.

---

## Versioning

Current version: **v9**

- `AGENTS.md` — canonical copy file
- `AEON_UNIVERSAL_AGENTS.md` — versioned source

---

## License

MIT. See `LICENSE`.
