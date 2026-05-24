#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { scan } = require('../lib/scanner');
const { generate } = require('../lib/generator');
const { analyze, discoverFiles } = require('../lib/analyzer');
const fmt = require('../lib/format');

const VERSION = '3.0.0';

const args = process.argv.slice(2);
const command = args[0];
const flags = new Set(args.filter(a => a.startsWith('-')));
const positional = args.slice(1).filter(a => !a.startsWith('-') && args[args.indexOf(a) - 1] !== '-o');

if (flags.has('--no-color')) {
  Object.keys(fmt.c).forEach(k => { fmt.c[k] = ''; });
}

function printUsage() {
  const { c } = fmt;
  console.log(fmt.banner());
  console.log(`  ${c.white}Usage:${c.reset} aeon <command> [options]\n`);
  console.log(`  ${c.cyan}Commands${c.reset}`);
  console.log(`    init  [path]    Scan project and generate AGENTS.md`);
  console.log(`    lint  [file]    Analyze AGENTS.md quality + actionability`);
  console.log(`    scan  [path]    Discover all agent instruction files`);
  console.log('');
  console.log(`  ${c.cyan}Options${c.reset}`);
  console.log(`    --stdout        Print to stdout instead of writing file`);
  console.log(`    --json          Output as JSON (lint mode)`);
  console.log(`    --force         Overwrite existing AGENTS.md (init mode)`);
  console.log(`    --profile <p>   Use a template profile (init mode)`);
  console.log(`    --no-color      Disable colored output`);
  console.log(`    -o <file>       Output file (default: AGENTS.md)`);
  console.log(`    -v, --version   Show version`);
  console.log(`    -h, --help      Show this help`);
  console.log('');
  console.log(`  ${c.cyan}Profiles${c.reset} ${c.dim}(for init --profile)${c.reset}`);
  console.log(`    core            Lean universal rules (~250 lines)`);
  console.log(`    full            Full production doctrine (~1400 lines)`);
  console.log(`    minimal         Bare minimum instructions`);
  console.log(`    frontend        Frontend/UI-focused rules`);
  console.log(`    backend         Backend/API-focused rules`);
  console.log('');
  console.log(`  ${c.cyan}Examples${c.reset}`);
  console.log(`    ${c.dim}aeon init --stdout             Preview generated AGENTS.md${c.reset}`);
  console.log(`    ${c.dim}aeon init --profile core        Use lean core template${c.reset}`);
  console.log(`    ${c.dim}aeon init --profile full        Use full doctrine${c.reset}`);
  console.log(`    ${c.dim}aeon init --force              Generate and overwrite${c.reset}`);
  console.log(`    ${c.dim}aeon lint                      Analyze AGENTS.md in cwd${c.reset}`);
  console.log(`    ${c.dim}aeon lint --json AGENTS.md      JSON output for CI${c.reset}`);
  console.log(`    ${c.dim}aeon scan ~/my-project          Find all instruction files${c.reset}`);
  console.log('');
}

function printScanProfile(profile) {
  const { c } = fmt;

  console.log(fmt.heading('Project'));
  console.log(fmt.stat('  Name', profile.name));
  console.log(fmt.stat('  Path', profile.root));
  console.log(fmt.stat('  Runtime', profile.runtime === 'unknown' ? `${c.yellow}unknown${c.reset}` : profile.runtime));
  if (profile.stack.framework) console.log(fmt.stat('  Framework', profile.stack.framework));
  if (profile.stack.language && profile.stack.language !== profile.runtime) console.log(fmt.stat('  Language', profile.stack.language));
  if (profile.stack.orm) console.log(fmt.stat('  ORM', profile.stack.orm));
  if (profile.stack.testFramework) console.log(fmt.stat('  Tests', profile.stack.testFramework));
  if (profile.stack.linter) console.log(fmt.stat('  Linter', profile.stack.linter));
  if (profile.stack.bundler) console.log(fmt.stat('  Bundler', profile.stack.bundler));

  const scriptKeys = Object.keys(profile.scripts);
  if (scriptKeys.length > 0) {
    console.log(fmt.stat('  Scripts', scriptKeys.slice(0, 10).join(', ') + (scriptKeys.length > 10 ? ` +${scriptKeys.length - 10} more` : '')));
  }
  console.log('');

  const detections = [];
  if (profile.structure.isMVC) detections.push(`${c.green}MVC${c.reset}`);
  if (profile.isMonorepo) detections.push(`${c.magenta}Monorepo${c.reset}`);
  if (profile.structure.hasDocker) detections.push('Docker');
  if (profile.structure.hasCI) detections.push('CI/CD');
  if (profile.structure.hasSetupScript) detections.push('setup.sh');
  if (profile.configs.hasEnvExample) detections.push('.env.example');
  if (profile.configs.hasEslint) detections.push('ESLint');
  if (profile.configs.hasPrettier) detections.push('Prettier');
  if (profile.configs.hasTsconfig) detections.push('TypeScript');
  if (profile.configs.hasMakefile) detections.push('Makefile');
  if (detections.length > 0) {
    console.log(fmt.heading('Detected'));
    console.log(`  ${detections.join(`${c.dim} · ${c.reset}`)}`);
    console.log('');
  }

  if (profile.packages.length > 0) {
    console.log(fmt.heading('Packages'));
    profile.packages.forEach(p => {
      const parts = [p.runtime];
      if (p.framework) parts.push(p.framework);
      console.log(`  ${c.blue}${p.dir}/${c.reset} ${c.dim}— ${p.name} (${parts.join(', ')})${c.reset}`);
    });
    console.log('');
  }

  if (profile.structure.dirs.length > 0) {
    console.log(fmt.heading('Structure'));
    console.log(`  ${c.dim}${profile.structure.dirs.join('  ')}${c.reset}`);
    console.log('');
  }
}

