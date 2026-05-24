'use strict';

const fs = require('fs');
const path = require('path');

const ESSENTIAL = [
  { id: 'setup', keywords: ['setup', 'install', 'npm install', 'pip install', 'cargo build', 'go mod', 'getting started', 'npm ci', 'yarn install', 'pnpm install'], label: 'Setup / install commands' },
  { id: 'run', keywords: ['run', 'start', 'dev', 'serve', 'npm run', 'npm start', 'node ', 'python ', 'go run', 'cargo run', 'flask run', 'rails s'], label: 'Run commands' },
  { id: 'test', keywords: ['test', 'verify', 'spec', 'jest', 'vitest', 'pytest', 'go test', 'npm test', 'check', 'cargo test'], label: 'Test / verification commands' },
  { id: 'structure', keywords: ['structure', 'layout', 'directory', 'folder', 'architecture', 'module', 'src/', 'lib/', 'models/', 'controllers/', 'app/', 'packages/'], label: 'Project structure' },
  { id: 'donot', keywords: ['do not', "don't", 'never', 'forbidden', 'avoid', 'must not', 'off-limits', 'prohibited'], label: 'Do-not rules / boundaries' },
];

const RECOMMENDED = [
  { id: 'conventions', keywords: ['convention', 'style', 'naming', 'pattern', 'coding standard', 'consistent'], label: 'Code conventions' },
  { id: 'security', keywords: ['security', 'auth', 'secret', 'permission', 'sanitize', 'xss', 'csrf', 'credential', 'token', 'password'], label: 'Security guidance' },
  { id: 'errors', keywords: ['error', 'exception', 'failure', 'retry', 'fallback', 'error handling', 'catch', 'throw'], label: 'Error handling' },
  { id: 'env', keywords: ['environment', 'env', 'config', 'variable', '.env', 'DATABASE_URL', 'API_KEY', 'PORT', 'SECRET'], label: 'Environment / config' },
  { id: 'done', keywords: ['done when', 'done if', 'definition of done', 'complete when', 'before merging', 'acceptance', 'ready when', 'pr must', 'merge criteria'], label: 'Definition of done' },
];

