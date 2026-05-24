# aeon-cli

Generate and analyze AGENTS.md files from any codebase. Zero dependencies.

## Commands

### `aeon init` — Generate AGENTS.md

Scans your project and creates a project-specific AGENTS.md.

```bash
# Preview what it generates
node bin/aeon.js init --stdout

# Write AGENTS.md to project root
node bin/aeon.js init

# Scan a different directory
node bin/aeon.js init /path/to/project

# Write to custom file
node bin/aeon.js init -o MY_AGENTS.md
```

**What it detects:**

- Runtime (Node.js, Python, Go, Rust, Ruby, PHP)
- Framework (Express, Next, React, Vue, Svelte, etc.)
- ORM (Sequelize, Prisma, TypeORM, Drizzle, Mongoose)
- Test framework (Jest, Vitest, Mocha, etc.)
- Linter (ESLint, Biome, Prettier)
- MVC structure (models, controllers, views, routes)
- Scripts from package.json
- Environment variables from .env.example
- Docker and CI/CD presence

### `aeon lint` — Analyze quality

Reads an AGENTS.md (or CLAUDE.md) and scores it for quality, completeness, and anti-patterns.

```bash
# Lint AGENTS.md in current directory
node bin/aeon.js lint

# Lint a specific file
node bin/aeon.js lint path/to/AGENTS.md

# JSON output for CI
node bin/aeon.js lint --json
```

**What it checks:**

| Category | Weight | Checks |
|----------|--------|--------|
| Essential coverage | 40% | Setup, run, test commands; project structure; do-not rules |
| Recommended coverage | 20% | Conventions, security, error handling, env config, definition of done |
| Quality | 25% | Vague language, style-as-instruction anti-patterns, structure |
| Size discipline | 15% | Line count vs agent context limits |

**Scoring:**

| Grade | Score | Meaning |
|-------|-------|---------|
| A | 90–100 | Excellent — lean, complete, actionable |
| B | 80–89 | Good — minor gaps or improvements possible |
| C | 70–79 | Adequate — missing recommended sections or too large |
| D | 60–69 | Needs work — missing essentials or significant quality issues |
| F | 0–59 | Failing — agents will struggle with this file |

## Zero dependencies

Pure Node.js. No npm install needed. Uses only `fs` and `path` from the standard library.

## CI usage

```bash
node tools/aeon-cli/bin/aeon.js lint AGENTS.md
# Exit code 0: no errors
# Exit code 1: critical issues found
```

Use `--json` for machine-readable output.