const PROFILES = {
  core: 'AEON_CORE.md',
  full: 'AEON_UNIVERSAL_AGENTS.md',
  minimal: 'examples/AGENTS.minimal.md',
  frontend: 'examples/AGENTS.frontend.md',
  backend: 'examples/AGENTS.backend.md',
};

function getProfileArg() {
  const idx = args.indexOf('--profile');
  if (idx === -1) return null;
  return args[idx + 1] || null;
}

function runInit() {
  const target = positional.filter(p => p !== getProfileArg())[0] || '.';
  const root = path.resolve(target);
  const toStdout = flags.has('--stdout');
  const force = flags.has('--force');
  const outputIdx = args.indexOf('-o');
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : path.join(root, 'AGENTS.md');
  const profileName = getProfileArg();

  if (!fs.existsSync(root)) {
    console.error(fmt.err(`Directory not found: ${root}`));
    process.exit(1);
  }

  console.log(fmt.banner());

  let content;

  if (profileName) {
    const templateFile = PROFILES[profileName];
    if (!templateFile) {
      console.error(fmt.err(`Unknown profile: ${profileName}`));
      console.log(fmt.info(`Available: ${Object.keys(PROFILES).join(', ')}`));
      process.exit(1);
    }

    const aeonRoot = path.resolve(__dirname, '..', '..', '..');
    const templatePath = path.join(aeonRoot, templateFile);
    if (!fs.existsSync(templatePath)) {
      console.error(fmt.err(`Template not found: ${templateFile}`));
      process.exit(1);
    }

    content = fs.readFileSync(templatePath, 'utf8');
    const { c } = fmt;
    console.log(fmt.heading('Profile'));
    console.log(`  ${c.cyan}${profileName}${c.reset} ${c.dim}← ${templateFile}${c.reset}`);
    console.log('');
  } else {
    const profile = scan(root);
    printScanProfile(profile);
    content = generate(profile);
  }

  if (toStdout) {
    console.log(fmt.divider());
    console.log('');
    process.stdout.write(content);
  } else {
    if (fs.existsSync(outputFile) && !force) {
      console.log(fmt.warn(`${path.basename(outputFile)} already exists`));
      console.log(fmt.info('Use --force to overwrite or --stdout to preview'));
      process.exit(1);
    }
    fs.writeFileSync(outputFile, content, 'utf8');
    const { c } = fmt;
    console.log(fmt.divider());
    console.log('');
    console.log(fmt.ok(`${c.bold}Generated ${path.relative(process.cwd(), outputFile)}${c.reset}`));
    console.log(fmt.info(`${content.split('\n').length} lines — review and customize before committing`));
    console.log('');
  }
}

function generateTips(result) {
  const tips = [];
  const { c } = fmt;

  result.coverage.essential.filter(e => !e.found).forEach(e => {
    tips.push(`Add ${e.label.toLowerCase()} — this is essential for agents`);
  });

  if (result.stats.lines > 500) {
    tips.push('Split into sub-documents — agents lose context past ~500 lines');
  }

  if (result.rules.ratio < 70 && result.rules.vague > 3) {
    tips.push(`Rewrite ${result.rules.vague} vague rules with specific commands, paths, or constraints`);
  }

  if (result.stats.codeBlocks === 0 && result.stats.lines > 20) {
    tips.push('Add ```bash code blocks for commands — agents extract these reliably');
  }

  result.coverage.recommended.filter(r => !r.found).slice(0, 2).forEach(r => {
    tips.push(`Consider adding ${r.label.toLowerCase()}`);
  });

  if (result.rules.enforceable < 3 && result.rules.total > 5) {
    tips.push('Make rules more specific: reference file paths, commands, or measurable constraints');
  }

  return tips.slice(0, 5);
}