const VAGUE_PATTERNS = [
  { pattern: /follow best practices/i, msg: '"follow best practices" — which practices? Be specific.' },
  { pattern: /write clean code/i, msg: '"write clean code" — vague. Define what clean means here.' },
  { pattern: /use proper\s/i, msg: '"use proper..." — proper according to what? State the rule.' },
  { pattern: /be careful\s/i, msg: '"be careful" — describe the actual risk and constraint.' },
  { pattern: /make sure to\s/i, msg: '"make sure to..." — rewrite as a direct rule.' },
  { pattern: /don't forget\s/i, msg: '"don\'t forget" — state it as a rule, not a reminder.' },
  { pattern: /keep in mind/i, msg: '"keep in mind" — state the constraint directly.' },
  { pattern: /as (?:needed|appropriate|necessary)/i, msg: '"as needed/appropriate" — define when it\'s needed.' },
  { pattern: /maintain quality/i, msg: '"maintain quality" — define measurable quality criteria.' },
  { pattern: /when possible/i, msg: '"when possible" — define the condition explicitly.' },
  { pattern: /try to avoid/i, msg: '"try to avoid" — either forbid it or allow it with criteria.' },
  { pattern: /use common sense/i, msg: '"use common sense" — agents don\'t have common sense. State the rule.' },
];

const STYLE_AS_INSTRUCTION = [
  { pattern: /indent(ation)?\s*(with\s*)?\d\s*(space|tab)/i, msg: 'Indentation rules belong in .editorconfig or linter config.' },
  { pattern: /use\s+(single|double)\s+quotes/i, msg: 'Quote style belongs in linter config (eslint/prettier).' },
  { pattern: /semicolons?\s*(at|after|required|always)/i, msg: 'Semicolon rules belong in linter config.' },
  { pattern: /trailing\s+comma/i, msg: 'Trailing comma rules belong in linter config.' },
  { pattern: /max(imum)?\s+line\s+length\s*\d/i, msg: 'Line length limits belong in linter config.' },
  { pattern: /tab width\s*\d/i, msg: 'Tab width belongs in .editorconfig.' },
  { pattern: /\bbrace\s+style\b/i, msg: 'Brace style belongs in linter config.' },
];

const IMPERATIVE_MARKERS = /^[-*]\s+(do not|don't|never|always|must|should|use |run |keep |avoid |prefer |ensure |require|no\s|only\s|every\s|verify|check |validate|sanitize|hash |log |test |delete |add |remove |create |update |return |throw |catch |handle )/i;
const DIRECTIVE_VERBS = /\b(do not|don't|never|always|must|should|avoid|prefer|ensure|require|verify|validate|keep|use|run|check|test|sanitize|hash|log|return|throw|handle|prevent|protect|enforce|limit|restrict|allow|deny|commit|push|deploy|install|build|start|stop|delete|remove|add|update|create|read|write|import|export)\b/i;
const COMMAND_PATTERN = /`[^`]*(?:npm|yarn|pnpm|pip|cargo|go |make |docker|git |node |python |ruby |rails|curl |wget )[^`]*`/i;
const PATH_PATTERN = /(?:`([^`]+\/[^`]*)`|(?:^|\s)((?:\.\/|\.\.\/|\/)?[a-zA-Z_][a-zA-Z0-9_\-.]*(?:\/[a-zA-Z0-9_\-.*]+)+\/?)|(?:^|\s)((?:[a-zA-Z_][a-zA-Z0-9_\-.]*\/)+[a-zA-Z0-9_\-.*]+))/;
const SPECIFIC_CONSTRAINT = /\b(?:maximum|minimum|at least|at most|no more than|exactly|must be|required|forbidden|never|always|before|after|only)\b/i;

function parseMarkdown(text) {
  const lines = text.split('\n');
  const sections = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      if (current) sections.push(current);
      current = { level: headingMatch[1].length, title: headingMatch[2].trim(), startLine: i + 1, lines: [] };
    } else if (current) {
      current.lines.push({ num: i + 1, text: line });
    }
  }
  if (current) sections.push(current);

  return { lines, sections, lineCount: lines.length };
}

function extractRules(parsed) {
  const rules = { enforceable: [], actionable: [], vague: [], total: 0 };
  let inCodeBlock = false;

  for (const line of parsed.lines) {
    if (line.startsWith('```')) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;

    const isBullet = /^\s*[-*]\s+.{8,}/.test(line);
    if (!isBullet) continue;

    const content = line.replace(/^\s*[-*]\s+/, '').trim();
    if (!content || content.startsWith('http') || content.startsWith('![')) continue;

    const hasImperative = IMPERATIVE_MARKERS.test(line);
    if (!DIRECTIVE_VERBS.test(content) && !hasImperative) continue;

    rules.total++;

    const hasCommand = COMMAND_PATTERN.test(line);
    const hasPath = PATH_PATTERN.test(line);
    const hasConstraint = SPECIFIC_CONSTRAINT.test(line);
    const hasCodeRef = /`[^`]+`/.test(line);

    const signals = [hasCommand, hasPath, hasConstraint, hasImperative, hasCodeRef].filter(Boolean).length;

    if (signals >= 3 || (hasCommand && hasConstraint) || (hasImperative && hasPath)) {
      rules.enforceable.push({ line: parsed.lines.indexOf(line) + 1, text: content, signals });
    } else if (signals >= 1) {
      rules.actionable.push({ line: parsed.lines.indexOf(line) + 1, text: content, signals });
    } else {
      rules.vague.push({ line: parsed.lines.indexOf(line) + 1, text: content });
    }
  }

  return rules;
}

const KNOWN_DIRS = new Set([
  'src', 'lib', 'app', 'bin', 'cmd', 'pkg', 'internal', 'api', 'server',
  'models', 'model', 'controllers', 'controller', 'views', 'view',
  'routes', 'route', 'services', 'service', 'middleware', 'config',
  'test', 'tests', '__tests__', 'spec', 'public', 'static', 'assets',
  'scripts', 'tools', 'utils', 'helpers', 'docs', 'pages', 'components',
  'hooks', 'store', 'stores', 'migrations', 'seeders', 'prisma',
  '.github', '.cursor', '.claude', 'agent_docs',
]);

const PATH_NOISE = new Set([
  'date/time', 'input/output', 'read/write', 'client/server',
  'frontend/backend', 'request/response', 'success/failure',
  'true/false', 'yes/no', 'on/off', 'start/stop',
]);

function extractPaths(text) {
  const paths = new Set();
  const lines = text.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.startsWith('```')) { inCodeBlock = !inCodeBlock; continue; }

    const backtickPaths = line.matchAll(/`([^`]+)`/g);
    for (const m of backtickPaths) {
      const p = m[1].trim();
      if (!p.includes('/')) continue;
      if (p.startsWith('http') || p.includes(' ') || p.length > 100) continue;
      if (/^(npm|pip|cargo|go |docker|git |curl |wget |ruby |python |node )/.test(p)) continue;

      const hasExt = /\.\w{1,6}$/.test(p);
      const startsKnown = KNOWN_DIRS.has(p.split('/')[0]);
      const startsRelative = p.startsWith('./') || p.startsWith('../') || p.startsWith('/');

      if (hasExt || startsKnown || startsRelative) {
        paths.add(p.replace(/^\.\//, ''));
      }
    }

    if (!inCodeBlock) {
      const dirRefs = line.matchAll(/(?:^|\s)`?((?:[a-zA-Z_][a-zA-Z0-9_\-.]+\/){1,5}[a-zA-Z0-9_\-.*]*)`?/g);
      for (const m of dirRefs) {
        const p = m[1].trim().replace(/\/$/, '');
        if (p.length < 4 || p.length > 80) continue;
        if (PATH_NOISE.has(p.toLowerCase())) continue;
        if (/^https?:/.test(p)) continue;

        const firstDir = p.split('/')[0];
        if (KNOWN_DIRS.has(firstDir) || /\.\w{1,6}$/.test(p)) {
          paths.add(p);
        }
      }
    }
  }

  return [...paths];
}

function checkStalePaths(text, repoRoot) {
  if (!repoRoot) return [];
  const issues = [];
  const paths = extractPaths(text);

  for (const p of paths) {
    const clean = p.replace(/\*.*$/, '').replace(/\/$/, '');
    if (!clean || clean.length < 2) continue;
    if (/^(node_modules|\.git|dist|build|coverage|__pycache__|\.env)/.test(clean)) continue;
    if (/\$\{|<%|{{/.test(clean)) continue;

    const full = path.join(repoRoot, clean);
    if (!fs.existsSync(full)) {
      const asDir = full.replace(/\.[^.]+$/, '');
      if (fs.existsSync(asDir)) continue;
      issues.push({ severity: 'warning', rule: 'staleness/path-not-found', line: null, message: `"${p}" referenced but not found in repo. Stale or wrong path?` });
    }
  }

  return issues;
}

function checkCoverage(text, topics) {
  const lower = text.toLowerCase();
  return topics.map(topic => ({
    ...topic,
    found: topic.keywords.some(kw => lower.includes(kw)),
  }));
}

function checkVagueLanguage(lines) {
  const issues = [];
  let inCodeBlock = false;
  lines.forEach((line, i) => {
    if (line.startsWith('```')) { inCodeBlock = !inCodeBlock; return; }
    if (inCodeBlock) return;
    VAGUE_PATTERNS.forEach(({ pattern, msg }) => {
      if (pattern.test(line)) {
        issues.push({ severity: 'warning', rule: 'vague-language', line: i + 1, message: msg });
      }
    });
  });
  return issues;
}

