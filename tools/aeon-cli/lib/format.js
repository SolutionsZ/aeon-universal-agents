'use strict';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

exports.c = c;

exports.banner = () => [
  '',
  `  ${c.cyan}${c.bold}AEON CLI${c.reset}  ${c.dim}— AGENTS.md tooling${c.reset}`,
  '',
].join('\n');

exports.heading = (text) => `  ${c.white}${c.bold}── ${text} ${'─'.repeat(Math.max(0, 48 - text.length))}${c.reset}`;

exports.ok = (text) => `  ${c.green}✓${c.reset} ${text}`;
exports.warn = (text) => `  ${c.yellow}⚠${c.reset} ${text}`;
exports.err = (text) => `  ${c.red}✗${c.reset} ${text}`;
exports.info = (text) => `  ${c.blue}ℹ${c.reset} ${c.dim}${text}${c.reset}`;
exports.indent = (text) => `    ${c.dim}${text}${c.reset}`;

exports.score = (n) => {
  const color = n >= 80 ? c.green : n >= 60 ? c.yellow : c.red;
  const grade = n >= 90 ? 'A' : n >= 80 ? 'B' : n >= 70 ? 'C' : n >= 60 ? 'D' : 'F';
  return `${color}${c.bold}${n}/100${c.reset} ${c.dim}Grade: ${grade}${c.reset}`;
};

exports.stat = (label, value) => `  ${c.dim}${label}:${c.reset} ${c.white}${value}${c.reset}`;
