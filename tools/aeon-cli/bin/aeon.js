#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { scan } = require('../lib/scanner');
const { generate } = require('../lib/generator');
const { analyze, discoverFiles } = require('../lib/analyzer');
const fmt = require('../lib/format');

const VERSION = '2.0.0';

const args = process.argv.slice(2);
const command = args[0];
const flags = new Set(args.filter(a => a.startsWith('-')));
const positional = args.slice(1).filter(a => !a.startsWith('-') && args[args.indexOf(a) - 1] !== '-o');

if (flags.has('--no-color')) {
  Object.keys(fmt.c).forEach(k => { fmt.c[k] = ''; });
}

function printUsage() {
  console.log(fmt.banner());
  console.log('  Usage: aeon <command> [options]\n');
  console.log('  Commands:');
  console.log('    init [path]     Scan codebase and generate AGENTS.md');
  console.log('    lint [file]     Analyze AGENTS.md quality');
  console.log('    scan [path]     Discover all agent instruction files\n');
  console.log('  Options:');
  console.log('    --stdout        Print to stdout instead of writing file');
  console.log('    --json          Output as JSON (lint mode)');
  console.log('    --force         Overwrite existing AGENTS.md (init mode)');
  console.log('    --no-color      Disable colored output');
  console.log('    -o <file>       Output file (default: AGENTS.md)');
  console.log('    -v, --version   Show version');
  console.log('    -h, --help      Show this help\n');
}

function runInit() {
  const target = positional[0] || '.';
  const root = path.resolve(target);
  const toStdout = flags.has('--stdout');
  const force = flags.has('--force');
  const outputIdx = args.indexOf('-o');
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : path.join(root, 'AGENTS.md');

  if (!fs.existsSync(root)) {
    console.error(fmt.err(`Directory not found: ${root}`));
    process.exit(1);
  }

  console.log(fmt.banner());

  const profile = scan(root);
  const { c } = fmt;

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

  const detections = [];
  if (profile.structure.isMVC) detections.push('MVC structure');
  if (profile.structure.hasDocker) detections.push('Docker');
  if (profile.structure.hasCI) detections.push('CI/CD');
  if (profile.configs.hasEnvExample) detections.push('.env.example');
  if (profile.configs.hasEslint) detections.push('ESLint');
  if (profile.configs.hasPrettier) detections.push('Prettier');
  if (profile.configs.hasTsconfig) detections.push('TypeScript');
  if (detections.length > 0) console.log(fmt.ok(detections.join(' · ')));
  console.log('');

  const content = generate(profile);

  if (toStdout) {
    process.stdout.write(content);
  } else {
    if (fs.existsSync(outputFile) && !force) {
      console.log(fmt.warn(`${path.basename(outputFile)} already exists — use --force to overwrite or --stdout to preview`));
      process.exit(1);
    }
    fs.writeFileSync(outputFile, content, 'utf8');
    console.log(fmt.ok(`Generated ${path.relative(process.cwd(), outputFile)}`));
    console.log(fmt.info(`${content.split('\n').length} lines — review and customize before committing`));
  }
  console.log('');
}

