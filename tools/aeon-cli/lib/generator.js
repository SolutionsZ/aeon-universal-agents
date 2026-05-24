'use strict';

const FRAMEWORK_NOTES = {
  express: 'Express.js HTTP server',
  next: 'Next.js React framework',
  nuxt: 'Nuxt.js Vue framework',
  fastify: 'Fastify HTTP server',
  hono: 'Hono HTTP server',
  koa: 'Koa HTTP server',
  react: 'React UI library',
  vue: 'Vue.js UI framework',
  svelte: 'Svelte UI framework',
  angular: 'Angular framework',
};

const ORM_NOTES = {
  sequelize: 'Sequelize ORM — models in models/, migrations required for schema changes',
  prisma: 'Prisma ORM — schema in prisma/schema.prisma, run `npx prisma migrate dev` for changes',
  typeorm: 'TypeORM — entities define schema, use migrations for changes',
  drizzle: 'Drizzle ORM — schema-first, use drizzle-kit for migrations',
  mongoose: 'Mongoose ODM — schemas define MongoDB document structure',
  knex: 'Knex query builder — use knex migrations for schema changes',
};

function scriptLine(scripts, key, fallback) {
  if (scripts[key]) return `npm run ${key}`;
  return fallback || null;
}

function buildSetupSection(profile) {
  const lines = ['## Setup', ''];
  const { scripts, runtime, configs } = profile;

  if (runtime === 'node') {
    lines.push('```bash');
    lines.push('npm install');
    if (configs.hasEnvExample) lines.push('cp .env.example .env');
    const migrate = scriptLine(scripts, 'migrate') || scriptLine(scripts, 'db:migrate') || scriptLine(scripts, 'prisma:migrate');
    if (migrate) lines.push(migrate);
    const setup = scriptLine(scripts, 'setup') || scriptLine(scripts, 'postinstall');
    if (setup) lines.push(setup);
    lines.push('```');
  } else if (runtime === 'python') {
    lines.push('```bash');
    lines.push('pip install -r requirements.txt');
    if (configs.hasEnvExample) lines.push('cp .env.example .env');
    lines.push('```');
  } else if (runtime === 'go') {
    lines.push('```bash');
    lines.push('go mod download');
    lines.push('```');
  } else if (runtime === 'rust') {
    lines.push('```bash');
    lines.push('cargo build');
    lines.push('```');
  } else {
    lines.push('```bash');
    lines.push('# TODO: add setup commands');
    lines.push('```');
  }

  return lines.join('\n');
}

function buildRunSection(profile) {
  const lines = ['## Run', ''];
  const { scripts } = profile;

  lines.push('```bash');
  const dev = scriptLine(scripts, 'dev') || scriptLine(scripts, 'start:dev');
  const start = scriptLine(scripts, 'start');

  if (dev) lines.push(dev + '   # development');
  if (start && start !== dev) lines.push(start + '  # production');
  if (!dev && !start) lines.push('# TODO: add run command');
  lines.push('```');

  return lines.join('\n');
}

function buildTestSection(profile) {
  const lines = ['## Test', ''];
  const { scripts } = profile;

  lines.push('```bash');
  const test = scriptLine(scripts, 'test');
  const lint = scriptLine(scripts, 'lint');
  const typecheck = scriptLine(scripts, 'typecheck') || scriptLine(scripts, 'type-check') || scriptLine(scripts, 'tsc');

  if (test) lines.push(test);
  if (lint) lines.push(lint);
  if (typecheck) lines.push(typecheck);
  if (!test && !lint) lines.push('# TODO: add test commands');
  lines.push('```');

  return lines.join('\n');
}

function buildStructureSection(profile) {
  const { structure } = profile;
  const lines = ['## Structure', '', '```txt'];

  const entries = [];
  if (structure.hasSrc) entries.push(['src/', 'source code']);
  if (structure.hasLib) entries.push(['lib/', 'library code']);
  if (structure.hasModels) entries.push(['models/', 'data models / schemas']);
  if (structure.hasControllers) entries.push(['controllers/', 'business logic']);
  if (structure.hasViews) entries.push(['views/', 'templates / UI']);
  if (structure.hasRoutes) entries.push(['routes/', 'route definitions']);
  if (structure.hasServices) entries.push(['services/', 'reusable operations']);
  if (structure.hasMiddleware) entries.push(['middleware/', 'request middleware']);
  if (structure.hasConfig) entries.push(['config/', 'configuration']);
  if (structure.hasTests) entries.push(['test/', 'tests']);
  if (structure.hasPublic) entries.push(['public/', 'static assets']);
  if (structure.hasDocs) entries.push(['docs/', 'documentation']);

  if (entries.length === 0) {
    structure.dirs.slice(0, 10).forEach(d => entries.push([d + '/', '']));
  } else {
    const shown = new Set(entries.map(([k]) => k.replace('/', '')));
    structure.dirs.filter(d => !shown.has(d)).slice(0, 6).forEach(d => entries.push([d + '/', '']));
  }

  if (entries.length === 0) {
    lines.push('# TODO: document project structure');
    lines.push('```');
    return lines.join('\n');
  }

  const maxLen = Math.max(...entries.map(([k]) => k.length));
  entries.forEach(([dir, desc]) => {
    lines.push(`${dir.padEnd(maxLen + 2)}${desc ? '→ ' + desc : ''}`);
  });

  lines.push('```');
  return lines.join('\n');
}

