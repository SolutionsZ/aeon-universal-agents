'use strict';

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const fmt = require('./format');
const { scan } = require('./scanner');
const { generate } = require('./generator');
const { analyze, discoverFiles } = require('./analyzer');

const { c } = fmt;

function createRL() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(rl, prompt) {
  return new Promise(resolve => rl.question(prompt, answer => resolve(answer.trim())));
}

function clear() {
  process.stdout.write('\x1b[2J\x1b[H');
}

function findRepoRoot(from) {
  let dir = path.resolve(from);
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, '.git')) || fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(from);
}

function printMenu() {
  console.log(fmt.banner());
  console.log(`  ${c.white}What do you want to do?${c.reset}`);
  console.log('');
  console.log(`  ${c.cyan}${c.bold}1${c.reset}  Analyze AGENTS.md       ${c.dim}Check quality, rules, and score${c.reset}`);
  console.log(`  ${c.cyan}${c.bold}2${c.reset}  Generate AGENTS.md      ${c.dim}Scan project and create one${c.reset}`);
  console.log(`  ${c.cyan}${c.bold}3${c.reset}  Discover files          ${c.dim}Find all instruction files${c.reset}`);
  console.log(`  ${c.cyan}${c.bold}4${c.reset}  Help                    ${c.dim}Show commands and options${c.reset}`);
  console.log('');
  console.log(`  ${c.dim}q  Exit${c.reset}`);
  console.log('');
}

async function runAnalyzeFlow(rl) {
  const cwd = process.cwd();
  const candidates = ['AGENTS.md', 'CLAUDE.md', '.cursorrules']
    .map(f => path.join(cwd, f))
    .filter(f => fs.existsSync(f));

  let filePath;

  if (candidates.length === 0) {
    console.log('');
    console.log(fmt.warn('No AGENTS.md found in current directory.'));
    console.log('');
    const input = await ask(rl, `  ${c.dim}Enter path to file (or press Enter to go back):${c.reset} `);
    if (!input) return;
    filePath = path.resolve(input);
    if (!fs.existsSync(filePath)) {
      console.log(fmt.err(`File not found: ${filePath}`));
      return;
    }
  } else if (candidates.length === 1) {
    filePath = candidates[0];
  } else {
    console.log('');
    console.log(`  ${c.white}Found multiple files:${c.reset}`);
    candidates.forEach((f, i) => {
      console.log(`  ${c.cyan}${c.bold}${i + 1}${c.reset}  ${path.basename(f)}`);
    });
    console.log('');
    const choice = await ask(rl, `  ${c.dim}Pick one (1-${candidates.length}):${c.reset} `);
    const idx = parseInt(choice, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= candidates.length) return;
    filePath = candidates[idx];
  }

  console.log('');
  const repoRoot = findRepoRoot(cwd);
  const result = analyze(filePath, { repoRoot });

  printLintResult(result);
}

function printLintResult(result) {
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
      console.log(`  ${c.dim}  >${c.reset} ${r.text.slice(0, 75)}${r.text.length > 75 ? '...' : ''}`);
    });
  }
  if (result.rules.samples.vague.length > 0) {
    console.log(`  ${c.yellow}Rewrite:${c.reset}`);
    result.rules.samples.vague.slice(0, 2).forEach(r => {
      console.log(`  ${c.dim}  >${c.reset} ${r.text.slice(0, 75)}${r.text.length > 75 ? '...' : ''}`);
    });
  }
  console.log('');

  console.log(fmt.heading('Coverage'));
  const allCov = [...result.coverage.essential, ...result.coverage.recommended];
  for (let i = 0; i < allCov.length; i += 2) {
    const row = allCov.slice(i, i + 2).map(item => {
      const icon = item.found ? `${c.green}✓${c.reset}` : (result.coverage.essential.includes(item) ? `${c.red}✗${c.reset}` : `${c.yellow}–${c.reset}`);
      const label = item.label.length > 24 ? item.label.slice(0, 22) + '..' : item.label;
      return `${icon} ${label.padEnd(24)}`;
    });
    console.log(`  ${row.join('  ')}`);
  }
  console.log('');

  if (result.issues.length > 0) {
    console.log(fmt.heading('Issues'));
    result.issues.slice(0, 6).forEach(issue => {
      const loc = issue.line ? ` ${c.dim}:${issue.line}${c.reset}` : '';
      if (issue.severity === 'error') console.log(fmt.err(`${issue.rule}${loc}`));
      else if (issue.severity === 'warning') console.log(fmt.warn(`${issue.rule}${loc}`));
      else console.log(fmt.info(`${issue.rule}${loc}`));
      console.log(fmt.indent(issue.message));
    });
    if (result.issues.length > 6) console.log(fmt.info(`+${result.issues.length - 6} more`));
    console.log('');
  }

  const tips = generateTips(result);
  if (tips.length > 0) {
    console.log(fmt.heading('How to improve'));
    tips.forEach(tip => console.log(fmt.bullet(tip)));
    console.log('');
  }
}

