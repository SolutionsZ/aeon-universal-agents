# Changelog

## v9.0 - Planning protocol, edit safety, self-correction, verifiable goals, context management

Integrated battle-tested patterns from agent-md (iamfakeguru/claude-md) and Karpathy-inspired CLAUDE.md (220K+ combined GitHub stars) into AEON's universal framework.

Added:

- **Planning protocol** (§2) — structured plan-before-execute sequence for non-trivial work: Context, Questions, Structure, Steps, Execute
- **Execution limits** (§2) — bounded phases (~5 files per pass), no mixing refactors with features, scope-growth detection
- **Edit safety** (§8) — re-read before and after editing, comprehensive search on renames (calls, types, strings, dynamic imports, barrel files, test mocks), never delete without verifying references
- **Surgical change test** (§8) — every changed line must trace directly to the user's request
- **Self-Correction Law** (§13, new) — if a fix fails twice, stop and re-read top-down; note correction patterns; test from fresh user perspective; detect and break loops
- **Verifiable goals** (§18) — transform vague tasks into concrete test-first goals with step+verify pairs
- **Context management** (§20) — re-read files after long conversations, chunk large files, handle truncated output, selective context loading
- Updated Final Command with 7 new principles from above additions

Changed:

- §19 Context Compression renamed to §20 Context and Memory Law — now includes context management subsection
- Sections renumbered 13–24 (added Self-Correction as §13, shifted all subsequent sections)

## v8.1 - Enforcement, stop gates, hardened security

Added:

- proof-of-work enforcement to anti-hallucination law — agents must cite path, output, or doc before claiming facts
- stop gates in task contract — agents must confirm before deleting files, changing auth/schema, adding deps, or unsolicited refactors
- "do not modernize" rules in patch discipline — never rename, restructure, or replace working patterns without explicit request
- version control discipline — commit hygiene, secret protection, .gitignore enforcement
- DOMAIN and INFRA layers added to §3A MVC/Structure to match §3 Universal System Model
- hardened security law — XSS prevention, CSRF, CORS, rate limiting, file upload validation, password hashing, HTTPS, security headers
- updated final command with design discipline, stop-gate, and anti-modernize lines

Fixed:

- section numbering: removed A-suffix confusion (15A→15, 19A→20), renumbered 15–23 sequentially
- removed double-blank-line formatting inconsistencies
- version header updated from 8.0 to 8.1

## v8.0.1 - Database, persistence, and design guidance

Added:

- SQLite vs PostgreSQL right-sizing rules (small sites/tools vs production)
- Sequelize models and migrations guidance for Node.js SQL projects
- engineer-as-designer rule: frontend work requires design discipline, not just working code
- DESIGN CHECK and expanded FRONTEND AND DESIGN LAW

## v8.0.0 - Initial public release

Initial community-ready release of AEON Universal Agents.

Included:

- anti-hallucination rules
- repository pre-flight checks
- documentation maintenance law
- universal MVC / structure law
- greenfield build protocol
- core-code / vanilla engineering law
- code economy law
- frontend quality law
- patch discipline
- state and async safety rules
- security, performance, database, API, test, and review laws
- output contracts for bug fixing, new builds, reviews, and handoffs
