# Install Manual for Dummies

This guide explains how to use **AEON Universal Agents** with common AI coding tools.

AEON is not a program you install.
AEON is an instruction file for coding agents.

You place the file in your project so your AI coding tool knows how to behave.

---

## What file do I need?

The most important file is:

```txt
AGENTS.md
```

This is the universal instruction file.

Put it in the root of your project:

```txt
your-project/
├── AGENTS.md
├── README.md
├── src/
└── ...
```

Your coding agent should read it before making changes.

---

## What does AEON do?

AEON tells your coding agent to:

```txt
Read the repo first.
Stay objective.
Do not hallucinate.
Use the smallest safe amount of code.
Keep MVC responsibilities clear.
Keep frontend clean and mobile-friendly.
Update documentation.
Test or say it was not tested.
No fluff.
Ship.
```

---

# 1. Universal installation

Use this for any project.

## Step 1 — Copy the file

Copy this file:

```txt
AGENTS.md
```

Into your project root.

Example:

```bash
cp AGENTS.md /path/to/your-project/AGENTS.md
```

## Step 2 — Open your coding agent

Open your project with your AI coding tool.

## Step 3 — Tell the agent

Use this prompt:

```txt
Read AGENTS.md first and follow it for all work in this repository.
Before changing code, inspect the README, docs, and existing project instructions.
```

Done.

---

# 2. Claude Code

Claude Code commonly uses:

```txt
CLAUDE.md
```

## Option A — Recommended

Keep both files:

```txt
your-project/
├── AGENTS.md
└── CLAUDE.md
```

Copy AEON into both:

```bash
cp AGENTS.md CLAUDE.md
```

## Option B — CLAUDE.md only

If you only use Claude Code:

```bash
cp AGENTS.md CLAUDE.md
```

## First Claude Code prompt

```txt
Read CLAUDE.md and AGENTS.md first.
Follow these instructions for the entire repository.
Do not change code until you have checked existing README/docs/instructions.
```

---

# 3. OpenAI Codex / Codex-style agents

For Codex-style agents, use:

```txt
AGENTS.md
```

Put it in the repository root.

```txt
your-project/
├── AGENTS.md
├── README.md
└── src/
```

Recommended first prompt:

```txt
Read AGENTS.md first.
Then inspect the repo structure, README, docs, and test commands.
Do not assume commands or files exist.
```

For nested projects, you can add additional `AGENTS.md` files inside subfolders.
More specific files should override the root file.

Example:

```txt
your-project/
├── AGENTS.md
├── frontend/
│   └── AGENTS.md
└── backend/
    └── AGENTS.md
```

---

# 4. GitHub Copilot

GitHub Copilot custom instructions usually use:

```txt
.github/copilot-instructions.md
```

## Step 1 — Create folder

```bash
mkdir -p .github
```

## Step 2 — Copy AEON

```bash
cp AGENTS.md .github/copilot-instructions.md
```

## Step 3 — Commit it

```bash
git add .github/copilot-instructions.md
git commit -m "Add AEON Copilot instructions"
```

Recommended:

Also keep `AGENTS.md` in the root for other agents.

```txt
your-project/
├── AGENTS.md
└── .github/
    └── copilot-instructions.md
```

---

# 5. Cursor

Cursor supports project rules.

Recommended path:

```txt
.cursor/rules/aeon.mdc
```

## Step 1 — Create folder

```bash
mkdir -p .cursor/rules
```

## Step 2 — Copy AEON

```bash
cp AGENTS.md .cursor/rules/aeon.mdc
```

## Optional frontmatter

Some Cursor rule files use frontmatter. If needed, add this at the top:

```md
---
description: AEON Universal Agent Rules
alwaysApply: true
---
```

Then paste the AEON content below it.

Recommended structure:

```txt
your-project/
├── AGENTS.md
└── .cursor/
    └── rules/
        └── aeon.mdc
```

---

# 6. OpenCode

For OpenCode or similar terminal coding agents, start with the universal standard:

```txt
AGENTS.md
```

Put it in the project root.

Recommended first prompt:

```txt
Read AGENTS.md before doing anything.
Then inspect README.md, docs, package scripts, Makefile, and existing instructions.
Follow AEON strictly: objective, no hallucinations, smallest safe code, update docs, test or state not tested.
```

If OpenCode supports a custom instruction file, point it to:

```txt
AGENTS.md
```

If it supports a different filename, duplicate the file with that name.

---

# 7. Aider

Aider commonly works well when you include instruction files in the repo and explicitly tell it to read them.

Use:

```txt
AGENTS.md
```

Recommended first prompt:

```txt
Please read AGENTS.md and follow it for all edits.
Before editing, inspect README and relevant docs.
Use the smallest safe diff.
```

If needed, add `AGENTS.md` to the chat/context manually.

---

# 8. Continue / Continue.dev

Use:

```txt
AGENTS.md
```

Recommended:

```txt
your-project/
├── AGENTS.md
└── README.md
```

First prompt:

```txt
Use AGENTS.md as the coding standard for this repository.
Check existing docs before editing.
```

You can also paste the minimal AEON version into Continue custom instructions if your setup supports it.

---

# 9. Windsurf

Use:

```txt
AGENTS.md
```

Recommended first prompt:

```txt
Read AGENTS.md first.
Follow the repo pre-flight, anti-hallucination, code economy, MVC, frontend quality, docs, and test rules.
```

If Windsurf supports project rules, copy the AEON content there too.

---

# 10. Generic AI chat

If you are using a normal AI chat instead of a coding agent:

1. Upload or paste `AGENTS.md`.
2. Say:

```txt
Use this as the instruction standard for the project.
Do not answer yet.
First confirm the rules you will follow in one short summary.
```

Then upload files or ask for changes.

---

# 11. Recommended public repository setup

For the AEON repo itself:

```txt
aeon-universal-agents/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── config.yml
│   │   └── improve_aeon.md
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   └── INSTALL_FOR_DUMMIES.md
├── examples/
│   ├── AGENTS.backend.md
│   ├── AGENTS.frontend.md
│   ├── AGENTS.minimal.md
│   └── AGENTS.repo-template.md
├── .gitignore
├── AEON_UNIVERSAL_AGENTS.md
├── AGENTS.md
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── REPOSITORY_INDEX.md
└── SECURITY.md
```

This is clean and correct.

---

# 12. Which file should users copy?

Most users only need:

```txt
AGENTS.md
```

Advanced users may also use:

```txt
examples/AGENTS.minimal.md
examples/AGENTS.frontend.md
examples/AGENTS.backend.md
examples/AGENTS.repo-template.md
```

---

# 13. Best first prompt for any agent

Use this:

```txt
Read AGENTS.md first.

Before doing any work:
1. Inspect existing repo instructions.
2. Inspect README and docs.
3. Identify setup/run/test commands.
4. Map the relevant files.
5. State assumptions.
6. Then make the smallest safe change.

Do not hallucinate.
Do not claim tests passed unless you ran them.
Update documentation if affected.
```

---

# 14. Quick copy commands

From inside the AEON repository:

## Copy to another project as AGENTS.md

```bash
cp AGENTS.md /path/to/project/AGENTS.md
```

## Copy to Claude Code

```bash
cp AGENTS.md /path/to/project/CLAUDE.md
```

## Copy to GitHub Copilot

```bash
mkdir -p /path/to/project/.github
cp AGENTS.md /path/to/project/.github/copilot-instructions.md
```

## Copy to Cursor

```bash
mkdir -p /path/to/project/.cursor/rules
cp AGENTS.md /path/to/project/.cursor/rules/aeon.mdc
```

---

# 15. Troubleshooting

## The agent ignores the file

Tell it explicitly:

```txt
Read AGENTS.md first and follow it strictly.
```

## The agent still hallucinates

Tell it:

```txt
Use the VERIFIED / NOT VERIFIED / ASSUMPTION format before answering.
```

## The agent writes too much code

Tell it:

```txt
Apply the Code Economy Law.
Use the smallest safe amount of code.
Explain what you avoided adding.
```

## The agent skips documentation

Tell it:

```txt
Apply the Documentation Maintenance Law.
Report DOCS Updated / Not updated / Reason.
```

## The agent breaks frontend quality

Tell it:

```txt
Apply the Frontend Quality Law.
Check mobile, UX, performance, accessibility, loading/error/empty states.
```

---

# 16. Final rule

Do not treat AEON as magic.

AEON improves agent behavior by forcing discipline:

```txt
read first
verify first
map first
patch small
document
test honestly
ship
```