function printResult(result) {
  const { c } = fmt;

  console.log(fmt.heading('Stats'));
  console.log(fmt.stat('File', path.relative(process.cwd(), result.file)));
  console.log(fmt.stat('Lines', result.stats.lines));
  console.log(fmt.stat('Sections', result.stats.sections));
  console.log(fmt.stat('Code blocks', result.stats.codeBlocks));
  console.log('');

  console.log(fmt.heading('Rule Extraction'));
  const ruleColor = result.rules.ratio >= 70 ? c.green : result.rules.ratio >= 40 ? c.yellow : c.red;
  console.log(fmt.stat('Total rules found', result.rules.total));
  console.log(fmt.stat('Enforceable', `${c.green}${result.rules.enforceable}${c.reset} ${c.dim}(specific command, path, or measurable constraint)${c.reset}`));
  console.log(fmt.stat('Actionable', `${c.cyan}${result.rules.actionable}${c.reset} ${c.dim}(clear intent, some specificity)${c.reset}`));
  console.log(fmt.stat('Vague', `${result.rules.vague > 0 ? c.yellow : c.green}${result.rules.vague}${c.reset} ${c.dim}(too general for agents to follow reliably)${c.reset}`));
  console.log(fmt.stat('Actionability', `${ruleColor}${c.bold}${result.rules.ratio}%${c.reset}`));

  if (result.rules.samples.enforceable.length > 0) {
    console.log('');
    console.log(`  ${c.green}Best rules:${c.reset}`);
    result.rules.samples.enforceable.forEach(r => {
      console.log(`    ${c.dim}→${c.reset} ${r.text.slice(0, 80)}${r.text.length > 80 ? '...' : ''}`);
    });
  }
  if (result.rules.samples.vague.length > 0) {
    console.log(`  ${c.yellow}Vague rules (rewrite these):${c.reset}`);
    result.rules.samples.vague.forEach(r => {
      console.log(`    ${c.dim}→${c.reset} ${r.text.slice(0, 80)}${r.text.length > 80 ? '...' : ''}`);
    });
  }
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

  console.log(fmt.heading('Score'));
  console.log(`  ${fmt.score(result.score)}`);
  console.log(`  ${errors ? c.red : c.green}${errors} errors${c.reset}  ${warnings ? c.yellow : c.green}${warnings} warnings${c.reset}  ${c.blue}${infos} info${c.reset}`);
  console.log('');
}

function runLint() {
  const target = positional[0] || null;
  const toJson = flags.has('--json');

  let filePath;
  if (target) {
    filePath = path.resolve(target);
  } else {
    const cwd = process.cwd();
    filePath = ['AGENTS.md', 'CLAUDE.md', '.cursorrules'].map(f => path.join(cwd, f)).find(f => fs.existsSync(f)) || null;
  }

  if (!filePath || !fs.existsSync(filePath)) {
    console.error(fmt.err('No AGENTS.md or CLAUDE.md found. Specify a file: aeon lint <file>'));
    process.exit(1);
  }

  const repoRoot = findRepoRoot(filePath);
  const result = analyze(filePath, { repoRoot });

  if (toJson) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return;
  }

  console.log(fmt.banner());
  printResult(result);

  const errors = result.issues.filter(i => i.severity === 'error').length;
  if (errors > 0) process.exit(1);
}

function runScan() {
  const target = positional[0] || '.';
  const dir = path.resolve(target);

  console.log(fmt.banner());
  console.log(fmt.heading('Agent Instruction Files'));

  const files = discoverFiles(dir);
  if (files.length === 0) {
    console.log(fmt.warn('No agent instruction files found.'));
    console.log(fmt.info('Run `aeon init` to generate one.'));
    console.log('');
    return;
  }

  files.forEach(f => console.log(fmt.ok(path.relative(dir, f))));
  console.log('');
  console.log(fmt.info(`${files.length} file(s) found. Run \`aeon lint <file>\` to analyze.`));

  if (files.length > 1) {
    console.log('');
    console.log(fmt.heading('Quick Analysis'));
    let totalScore = 0;
    files.forEach(f => {
      try {
        const result = analyze(f, { repoRoot: dir });
        totalScore += result.score;
        const { c } = fmt;
        const scoreColor = result.score >= 80 ? c.green : result.score >= 60 ? c.yellow : c.red;
        console.log(`  ${scoreColor}${result.score}${c.reset} ${path.relative(dir, f)} ${c.dim}(${result.rules.total} rules, ${result.rules.ratio}% actionable)${c.reset}`);
      } catch {
        console.log(fmt.warn(`Could not analyze ${path.relative(dir, f)}`));
      }
    });
    const avg = Math.round(totalScore / files.length);
    console.log('');
    console.log(fmt.stat('Average score', fmt.score(avg)));
  }

  console.log('');
}

function findRepoRoot(filePath) {
  let dir = path.dirname(path.resolve(filePath));
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, '.git')) || fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.dirname(path.resolve(filePath));
}

if (flags.has('-v') || flags.has('--version')) {
  console.log(`aeon-cli ${VERSION}`);
} else if (!command || command === '-h' || command === '--help') {
  printUsage();
} else if (command === 'init') {
  runInit();
} else if (command === 'lint') {
  runLint();
} else if (command === 'scan') {
  runScan();
} else {
  console.error(fmt.err(`Unknown command: ${command}`));
  printUsage();
  process.exit(1);
}