function generateTips(result) {
  const tips = [];
  result.coverage.essential.filter(e => !e.found).forEach(e => {
    tips.push(`Add ${e.label.toLowerCase()}`);
  });
  if (result.stats.lines > 500) tips.push('Split into sub-documents — agents lose context past ~500 lines');
  if (result.rules.ratio < 70 && result.rules.vague > 3) tips.push(`Rewrite ${result.rules.vague} vague rules with specific constraints`);
  if (result.stats.codeBlocks === 0 && result.stats.lines > 20) tips.push('Add ```bash code blocks for commands');
  result.coverage.recommended.filter(r => !r.found).slice(0, 2).forEach(r => {
    tips.push(`Consider adding ${r.label.toLowerCase()}`);
  });
  return tips.slice(0, 5);
}

async function runGenerateFlow(rl) {
  const cwd = process.cwd();

  console.log('');
  const input = await ask(rl, `  ${c.dim}Project path (Enter for current directory):${c.reset} `);
  const root = path.resolve(input || cwd);

  if (!fs.existsSync(root)) {
    console.log(fmt.err(`Directory not found: ${root}`));
    return;
  }

  console.log('');
  const profile = scan(root);

  console.log(fmt.heading('Project'));
  console.log(fmt.stat('  Name', profile.name));
  console.log(fmt.stat('  Runtime', profile.runtime));
  if (profile.stack.framework) console.log(fmt.stat('  Framework', profile.stack.framework));
  if (profile.stack.orm) console.log(fmt.stat('  ORM', profile.stack.orm));
  if (profile.isMonorepo) console.log(fmt.stat('  Type', `${c.magenta}Monorepo${c.reset}`));
  if (profile.packages.length > 0) {
    console.log(fmt.stat('  Packages', profile.packages.map(p => p.dir).join(', ')));
  }
  console.log(fmt.stat('  Dirs', profile.structure.dirs.slice(0, 8).join(', ')));
  console.log('');

  const content = generate(profile);

  console.log(`  ${c.dim}Generated ${content.split('\n').length} lines${c.reset}`);
  console.log('');

  const action = await ask(rl, `  ${c.cyan}${c.bold}1${c.reset} Write to file  ${c.cyan}${c.bold}2${c.reset} Preview  ${c.cyan}${c.bold}3${c.reset} Cancel\n\n  ${c.dim}Choice:${c.reset} `);

  if (action === '1') {
    const outputFile = path.join(root, 'AGENTS.md');
    if (fs.existsSync(outputFile)) {
      const confirm = await ask(rl, `\n  ${c.yellow}AGENTS.md already exists. Overwrite? (y/n):${c.reset} `);
      if (confirm.toLowerCase() !== 'y') {
        console.log(fmt.info('Cancelled.'));
        return;
      }
    }
    fs.writeFileSync(outputFile, content, 'utf8');
    console.log('');
    console.log(fmt.ok(`Written to ${path.relative(cwd, outputFile)}`));
    console.log(fmt.info('Review and customize before committing'));
  } else if (action === '2') {
    console.log('');
    console.log(fmt.divider());
    console.log('');
    console.log(content);
  } else {
    console.log(fmt.info('Cancelled.'));
  }
}

