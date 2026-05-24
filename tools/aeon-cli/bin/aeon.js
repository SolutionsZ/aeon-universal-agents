#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { scan } = require('../lib/scanner');
const { generate } = require('../lib/generator');
const { analyze } = require('../lib/analyzer');
const fmt = require('../lib/format');

const args = process.argv.slice(2);
const command = args[0];

function printUsage() {
  console.log(fmt.banner());
  console.log('  Usage: aeon <command> [options]\n');
  console.log('  Commands:');
  console.log('    init [path]     Scan codebase and generate AGENTS.md');
  console.log('    lint [file]     Analyze AGENTS.md quality\n');
  console.log('  Options:');
  console.log('    --stdout        Print to stdout instead of writing file');
  console.log('    --json          Output as JSON (lint mode)');
  console.log('    -o <file>       Output file (default: AGENTS.md)');
  console.log('    -h, --help      Show this help\n');
}

function runInit() {
  const positional = args.slice(1).filter(a => !a.startsWith('-') && args[args.indexOf(a) - 1] !== '-o');
  const target = positional[0] || '.';
  const root = path.resolve(target);
  const toStdout = args.includes('--stdout');
  const outputIdx = args.indexOf('-o');
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : path.join(root, 'AGENTS.md');

  if (!fs.existsSync(root)) {
    console.error(fmt.err(`Directory not found: ${root}`));
    process.exit(1);
  }

  console.log(fmt.banner());

  const profile = scan(root);

  console.log(fmt.heading('Project Scan'));
  console.log(fmt.stat('Name', profile.name));
  console.log(fmt.stat('Runtime', profile.runtime));
  if (profile.stack.framework) console.log(fmt.stat('Framework', profile.stack.framework));
  if (profile.stack.language) console.log(fmt.stat('Language', profile.stack.language));
  if (profile.stack.orm) console.log(fmt.stat('ORM', profile.stack.orm));
  if (profile.stack.testFramework) console.log(fmt.stat('Tests', profile.stack.testFramework));
  if (profile.stack.linter) console.log(fmt.stat('Linter', profile.stack.linter));
  console.log(fmt.stat('Scripts', Object.keys(profile.scripts).length > 0 ? Object.keys(profile.scripts).join(', ') : 'none'));
  console.log(fmt.stat('Dirs', profile.structure.dirs.join(', ') || 'none'));
  if (profile.structure.isMVC) console.log(fmt.ok('MVC structure detected'));
  if (profile.configs.hasDocker) console.log(fmt.ok('Docker detected'));
  if (profile.configs.hasCI) console.log(fmt.ok('CI/CD detected'));
  console.log('');

  const content = generate(profile);

  if (toStdout) {
    process.stdout.write(content);
  } else {
    if (fs.existsSync(outputFile)) {
      console.log(fmt.warn(`${path.basename(outputFile)} already exists — use --stdout to preview or -o <file> for different path`));
      process.exit(1);
    }
    fs.writeFileSync(outputFile, content, 'utf8');
    console.log(fmt.ok(`Generated ${path.relative(process.cwd(), outputFile)}`));
    console.log(fmt.info(`${content.split('\n').length} lines — review and customize before committing`));
  }
  console.log('');
}

function runLint() {
  const positionalLint = args.slice(1).filter(a => !a.startsWith('-'));
  const target = positionalLint[0] || null;
  const toJson = args.includes('--json');

  const filePath = target
    ? path.resolve(target)
    : fs.existsSync('AGENTS.md') ? path.resolve('AGENTS.md')
    : fs.existsSync('CLAUDE.md') ? path.resolve('CLAUDE.md')
    : null;

  if (!filePath || !fs.existsSync(filePath)) {
    console.error(fmt.err('No AGENTS.md or CLAUDE.md found. Specify a file: aeon lint <file>'));
    process.exit(1);
  }

  const result = analyze(filePath);

  if (toJson) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return;
  }

  const { c } = fmt;

  console.log(fmt.banner());
  console.log(fmt.heading('Analysis'));
  console.log(fmt.stat('File', path.relative(process.cwd(), result.file)));
  console.log(fmt.stat('Lines', result.stats.lines));
  console.log(fmt.stat('Sections', result.stats.sections));
  console.log(fmt.stat('Code blocks', result.stats.codeBlocks));
  console.log(fmt.stat('Bullet rules', result.stats.bulletRules));
  console.log('');
  console.log(`  Score: ${fmt.score(result.score)}`);
  console.log('');

  console.log(fmt.heading('Essential Coverage'));
  result.coverage.essential.forEach(item => {
    console.log(item.found ? fmt.ok(item.label) : fmt.err(item.label + ' — MISSING'));
  });
  console.log('');

  console.log(fmt.heading('Recommended Coverage'));
  result.coverage.recommended.forEach(item => {
    console.log(item.found ? fmt.ok(item.label) : fmt.warn(item.label + ' — not found'));
  });
  console.log('');

  if (result.issues.length > 0) {
    console.log(fmt.heading('Issues'));
    result.issues.forEach(issue => {
      const loc = issue.line ? ` ${c.dim}(line ${issue.line})${c.reset}` : '';
      if (issue.severity === 'error') console.log(fmt.err(`${issue.rule}${loc}`));
      else if (issue.severity === 'warning') console.log(fmt.warn(`${issue.rule}${loc}`));
      else console.log(fmt.info(`${issue.rule}${loc}`));
      console.log(fmt.indent(issue.message));
    });
    console.log('');
  }

  const errors = result.issues.filter(i => i.severity === 'error').length;
  const warnings = result.issues.filter(i => i.severity === 'warning').length;
  const infos = result.issues.filter(i => i.severity === 'info').length;

  console.log(fmt.heading('Summary'));
  console.log(`  ${errors ? c.red : c.green}${errors} errors${c.reset}  ${warnings ? c.yellow : c.green}${warnings} warnings${c.reset}  ${c.blue}${infos} info${c.reset}`);
  console.log('');

  if (errors > 0) process.exit(1);
}

if (!command || command === '-h' || command === '--help') {
  printUsage();
} else if (command === 'init') {
  runInit();
} else if (command === 'lint') {
  runLint();
} else {
  console.error(fmt.err(`Unknown command: ${command}`));
  printUsage();
  process.exit(1);
}
