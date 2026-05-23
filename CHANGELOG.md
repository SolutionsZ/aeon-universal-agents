# Changelog

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