async function runDiscoverFlow() {
  const cwd = process.cwd();
  const files = discoverFiles(cwd);

  console.log('');
  if (files.length === 0) {
    console.log(fmt.warn('No instruction files found in current directory.'));
    console.log(fmt.info('Run Generate to create one.'));
    return;
  }

  console.log(fmt.heading(`Found ${files.length} file(s)`));
  console.log('');

  files.forEach(f => {
    try {
      const result = analyze(f, { repoRoot: cwd });
      const bar = fmt.bar(result.score / 100, 15);
      const scoreColor = result.score >= 80 ? c.green : result.score >= 60 ? c.yellow : c.red;
      console.log(`  ${bar} ${scoreColor}${c.bold}${String(result.score).padStart(3)}${c.reset} ${path.relative(cwd, f)}`);
      console.log(`  ${c.dim}${' '.repeat(15)}     ${result.rules.total} rules · ${result.rules.ratio}% actionable · ${result.stats.lines} lines${c.reset}`);
    } catch {
      console.log(fmt.warn(`Could not analyze ${path.relative(cwd, f)}`));
    }
  });
}

function printHelp() {
  console.log('');
  console.log(`  ${c.cyan}CLI Commands${c.reset} ${c.dim}(for scripts and CI)${c.reset}`);
  console.log('');
  console.log(`  ${c.white}aeon init [path]${c.reset}     ${c.dim}Generate AGENTS.md${c.reset}`);
  console.log(`  ${c.white}aeon lint [file]${c.reset}     ${c.dim}Analyze quality${c.reset}`);
  console.log(`  ${c.white}aeon scan [path]${c.reset}     ${c.dim}Find instruction files${c.reset}`);
  console.log('');
  console.log(`  ${c.cyan}Flags${c.reset}`);
  console.log('');
  console.log(`  ${c.white}--stdout${c.reset}   Print to stdout      ${c.white}--json${c.reset}     JSON output`);
  console.log(`  ${c.white}--force${c.reset}    Overwrite file       ${c.white}--no-color${c.reset} Plain text`);
  console.log(`  ${c.white}-o <file>${c.reset}  Custom output        ${c.white}-v${c.reset}         Version`);
  console.log('');
  console.log(`  ${c.cyan}Examples${c.reset}`);
  console.log('');
  console.log(`  ${c.dim}aeon init --stdout             Preview before writing${c.reset}`);
  console.log(`  ${c.dim}aeon lint --json AGENTS.md      CI pipeline check${c.reset}`);
  console.log(`  ${c.dim}aeon init ~/my-project --force  Generate for other project${c.reset}`);
}

async function run() {
  const rl = createRL();

  const loop = async () => {
    clear();
    printMenu();

    const choice = await ask(rl, `  ${c.dim}>${c.reset} `);

    switch (choice) {
      case '1':
        clear();
        console.log(fmt.banner());
        console.log(fmt.heading('Analyze AGENTS.md'));
        await runAnalyzeFlow(rl);
        console.log('');
        await ask(rl, `  ${c.dim}Press Enter to continue...${c.reset}`);
        break;
      case '2':
        clear();
        console.log(fmt.banner());
        console.log(fmt.heading('Generate AGENTS.md'));
        await runGenerateFlow(rl);
        console.log('');
        await ask(rl, `  ${c.dim}Press Enter to continue...${c.reset}`);
        break;
      case '3':
        clear();
        console.log(fmt.banner());
        console.log(fmt.heading('Discover Instruction Files'));
        await runDiscoverFlow();
        console.log('');
        await ask(rl, `  ${c.dim}Press Enter to continue...${c.reset}`);
        break;
      case '4':
        clear();
        console.log(fmt.banner());
        printHelp();
        console.log('');
        await ask(rl, `  ${c.dim}Press Enter to continue...${c.reset}`);
        break;
      case 'q':
      case 'Q':
      case '':
        rl.close();
        return;
      default:
        break;
    }

    await loop();
  };

  await loop();
}

exports.run = run;
