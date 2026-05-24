'use strict';

const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', '.nuxt', 'dist', 'build', 'out',
  'coverage', '__pycache__', '.venv', 'venv', 'vendor', 'target',
  '.cache', '.turbo', '.vercel', '.svelte-kit', 'bower_components',
]);

const RUNTIME_FILES = [
  ['package.json', 'node'],
  ['pyproject.toml', 'python'], ['requirements.txt', 'python'], ['setup.py', 'python'],
  ['go.mod', 'go'],
  ['Cargo.toml', 'rust'],
  ['Gemfile', 'ruby'],
  ['composer.json', 'php'],
  ['pom.xml', 'java'], ['build.gradle', 'java'],
  ['mix.exs', 'elixir'],
];

function fileExists(root, ...parts) {
  return fs.existsSync(path.join(root, ...parts));
}

function readJSON(root, ...parts) {
  try { return JSON.parse(fs.readFileSync(path.join(root, ...parts), 'utf8')); }
  catch { return null; }
}

function readText(root, ...parts) {
  try { return fs.readFileSync(path.join(root, ...parts), 'utf8'); }
  catch { return null; }
}

function listDir(dir) {
  try { return fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return []; }
}

function getTopDirs(root) {
  return listDir(root)
    .filter(d => d.isDirectory() && !d.name.startsWith('.') && !IGNORE_DIRS.has(d.name))
    .map(d => d.name);
}

function detectRuntime(root) {
  for (const [file, runtime] of RUNTIME_FILES) {
    if (fileExists(root, file)) return runtime;
  }
  return 'unknown';
}

function detectNodeStack(pkg) {
  const all = { ...pkg.dependencies, ...pkg.devDependencies };
  const has = (name) => name in all;

  const stack = { framework: null, language: 'javascript', css: null, orm: null, testFramework: null, linter: null, bundler: null };

  if (has('typescript') || has('ts-node')) stack.language = 'typescript';

  const frameworks = [
    ['next', 'next'], ['nuxt', 'nuxt'], ['express', 'express'], ['fastify', 'fastify'],
    ['hono', 'hono'], ['koa', 'koa'], ['react', 'react'], ['vue', 'vue'],
    ['svelte', 'svelte'], ['@angular/core', 'angular'], ['angular', 'angular'],
    ['ionic', 'ionic'], ['electron', 'electron'],
  ];
  for (const [dep, name] of frameworks) { if (has(dep)) { stack.framework = name; break; } }

  if (has('tailwindcss')) stack.css = 'tailwind';
  else if (has('sass') || has('node-sass')) stack.css = 'sass';
  else if (has('styled-components')) stack.css = 'styled-components';

  const orms = [
    ['sequelize', 'sequelize'], ['@prisma/client', 'prisma'], ['prisma', 'prisma'],
    ['typeorm', 'typeorm'], ['drizzle-orm', 'drizzle'], ['mongoose', 'mongoose'], ['knex', 'knex'],
  ];
  for (const [dep, name] of orms) { if (has(dep)) { stack.orm = name; break; } }

  const tests = [
    ['jest', 'jest'], ['vitest', 'vitest'], ['mocha', 'mocha'], ['ava', 'ava'], ['tap', 'tap'],
  ];
  for (const [dep, name] of tests) { if (has(dep)) { stack.testFramework = name; break; } }

  if (has('eslint')) stack.linter = 'eslint';
  else if (has('@biomejs/biome') || has('biome')) stack.linter = 'biome';

  const bundlers = [['vite', 'vite'], ['webpack', 'webpack'], ['esbuild', 'esbuild'], ['rollup', 'rollup'], ['gulp', 'gulp']];
  for (const [dep, name] of bundlers) { if (has(dep)) { stack.bundler = name; break; } }

  return stack;
}

