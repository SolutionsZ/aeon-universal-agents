# aeon-cli

Generate and analyze AGENTS.md files from any codebase. Zero dependencies. Pure Node.js.

## Commands

### `aeon init` — Generate AGENTS.md

Scans your project and creates a project-specific AGENTS.md following AEON principles.

```bash
node bin/aeon.js init --stdout       # preview output
node bin/aeon.js init                # write AGENTS.md
node bin/aeon.js init /path/to/repo  # scan different directory
node bin/aeon.js init --force        # overwrite existing
node bin/aeon.js init -o CUSTOM.md   # custom output file
```

**What it detects:**

| Category | Detects |
|----------|---------|
| Runtime | Node.js, Python, Go, Rust, Ruby, PHP, Java, Elixir |
| Framework | Express, Next, Nuxt, Fastify, React, Vue, Svelte, Django, Flask, FastAPI, Gin, Actix, Axum, + more |
| ORM | Sequelize, Prisma, TypeORM, Drizzle, Mongoose, SQLAlchemy, Django ORM, Peewee, Knex |
| Tests | Jest, Vitest, Mocha, pytest, go test, cargo test |
| Linter | ESLint, Biome, Prettier, Ruff, Flake8, mypy |
| Structure | MVC pattern, src/lib layout, test directories, Docker, CI/CD |
| Config | .env.example vars, .gitignore, TypeScript, .editorconfig |

**Generated sections:** Setup, Run, Test, Structure, Stack, Environment, Conventions, Security, Error handling, Do-not rules, Definition of done.

### `aeon lint` — Analyze quality

Reads an AGENTS.md (or CLAUDE.md) and scores it across five dimensions.

```bash
node bin/aeon.js lint                # auto-detect in cwd
node bin/aeon.js lint AGENTS.md      # specific file
node bin/aeon.js lint --json         # machine output for CI
node bin/aeon.js lint --no-color     # plain text
```

**Scoring dimensions:**

| Dimension | Weight | What it checks |
|-----------|--------|----------------|
| Essential coverage | 30% | Setup, run, test commands; project structure; do-not rules |
| Recommended coverage | 15% | Conventions, security, error handling, env config, definition of done |
| Quality | 20% | Vague language, style-as-instruction anti-patterns, duplicates, empty sections |
| Size discipline | 10% | Line count vs agent context window limits |
| Rule actionability | 25% | How many rules are enforceable or actionable vs vague |

**Rule extraction** classifies every bullet-point rule as:

- **Enforceable** — references a specific command, path, or measurable constraint
- **Actionable** — clear directive with some specificity
- **Vague** — too general for agents to follow reliably

**Additional checks:**

- Staleness detection: verifies paths mentioned in AGENTS.md exist in the repo
- Duplicate rule detection: flags possible repeated rules
- Empty section detection: catches headings with no content

### `aeon scan` — Discover instruction files

Finds all agent instruction files in a repo.

```bash
node bin/aeon.js scan                # current directory
node bin/aeon.js scan /path/to/repo  # different directory
```

Discovers: `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`, `.cursor/rules/*.md`

## Grading

| Grade | Score | Meaning |
|-------|-------|---------|
| A | 90-100 | Excellent — lean, complete, actionable, agents will follow it |
| B | 80-89 | Good — minor gaps, mostly actionable |
| C | 70-79 | Adequate — missing recommended sections or too large |
| D | 60-69 | Needs work — missing essentials or low actionability |
| F | 0-59 | Failing — agents will struggle with this file |

## CI usage

```bash
node tools/aeon-cli/bin/aeon.js lint AGENTS.md
# Exit code 0: pass
# Exit code 1: critical issues found

node tools/aeon-cli/bin/aeon.js lint --json AGENTS.md
# Machine-readable JSON output
```

## Zero dependencies

Pure Node.js `fs` + `path`. No `npm install` needed. Works with Node 18+.