function printResult(result) {
  const { c } = fmt;

  console.log(fmt.heading('Score'));
  console.log(fmt.scoreLarge(result.score));
  console.log('');

  console.log(fmt.heading('Stats'));
  console.log(`  ${c.white}${result.stats.lines}${c.reset} lines  ${c.white}${result.stats.sections}${c.reset} sections  ${c.white}${result.stats.codeBlocks}${c.reset} code blocks`);
  console.log('');

  console.log(fmt.heading('Rule Extraction'));
  const ruleBar = fmt.bar(result.rules.ratio / 100, 20);
  console.log(`  ${ruleBar} ${c.white}${c.bold}${result.rules.ratio}%${c.reset} ${c.dim}actionable${c.reset}`);
  console.log(`  ${c.green}${result.rules.enforceable}${c.reset} enforceable  ${c.cyan}${result.rules.actionable}${c.reset} actionable  ${result.rules.vague > 0 ? c.yellow : c.green}${result.rules.vague}${c.reset} vague  ${c.dim}(${result.rules.total} total)${c.reset}`);

  if (result.rules.samples.enforceable.length > 0) {
    console.log(`\n  ${c.green}Best:${c.reset}`);
    result.rules.samples.enforceable.slice(0, 2).forEach(r => {
      console.log(`  ${c.dim}  →${c.reset} ${r.text.slice(0, 75)}${r.text.length > 75 ? '...' : ''}`);
    });
  }
  if (result.rules.samples.vague.length > 0) {
    console.log(`  ${c.yellow}Rewrite:${c.reset}`);
    result.rules.samples.vague.slice(0, 2).forEach(r => {
      console.log(`  ${c.dim}  →${c.reset} ${r.text.slice(0, 75)}${r.text.length > 75 ? '...' : ''}`);
    });
  }
  console.log('');

  console.log(fmt.heading('Coverage'));
  const allCov = [...result.coverage.essential, ...result.coverage.recommended];
  const cols = 2;
  for (let i = 0; i < allCov.length; i += cols) {
    const row = allCov.slice(i, i + cols).map(item => {
      const icon = item.found ? `${c.green}✓${c.reset}` : (result.coverage.essential.includes(item) ? `${c.red}✗${c.reset}` : `${c.yellow}–${c.reset}`);
      const label = item.label.length > 24 ? item.label.slice(0, 22) + '..' : item.label;
      return `${icon} ${label.padEnd(24)}`;
    });
    console.log(`  ${row.join('  ')}`);
  }
  console.log('');

  if (result.issues.length > 0) {
    console.log(fmt.heading('Issues'));
    const errors = result.issues.filter(i => i.severity === 'error');
    const warnings = result.issues.filter(i => i.severity === 'warning');
    const infos = result.issues.filter(i => i.severity === 'info');

    [...errors, ...warnings.slice(0, 5), ...infos.slice(0, 3)].forEach(issue => {
      const loc = issue.line ? ` ${c.dim}:${issue.line}${c.reset}` : '';
      if (issue.severity === 'error') console.log(fmt.err(`${issue.rule}${loc}`));
      else if (issue.severity === 'warning') console.log(fmt.warn(`${issue.rule}${loc}`));
      else console.log(fmt.info(`${issue.rule}${loc}`));
      console.log(fmt.indent(issue.message));
    });

    const hidden = result.issues.length - errors.length - Math.min(warnings.length, 5) - Math.min(infos.length, 3);
    if (hidden > 0) console.log(fmt.info(`+${hidden} more (use --json for full list)`));
    console.log('');
  }

  const tips = generateTips(result);
  if (tips.length > 0) {
    console.log(fmt.heading('How to improve'));
    tips.forEach(tip => console.log(fmt.bullet(tip)));
    console.log('');
  }

  const errCount = result.issues.filter(i => i.severity === 'error').length;
  const warnCount = result.issues.filter(i => i.severity === 'warning').length;
  console.log(fmt.divider());
  console.log(`  ${errCount ? c.red : c.green}${errCount} errors${c.reset}  ${warnCount ? c.yellow : c.green}${warnCount} warnings${c.reset}  ${c.dim}${result.issues.filter(i => i.severity === 'info').length} info${c.reset}`);
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
    const { c } = fmt;
    console.log(fmt.banner());
    console.log(fmt.err('No AGENTS.md found'));
    console.log('');
    console.log(`  ${c.dim}Looked for: AGENTS.md, CLAUDE.md, .cursorrules${c.reset}`);
    console.log('');
    console.log(`  ${c.white}Options:${c.reset}`);
    console.log(`    aeon lint <file>    Analyze a specific file`);
    console.log(`    aeon init           Generate one for this project`);
    console.log('');
    process.exit(1);
  }

  const repoRoot = findRepoRoot(filePath);
  const result = analyze(filePath, { repoRoot });

  if (toJson) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return;
  }

  console.log(fmt.banner());
  console.log(`  ${fmt.c.dim}Analyzing ${path.relative(process.cwd(), result.file)}${fmt.c.reset}`);
  console.log('');
  printResult(result);

  const errors = result.issues.filter(i => i.severity === 'error').length;
  if (errors > 0) process.exit(1);
}