function buildStackSection(profile) {
  const { stack, runtime } = profile;
  if (runtime !== 'node' || !stack.framework) return null;

  const lines = ['## Stack', ''];
  const parts = [];

  if (stack.framework) parts.push(FRAMEWORK_NOTES[stack.framework] || stack.framework);
  if (stack.language === 'typescript') parts.push('TypeScript');
  if (stack.css) parts.push(stack.css.charAt(0).toUpperCase() + stack.css.slice(1) + ' CSS');
  if (stack.orm) parts.push(ORM_NOTES[stack.orm]?.split(' — ')[0] || stack.orm);
  if (stack.testFramework) parts.push(stack.testFramework + ' tests');
  if (stack.bundler) parts.push(stack.bundler + ' bundler');

  parts.forEach(p => lines.push('- ' + p));

  if (stack.orm && ORM_NOTES[stack.orm]) {
    lines.push('');
    lines.push('### Persistence');
    lines.push('');
    lines.push(ORM_NOTES[stack.orm]);
  }

  return lines.join('\n');
}

function buildConventionsSection(profile) {
  const { configs, stack } = profile;
  const lines = ['## Conventions', ''];

  if (configs.hasEslint || stack.linter === 'eslint') {
    lines.push('- Code style enforced by ESLint — do not duplicate style rules in this file');
  }
  if (configs.hasPrettier) {
    lines.push('- Formatting enforced by Prettier — do not add formatting rules here');
  }
  if (configs.hasBiome || stack.linter === 'biome') {
    lines.push('- Linting and formatting enforced by Biome');
  }
  if (configs.hasEditorconfig) {
    lines.push('- Editor settings defined in .editorconfig');
  }
  if (stack.language === 'typescript') {
    lines.push('- TypeScript strict mode — do not use `any` without justification');
  }
  if (profile.structure.isMVC) {
    lines.push('- MVC structure — keep models, controllers, views, and routes in their own layers');
    lines.push('- No business logic in views, no SQL in controllers');
  }

  if (lines.length === 2) {
    lines.push('- Keep naming consistent with existing code');
    lines.push('- Prefer simple, readable code over clever abstractions');
  }

  return lines.join('\n');
}

function buildDoNotSection(profile) {
  const lines = ['## Do not', ''];

  lines.push('- Do not edit generated or auto-built files');
  if (profile.configs.hasGitignore) {
    lines.push('- Do not commit .env, secrets, API keys, or credentials');
  }
  lines.push('- Do not change database schema without a migration');
  lines.push('- Do not add dependencies without justification');
  lines.push('- Do not rename or restructure code that was not asked to be changed');
  lines.push('- Do not replace working patterns with "modern" alternatives');
  lines.push('- Do not claim a file, function, or behavior exists without verifying');

  return lines.join('\n');
}

function buildDoneSection(profile) {
  const { scripts } = profile;
  const lines = ['## Done when', ''];

  if (scripts.test) lines.push('- Tests pass (`npm test`)');
  if (scripts.lint) lines.push('- Lint passes (`npm run lint`)');
  if (scripts.typecheck || scripts['type-check']) lines.push('- Type check passes');
  lines.push('- Change is the smallest safe diff');
  lines.push('- No unintended side effects');
  lines.push('- Documentation updated if public behavior changed');

  return lines.join('\n');
}

function buildEnvSection(profile) {
  if (profile.envVars.length === 0) return null;

  const lines = ['## Environment', '', '```txt'];
  profile.envVars.forEach(v => lines.push(v));
  lines.push('```');
  lines.push('');
  lines.push('All secrets and environment-specific config must use environment variables. Never hardcode.');

  return lines.join('\n');
}

exports.generate = function generate(profile) {
  const sections = [];

  const desc = profile.description || `${profile.runtime} project`;
  sections.push(`# AGENTS.md\n\n${profile.name} — ${desc}`);

  sections.push(buildSetupSection(profile));
  sections.push(buildRunSection(profile));
  sections.push(buildTestSection(profile));
  sections.push(buildStructureSection(profile));

  const stackSection = buildStackSection(profile);
  if (stackSection) sections.push(stackSection);

  const envSection = buildEnvSection(profile);
  if (envSection) sections.push(envSection);

  sections.push(buildConventionsSection(profile));
  sections.push(buildDoNotSection(profile));
  sections.push(buildDoneSection(profile));

  return sections.join('\n\n') + '\n';
};
