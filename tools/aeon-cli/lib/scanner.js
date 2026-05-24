'use strict';

const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', '.nuxt', 'dist', 'build', 'out',
  'coverage', '__pycache__', '.venv', 'venv', 'vendor', 'target',
  '.cache', '.turbo', '.vercel', '.svelte-kit',
]);

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
  if (fileExists(root, 'package.json')) return 'node';
  if (fileExists(root, 'pyproject.toml') || fileExists(root, 'requirements.txt')) return 'python';
  if (fileExists(root, 'go.mod')) return 'go';
  if (fileExists(root, 'Cargo.toml')) return 'rust';
  if (fileExists(root, 'Gemfile')) return 'ruby';
  if (fileExists(root, 'composer.json')) return 'php';
  return 'unknown';
}

function detectNodeStack(pkg) {
  const all = { ...pkg.dependencies, ...pkg.devDependencies };
  const has = (name) => name in all;

  const stack = { framework: null, language: 'javascript', css: null, orm: null, testFramework: null, linter: null, bundler: null };

  if (has('typescript') || has('ts-node')) stack.language = 'typescript';

  if (has('next')) stack.framework = 'next';
  else if (has('nuxt')) stack.framework = 'nuxt';
  else if (has('express')) stack.framework = 'express';
  else if (has('fastify')) stack.framework = 'fastify';
  else if (has('hono')) stack.framework = 'hono';
  else if (has('koa')) stack.framework = 'koa';
  else if (has('react')) stack.framework = 'react';
  else if (has('vue')) stack.framework = 'vue';
  else if (has('svelte')) stack.framework = 'svelte';
  else if (has('angular')) stack.framework = 'angular';

  if (has('tailwindcss')) stack.css = 'tailwind';
  else if (has('sass') || has('node-sass')) stack.css = 'sass';
  else if (has('styled-components')) stack.css = 'styled-components';

  if (has('sequelize')) stack.orm = 'sequelize';
  else if (has('prisma') || has('@prisma/client')) stack.orm = 'prisma';
  else if (has('typeorm')) stack.orm = 'typeorm';
  else if (has('drizzle-orm')) stack.orm = 'drizzle';
  else if (has('mongoose')) stack.orm = 'mongoose';
  else if (has('knex')) stack.orm = 'knex';

  if (has('jest')) stack.testFramework = 'jest';
  else if (has('vitest')) stack.testFramework = 'vitest';
  else if (has('mocha')) stack.testFramework = 'mocha';
  else if (has('ava')) stack.testFramework = 'ava';
  else if (has('tap')) stack.testFramework = 'tap';

  if (has('eslint')) stack.linter = 'eslint';
  else if (has('@biomejs/biome') || has('biome')) stack.linter = 'biome';

  if (has('vite')) stack.bundler = 'vite';
  else if (has('webpack')) stack.bundler = 'webpack';
  else if (has('esbuild')) stack.bundler = 'esbuild';
  else if (has('rollup')) stack.bundler = 'rollup';

  return stack;
}

function detectStructure(root) {
  const dirs = getTopDirs(root);
  const result = {
    dirs,
    hasModels: dirs.some(d => /^models?$/i.test(d)),
    hasControllers: dirs.some(d => /^controllers?$/i.test(d)),
    hasViews: dirs.some(d => /^views?$/i.test(d)),
    hasRoutes: dirs.some(d => /^routes?$/i.test(d)),
    hasServices: dirs.some(d => /^services?$/i.test(d)),
    hasMiddleware: dirs.some(d => /^middleware$/i.test(d)),
    hasSrc: dirs.includes('src'),
    hasLib: dirs.includes('lib'),
    hasTests: dirs.some(d => /^(tests?|__tests__|spec)$/i.test(d)),
    hasPublic: dirs.some(d => /^(public|static|assets)$/i.test(d)),
    hasConfig: dirs.some(d => /^config$/i.test(d)),
    hasDocs: dirs.includes('docs'),
    hasDocker: fileExists(root, 'Dockerfile') || fileExists(root, 'docker-compose.yml') || fileExists(root, 'docker-compose.yaml'),
    hasCI: fileExists(root, '.github', 'workflows') || fileExists(root, '.gitlab-ci.yml') || fileExists(root, 'Jenkinsfile'),
    isMVC: false,
  };
  result.isMVC = result.hasModels && (result.hasControllers || result.hasRoutes) && result.hasViews;
  return result;
}

function detectEnvVars(root) {
  const envText = readText(root, '.env.example') || readText(root, '.env.sample');
  if (!envText) return [];
  return envText.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => l.split('=')[0].trim());
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

  const profile = {
    root,
    name: pkg?.name || path.basename(root),
    description: pkg?.description || null,
    runtime,
    scripts: pkg?.scripts || {},
    stack: runtime === 'node' && pkg ? detectNodeStack(pkg) : {},
    structure,
    configs,
    envVars,
  };

  return profile;
};