function runScan() {
  const target = positional[0] || '.';
  const dir = path.resolve(target);
  const { c } = fmt;

  console.log(fmt.banner());

  const files = discoverFiles(dir);
  if (files.length === 0) {
    console.log(fmt.heading('No instruction files found'));
    console.log('');
    console.log(`  ${c.dim}Looked for: AGENTS.md, CLAUDE.md, .cursorrules,${c.reset}`);
    console.log(`  ${c.dim}copilot-instructions.md, .cursor/rules/${c.reset}`);
    console.log('');
    console.log(`  ${c.white}Run ${c.cyan}aeon init${c.white} to generate one.${c.reset}`);
    console.log('');
    return;
  }

  console.log(fmt.heading(`Found ${files.length} instruction file(s)`));
  console.log('');

  files.forEach(f => {
    try {
      const result = analyze(f, { repoRoot: dir });
      const scoreColor = result.score >= 80 ? c.green : result.score >= 60 ? c.yellow : c.red;
      const bar = fmt.bar(result.score / 100, 15);
      console.log(`  ${bar} ${scoreColor}${c.bold}${String(result.score).padStart(3)}${c.reset} ${path.relative(dir, f)}`);
      console.log(`  ${c.dim}${' '.repeat(15)}     ${result.rules.total} rules · ${result.rules.ratio}% actionable · ${result.stats.lines} lines${c.reset}`);
    } catch {
      console.log(fmt.warn(`Could not analyze ${path.relative(dir, f)}`));
    }
  });

  console.log('');
}

function runDefault() {
  const { c } = fmt;
  const cwd = process.cwd();

  console.log(fmt.banner());

  const files = discoverFiles(cwd);
  if (files.length > 0) {
    console.log(fmt.heading('Quick Report'));
    console.log('');

    files.forEach(f => {
      try {
        const result = analyze(f, { repoRoot: cwd });
        const bar = fmt.bar(result.score / 100, 20);
        const scoreColor = result.score >= 80 ? c.green : result.score >= 60 ? c.yellow : c.red;
        console.log(`  ${bar} ${scoreColor}${c.bold}${result.score}${c.reset}${c.dim}/100${c.reset} ${path.basename(f)}`);
        console.log(`  ${c.dim}${result.rules.total} rules · ${result.rules.ratio}% actionable · ${result.stats.lines} lines${c.reset}`);
        console.log('');
      } catch { /* skip */ }
    });

    console.log(`  ${c.dim}Run ${c.reset}${c.cyan}aeon lint${c.reset}${c.dim} for full analysis${c.reset}`);
  } else {
    const profile = scan(cwd);
    console.log(fmt.heading('No AGENTS.md found'));
    console.log('');
    console.log(`  ${c.dim}Detected:${c.reset} ${profile.runtime}${profile.stack.framework ? ' + ' + profile.stack.framework : ''}${profile.stack.orm ? ' + ' + profile.stack.orm : ''}`);
    console.log(`  ${c.dim}Dirs:${c.reset}     ${profile.structure.dirs.slice(0, 8).join(', ')}`);
    if (profile.packages.length > 0) {
      console.log(`  ${c.dim}Packages:${c.reset} ${profile.packages.map(p => p.dir).join(', ')}`);
    }
    console.log('');
    console.log(`  ${c.white}Run ${c.cyan}aeon init${c.white} to generate AGENTS.md for this project${c.reset}`);
    console.log(`  ${c.white}Run ${c.cyan}aeon init --stdout${c.white} to preview first${c.reset}`);
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
} else if (command === '-h' || command === '--help') {
  printUsage();
} else if (command === 'init') {
  runInit();
} else if (command === 'lint') {
  runLint();
} else if (command === 'scan') {
  runScan();
} else if (!command || command.startsWith('-')) {
  if (process.stdin.isTTY) {
    const { run } = require('../lib/menu');
    run().catch(() => process.exit(0));
  } else {
    runDefault();
  }
} else {
  console.error(fmt.err(`Unknown command: ${command}`));
  printUsage();
  process.exit(1);
}