function detectPythonStack(root) {
  const stack = { framework: null, language: 'python', testFramework: null, linter: null, orm: null };
  const all = (readText(root, 'requirements.txt') || '') + '\n' + (readText(root, 'pyproject.toml') || '');

  const match = (pat) => pat.test(all);
  if (match(/\bdjango\b/i)) stack.framework = 'django';
  else if (match(/\bflask\b/i)) stack.framework = 'flask';
  else if (match(/\bfastapi\b/i)) stack.framework = 'fastapi';

  if (match(/\bpytest\b/i)) stack.testFramework = 'pytest';
  if (match(/\bruff\b/i)) stack.linter = 'ruff';
  else if (match(/\bflake8\b/i)) stack.linter = 'flake8';
  else if (match(/\bmypy\b/i)) stack.linter = 'mypy';

  if (match(/\bsqlalchemy\b/i)) stack.orm = 'sqlalchemy';
  else if (match(/\bdjango\b/i)) stack.orm = 'django-orm';
  return stack;
}

function detectGoStack(root) {
  const stack = { framework: null, language: 'go', testFramework: 'go-test' };
  const gomod = readText(root, 'go.mod') || '';
  if (/gin-gonic\/gin/.test(gomod)) stack.framework = 'gin';
  else if (/labstack\/echo/.test(gomod)) stack.framework = 'echo';
  else if (/gofiber\/fiber/.test(gomod)) stack.framework = 'fiber';
  return stack;
}

function detectRustStack(root) {
  const stack = { framework: null, language: 'rust', testFramework: 'cargo-test' };
  const cargo = readText(root, 'Cargo.toml') || '';
  if (/actix-web/.test(cargo)) stack.framework = 'actix';
  else if (/\baxum\b/.test(cargo)) stack.framework = 'axum';
  else if (/\brocket\b/.test(cargo)) stack.framework = 'rocket';
  return stack;
}

function detectStructure(root) {
  const dirs = getTopDirs(root);
  const check = (patterns) => dirs.some(d => patterns.some(p => p instanceof RegExp ? p.test(d) : d === p));

  const result = {
    dirs,
    hasModels: check([/^models?$/i]),
    hasControllers: check([/^controllers?$/i]),
    hasViews: check([/^views?$/i]),
    hasRoutes: check([/^routes?$/i, /^endpoints?$/i]),
    hasServices: check([/^services?$/i]),
    hasMiddleware: check([/^middleware$/i]),
    hasSrc: check(['src']),
    hasLib: check(['lib']),
    hasTests: check([/^(tests?|__tests__|spec|e2e-tests?|unit-tests?)$/i]),
    hasPublic: check([/^(public|static|assets|www)$/i]),
    hasConfig: check([/^config$/i]),
    hasDocs: check([/^(docs|documentation)$/i]),
    hasScripts: check([/^scripts$/i]),
    hasWorkers: check([/^(workers?|jobs?|cronjobs?)$/i]),
    hasDocker: fileExists(root, 'Dockerfile') || fileExists(root, 'docker-compose.yml') || fileExists(root, 'docker-compose.yaml') || fileExists(root, 'compose.yml'),
    hasCI: fileExists(root, '.github', 'workflows') || fileExists(root, '.gitlab-ci.yml') || fileExists(root, 'Jenkinsfile'),
    hasSetupScript: fileExists(root, 'setup.sh') || fileExists(root, 'install.sh'),
    isMVC: false,
    packages: [],
  };
  result.isMVC = result.hasModels && (result.hasControllers || result.hasRoutes) && result.hasViews;
  return result;
}

function detectPackages(root, dirs) {
  const packages = [];
  for (const dir of dirs) {
    if (IGNORE_DIRS.has(dir)) continue;
    const sub = path.join(root, dir);
    for (const [file, runtime] of RUNTIME_FILES) {
      if (fileExists(sub, file)) {
        const pkg = runtime === 'node' ? readJSON(sub, 'package.json') : null;
        const stack = runtime === 'node' && pkg ? detectNodeStack(pkg) : {};
        packages.push({
          name: pkg?.name || dir,
          dir,
          runtime,
          framework: stack.framework || null,
          scripts: pkg?.scripts ? Object.keys(pkg.scripts) : [],
        });
        break;
      }
    }
  }
  return packages;
}

