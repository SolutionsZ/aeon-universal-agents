'use strict';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgRed: '\x1b[41m',
  bgGray: '\x1b[100m',
};

exports.c = c;

exports.banner = () => [
  '',
  `  ${c.cyan}${c.bold}AEON${c.reset} ${c.white}${c.bold}CLI${c.reset}  ${c.dim}v3.0 — AGENTS.md tooling${c.reset}`,
  `  ${c.dim}${'─'.repeat(52)}${c.reset}`,
  '',
].join('\n');

exports.heading = (text) => `  ${c.cyan}${c.bold}${text}${c.reset}`;

exports.divider = () => `  ${c.dim}${'─'.repeat(52)}${c.reset}`;

exports.ok = (text) => `  ${c.green}✓${c.reset} ${text}`;
exports.warn = (text) => `  ${c.yellow}⚠${c.reset} ${text}`;
exports.err = (text) => `  ${c.red}✗${c.reset} ${text}`;
exports.info = (text) => `  ${c.blue}ℹ${c.reset} ${c.dim}${text}${c.reset}`;
exports.bullet = (text) => `  ${c.dim}•${c.reset} ${text}`;
exports.indent = (text) => `    ${c.dim}${text}${c.reset}`;
exports.blank = () => '';

exports.bar = (ratio, width = 30) => {
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  const color = ratio >= 0.8 ? c.bgGreen : ratio >= 0.6 ? c.bgYellow : c.bgRed;
  return `${color}${' '.repeat(filled)}${c.reset}${c.bgGray}${' '.repeat(empty)}${c.reset}`;
};

exports.score = (n) => {
  const color = n >= 80 ? c.green : n >= 60 ? c.yellow : c.red;
  const grade = n >= 90 ? 'A' : n >= 80 ? 'B' : n >= 70 ? 'C' : n >= 60 ? 'D' : 'F';
  return `${color}${c.bold}${n}${c.reset}${c.dim}/100${c.reset} ${color}${grade}${c.reset}`;
};

exports.scoreLarge = (n) => {
  const color = n >= 80 ? c.green : n >= 60 ? c.yellow : c.red;
  const grade = n >= 90 ? 'A' : n >= 80 ? 'B' : n >= 70 ? 'C' : n >= 60 ? 'D' : 'F';
  const bar = exports.bar(n / 100);
  return [
    `  ${bar} ${color}${c.bold}${n}${c.reset}${c.dim}/100${c.reset}`,
    `  ${c.dim}Grade:${c.reset} ${color}${c.bold}${grade}${c.reset}`,
  ].join('\n');
};

exports.stat = (label, value) => `  ${c.dim}${label}:${c.reset} ${c.white}${value}${c.reset}`;

exports.tag = (label, color) => `${color || c.cyan}${label}${c.reset}`;

exports.table = (rows, colWidths) => {
  return rows.map(row => {
    return '  ' + row.map((cell, i) => {
      const w = colWidths[i] || 20;
      return String(cell).padEnd(w);
    }).join('');
  }).join('\n');
};