function checkStyleAsInstruction(lines) {
  const issues = [];
  let inCodeBlock = false;
  lines.forEach((line, i) => {
    if (line.startsWith('```')) { inCodeBlock = !inCodeBlock; return; }
    if (inCodeBlock) return;
    STYLE_AS_INSTRUCTION.forEach(({ pattern, msg }) => {
      if (pattern.test(line)) {
        issues.push({ severity: 'info', rule: 'style-as-instruction', line: i + 1, message: msg });
      }
    });
  });
  return issues;
}

function checkSize(lineCount) {
  const issues = [];
  if (lineCount > 800) {
    issues.push({ severity: 'error', rule: 'size/critical', line: null, message: `${lineCount} lines — agents will actively ignore large sections. Split into sub-documents or imports.` });
  } else if (lineCount > 500) {
    issues.push({ severity: 'warning', rule: 'size/heavy', line: null, message: `${lineCount} lines — approaching the limit where agents start losing context. Consider splitting.` });
  } else if (lineCount > 300) {
    issues.push({ severity: 'info', rule: 'size/moderate', line: null, message: `${lineCount} lines — still manageable, but keep an eye on growth.` });
  }
  return issues;
}

function checkStructure(parsed) {
  const issues = [];
  if (parsed.sections.length === 0) {
    issues.push({ severity: 'error', rule: 'structure/no-headings', line: null, message: 'No markdown headings found. Use ## headings to organize sections.' });
  }

  const codeBlockCount = (parsed.lines.join('\n').match(/```/g) || []).length / 2;
  if (codeBlockCount === 0 && parsed.lineCount > 20) {
    issues.push({ severity: 'warning', rule: 'structure/no-code-blocks', line: null, message: 'No code blocks found. Use ```bash blocks for commands to make them unambiguous.' });
  }

  const bulletCount = parsed.lines.filter(l => /^\s*[-*]\s/.test(l)).length;
  if (bulletCount === 0 && parsed.lineCount > 30) {
    issues.push({ severity: 'warning', rule: 'structure/no-lists', line: null, message: 'No bullet lists found. Lists make rules scannable and extractable.' });
  }

  const emptySections = parsed.sections.filter(s => {
    const contentLines = s.lines.filter(l => l.text.trim().length > 0);
    return contentLines.length === 0;
  });
  if (emptySections.length > 0) {
    emptySections.forEach(s => {
      issues.push({ severity: 'warning', rule: 'structure/empty-section', line: s.startLine, message: `Section "${s.title}" is empty.` });
    });
  }

  return issues;
}

function checkDuplicateRules(parsed) {
  const issues = [];
  const seen = new Map();
  let inCodeBlock = false;

  for (const line of parsed.lines) {
    if (line.startsWith('```')) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;
    if (!/^\s*[-*]\s+.{15,}/.test(line)) continue;

    const normalized = line.replace(/^\s*[-*]\s+/, '').trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
    if (normalized.length < 15) continue;

    const key = normalized.slice(0, 50);
    if (seen.has(key)) {
      issues.push({ severity: 'info', rule: 'quality/possible-duplicate', line: parsed.lines.indexOf(line) + 1, message: `Possibly duplicates rule near line ${seen.get(key)}.` });
    } else {
      seen.set(key, parsed.lines.indexOf(line) + 1);
    }
  }

  return issues;
}

function computeScore(essential, recommended, issues, lineCount, rules) {
  let score = 0;

  const essentialFound = essential.filter(e => e.found).length;
  score += Math.round((essentialFound / essential.length) * 30);

  const recFound = recommended.filter(r => r.found).length;
  score += Math.round((recFound / recommended.length) * 15);

  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  const qualityDeductions = Math.min(20, errors * 8 + warnings * 2);
  score += 20 - qualityDeductions;

  if (lineCount <= 300) score += 10;
  else if (lineCount <= 500) score += 7;
  else if (lineCount <= 800) score += 3;

  if (rules.total > 0) {
    const enforceableRatio = rules.enforceable.length / rules.total;
    const actionableRatio = (rules.enforceable.length + rules.actionable.length) / rules.total;
    score += Math.round(enforceableRatio * 15);
    score += Math.round(actionableRatio * 10);
  }

  return Math.max(0, Math.min(100, score));
}

exports.analyze = function analyze(filePath, opts = {}) {
  const text = fs.readFileSync(filePath, 'utf8');
  const parsed = parseMarkdown(text);

  const essential = checkCoverage(text, ESSENTIAL);
  const recommended = checkCoverage(text, RECOMMENDED);
  const rules = extractRules(parsed);

  const issues = [
    ...checkSize(parsed.lineCount),
    ...checkStructure(parsed),
    ...checkVagueLanguage(parsed.lines),
    ...checkStyleAsInstruction(parsed.lines),
    ...checkDuplicateRules(parsed),
  ];

  if (opts.repoRoot) {
    issues.push(...checkStalePaths(text, opts.repoRoot));
  }

  const score = computeScore(essential, recommended, issues, parsed.lineCount, rules);

  return {
    file: filePath,
    score,
    stats: {
      lines: parsed.lineCount,
      sections: parsed.sections.length,
      codeBlocks: Math.floor((text.match(/```/g) || []).length / 2),
      bulletRules: parsed.lines.filter(l => /^\s*[-*]\s/.test(l)).length,
    },
    rules: {
      total: rules.total,
      enforceable: rules.enforceable.length,
      actionable: rules.actionable.length,
      vague: rules.vague.length,
      ratio: rules.total > 0 ? Math.round(((rules.enforceable.length + rules.actionable.length) / rules.total) * 100) : 0,
      samples: {
        enforceable: rules.enforceable.slice(0, 3),
        vague: rules.vague.slice(0, 3),
      },
    },
    coverage: { essential, recommended },
    issues: issues.sort((a, b) => {
      const sev = { error: 0, warning: 1, info: 2 };
      return (sev[a.severity] || 3) - (sev[b.severity] || 3);
    }),
  };
};

exports.discoverFiles = function discoverFiles(dir) {
  const files = [];
  const candidates = [
    'AGENTS.md', 'CLAUDE.md', '.cursorrules',
    '.github/copilot-instructions.md', '.cursor/rules',
  ];

  for (const name of candidates) {
    const full = path.join(dir, name);
    try {
      const stat = fs.statSync(full);
      if (stat.isFile()) files.push(full);
      if (stat.isDirectory()) {
        const entries = fs.readdirSync(full).filter(f => f.endsWith('.md') || f.endsWith('.mdc'));
        entries.forEach(e => files.push(path.join(full, e)));
      }
    } catch { /* not found */ }
  }

  return files;
};