function detectEnvVars(root) {
  const envText = readText(root, '.env.example') || readText(root, '.env.sample');
  if (!envText) return [];
  return envText.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => l.split('=')[0].trim());
}

function extractReadmeCommands(root) {
  const readme = readText(root, 'README.md') || readText(root, 'readme.md') || readText(root, 'SETUP_GUIDE.md') || '';
  if (!readme) return {};

  const commands = { setup: [], run: [], test: [] };
  const blocks = readme.matchAll(/```(?:bash|sh|shell)?\n([\s\S]*?)```/g);

  for (const m of blocks) {
    const lines = m[1].split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    for (const line of lines) {
      if (/npm install|pip install|yarn|pnpm install|cargo build|go mod|bundle install|composer install/.test(line)) {
        commands.setup.push(line);
      } else if (/npm run dev|npm start|flask run|python manage|go run|cargo run|rails s|node /.test(line)) {
        commands.run.push(line);
      } else if (/npm test|pytest|go test|cargo test|jest|vitest|rspec/.test(line)) {
        commands.test.push(line);
      }
    }
  }

  return commands;
}

function detectConfigs(root) {
  return {
    hasGitignore: fileExists(root, '.gitignore'),
    hasEnvExample: fileExists(root, '.env.example') || fileExists(root, '.env.sample'),
    hasTsconfig: fileExists(root, 'tsconfig.json'),
    hasEslint: fileExists(root, '.eslintrc') || fileExists(root, '.eslintrc.js') || fileExists(root, '.eslintrc.json') || fileExists(root, 'eslint.config.js') || fileExists(root, 'eslint.config.mjs'),
    hasPrettier: fileExists(root, '.prettierrc') || fileExists(root, '.prettierrc.js') || fileExists(root, '.prettierrc.json') || fileExists(root, 'prettier.config.js'),
    hasBiome: fileExists(root, 'biome.json') || fileExists(root, 'biome.jsonc'),
    hasEditorconfig: fileExists(root, '.editorconfig'),
    hasMakefile: fileExists(root, 'Makefile'),
    hasReadme: fileExists(root, 'README.md') || fileExists(root, 'readme.md'),
    hasAgentsMd: fileExists(root, 'AGENTS.md'),
    hasClaudeMd: fileExists(root, 'CLAUDE.md'),
  };
}

exports.scan = function scan(root) {
  root = path.resolve(root);
  const runtime = detectRuntime(root);
  const pkg = readJSON(root, 'package.json');
  const structure = detectStructure(root);
  const configs = detectConfigs(root);
  const envVars = detectEnvVars(root);
  const readmeCommands = extractReadmeCommands(root);

  const packages = detectPackages(root, structure.dirs);
  structure.packages = packages;

  let stack = {};
  if (runtime === 'node' && pkg) stack = detectNodeStack(pkg);
  else if (runtime === 'python') stack = detectPythonStack(root);
  else if (runtime === 'go') stack = detectGoStack(root);
  else if (runtime === 'rust') stack = detectRustStack(root);
  else if (runtime === 'unknown' && packages.length > 0) {
    const primary = packages[0];
    stack = { framework: primary.framework, language: primary.runtime };
  }

  return {
    root,
    name: pkg?.name || path.basename(root),
    description: pkg?.description || null,
    runtime: runtime === 'unknown' && packages.length > 0 ? packages[0].runtime : runtime,
    isMonorepo: packages.length > 1 || (runtime === 'unknown' && packages.length > 0),
    scripts: pkg?.scripts || {},
    stack,
    structure,
    configs,
    envVars,
    readmeCommands,
    packages,
  };
};
