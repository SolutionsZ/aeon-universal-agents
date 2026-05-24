'use strict';

const fs = require('fs');

const ESSENTIAL = [
  { id: 'setup', keywords: ['setup', 'install', 'npm install', 'pip install', 'cargo build', 'go mod', 'getting started'], label: 'Setup / install commands' },
  { id: 'run', keywords: ['run', 'start', 'dev', 'serve', 'npm run', 'npm start', 'node ', 'python ', 'go run'], label: 'Run commands' },
  { id: 'test', keywords: ['test', 'verify', 'spec', 'jest', 'vitest', 'pytest', 'go test', 'npm test', 'check'], label: 'Test / verification commands' },
  { id: 'structure', keywords: ['structure', 'layout', 'directory', 'folder', 'architecture', 'module', 'src/', 'lib/', 'models/', 'controllers/'], label: 'Project structure' },
  { id: 'donot', keywords: ['do not', "don't", 'never', 'forbidden', 'avoid', 'must not', 'off-limits', 'prohibited'], label: 'Do-not rules / boundaries' },
];

const RECOMMENDED = [
  { id: 'conventions', keywords: ['convention', 'style', 'naming', 'pattern', 'coding standard', 'consistent'], label: 'Code conventions' },
  { id: 'security', keywords: ['security', 'auth', 'secret', 'permission', 'sanitize', 'xss', 'csrf', 'credential'], label: 'Security guidance' },
  { id: 'errors', keywords: ['error', 'exception', 'failure', 'retry', 'fallback', 'error handling'], label: 'Error handling' },
  { id: 'env', keywords: ['environment', 'env', 'config', 'variable', '.env', 'DATABASE_URL', 'API_KEY'], label: 'Environment / config' },
  { id: 'done', keywords: ['done when', 'done if', 'definition of done', 'complete when', 'before merging', 'acceptance', 'ready when'], label: 'Definition of done' },
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
];

const STYLE_AS_INSTRUCTION = [
  { pattern: /indent(ation)?\s*(with\s*)?\d\s*(space|tab)/i, msg: 'Indentation rules belong in .editorconfig or linter config.' },
  { pattern: /use\s+(single|double)\s+quotes/i, msg: 'Quote style belongs in linter config (eslint/prettier).' },
  { pattern: /semicolons?\s*(at|after|required|always)/i, msg: 'Semicolon rules belong in linter config.' },
  { pattern: /trailing\s+comma/i, msg: 'Trailing comma rules belong in linter config.' },
  { pattern: /max(imum)?\s+line\s+length\s*\d/i, msg: 'Line length limits belong in linter config.' },
];

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

function checkCoverage(text, topics) {
  const lower = text.toLowerCase();
  return topics.map(topic => ({
    ...topic,
    found: topic.keywords.some(kw => lower.includes(kw)),
  }));
}

function checkVagueLanguage(lines) {
  const issues = [];
  lines.forEach((line, i) => {
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
  lines.forEach((line, i) => {
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

  return issues;
}

function computeScore(essential, recommended, issues, lineCount) {
  let score = 0;

  const essentialFound = essential.filter(e => e.found).length;
  score += Math.round((essentialFound / essential.length) * 40);

  const recFound = recommended.filter(r => r.found).length;
  score += Math.round((recFound / recommended.length) * 20);

  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  const qualityDeductions = Math.min(25, errors * 8 + warnings * 3);
  score += 25 - qualityDeductions;

  if (lineCount <= 300) score += 15;
  else if (lineCount <= 500) score += 10;
  else if (lineCount <= 800) score += 5;

  return Math.max(0, Math.min(100, score));
}

exports.analyze = function analyze(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const parsed = parseMarkdown(text);

  const essential = checkCoverage(text, ESSENTIAL);
  const recommended = checkCoverage(text, RECOMMENDED);

  const issues = [
    ...checkSize(parsed.lineCount),
    ...checkStructure(parsed),
    ...checkVagueLanguage(parsed.lines),
    ...checkStyleAsInstruction(parsed.lines),
  ];

  const score = computeScore(essential, recommended, issues, parsed.lineCount);

  return {
    file: filePath,
    score,
    stats: {
      lines: parsed.lineCount,
      sections: parsed.sections.length,
      codeBlocks: Math.floor((text.match(/```/g) || []).length / 2),
      bulletRules: parsed.lines.filter(l => /^\s*[-*]\s/.test(l)).length,
    },
    coverage: { essential, recommended },
    issues: issues.sort((a, b) => {
      const sev = { error: 0, warning: 1, info: 2 };
      return (sev[a.severity] || 3) - (sev[b.severity] || 3);
    }),
  };
};
