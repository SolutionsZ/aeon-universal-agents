'use strict';

const FRAMEWORK_NOTES = {
  express: 'Express.js HTTP server', next: 'Next.js React framework', nuxt: 'Nuxt.js Vue framework',
  fastify: 'Fastify HTTP server', hono: 'Hono HTTP server', koa: 'Koa HTTP server',
  react: 'React UI library', vue: 'Vue.js UI framework', svelte: 'Svelte UI framework',
  angular: 'Angular framework', ionic: 'Ionic mobile framework', electron: 'Electron desktop app',
  django: 'Django web framework', flask: 'Flask web framework', fastapi: 'FastAPI async framework',
  gin: 'Gin HTTP framework', echo: 'Echo HTTP framework', fiber: 'Fiber HTTP framework',
  actix: 'Actix-web framework', rocket: 'Rocket web framework', axum: 'Axum web framework',
};

const ORM_NOTES = {
  sequelize: 'Sequelize ORM — models in models/, migrations required for schema changes',
  prisma: 'Prisma ORM — schema in prisma/schema.prisma, run `npx prisma migrate dev` for changes',
  typeorm: 'TypeORM — entities define schema, use migrations for changes',
  drizzle: 'Drizzle ORM — schema-first, use drizzle-kit for migrations',
  mongoose: 'Mongoose ODM — schemas define MongoDB document structure',
  knex: 'Knex query builder — use knex migrations for schema changes',
  sqlalchemy: 'SQLAlchemy ORM — use Alembic migrations for schema changes',
  'django-orm': 'Django ORM — run `python manage.py makemigrations` then `python manage.py migrate`',
};

const DIR_LABELS = {
  src: 'source code', lib: 'library code', models: 'data models / schemas', model: 'data models / schemas',
  controllers: 'business logic', controller: 'business logic', views: 'templates / UI', view: 'templates / UI',
  routes: 'route definitions', route: 'route definitions', endpoints: 'API endpoints', endpoint: 'API endpoints',
  services: 'reusable operations', service: 'reusable operations', middleware: 'request middleware',
  config: 'configuration', test: 'tests', tests: 'tests', spec: 'tests', '__tests__': 'tests',
  'e2e-tests': 'end-to-end tests', 'unit-tests': 'unit tests', 'test-lab': 'test lab',
  public: 'static assets', static: 'static assets', assets: 'static assets', www: 'web assets',
  docs: 'documentation', documentation: 'documentation', scripts: 'utility scripts',
  workers: 'background workers', cronjobs: 'scheduled jobs', jobs: 'background jobs',
  database: 'database', data: 'data files', migrations: 'database migrations',
  sequelize: 'Sequelize config / migrations', prisma: 'Prisma schema / migrations',
  client: 'client app', server: 'server app', api: 'API layer', website: 'website',
  frontend: 'frontend', backend: 'backend', packages: 'packages',
  firebase: 'Firebase integration', locales: 'translations / i18n',
};

function scriptCmd(scripts, key) {
  return scripts[key] ? `npm run ${key}` : null;
}

function buildSetup(profile) {
  const { scripts, runtime, configs, readmeCommands, isMonorepo, packages, structure } = profile;
  const lines = ['## Setup', '', '```bash'];

  if (readmeCommands?.setup?.length > 0) {
    readmeCommands.setup.forEach(cmd => lines.push(cmd));
  } else if (structure.hasSetupScript) {
    lines.push('chmod +x setup.sh && ./setup.sh');
  } else if (runtime === 'node') {
    if (isMonorepo && packages.length > 0) {
      lines.push('# Install all packages');
      packages.forEach(p => lines.push(`cd ${p.dir} && npm install && cd ..`));
    } else {
      lines.push('npm install');
    }
    if (configs.hasEnvExample) lines.push('cp .env.example .env');
    const migrate = scriptCmd(scripts, 'migrate') || scriptCmd(scripts, 'db:migrate') || scriptCmd(scripts, 'setup');
    if (migrate) lines.push(migrate);
  } else if (runtime === 'python') {
    lines.push('pip install -r requirements.txt');
    if (configs.hasEnvExample) lines.push('cp .env.example .env');
  } else if (runtime === 'go') {
    lines.push('go mod download');
  } else if (runtime === 'rust') {
    lines.push('cargo build');
  } else {
    lines.push('# TODO: add setup commands');
  }

  lines.push('```');
  return lines.join('\n');
}

function buildRun(profile) {
  const { scripts, runtime, readmeCommands, isMonorepo, packages, stack } = profile;
  const lines = ['## Run', '', '```bash'];

  if (readmeCommands?.run?.length > 0) {
    readmeCommands.run.forEach(cmd => lines.push(cmd));
  } else if (runtime === 'node') {
    if (isMonorepo && packages.length > 0) {
      packages.forEach(p => {
        if (p.scripts.includes('start') || p.scripts.includes('dev')) {
          const cmd = p.scripts.includes('dev') ? 'dev' : 'start';
          lines.push(`cd ${p.dir} && npm run ${cmd}  # ${p.name}`);
        }
      });
    }
    if (lines.length === 3) {
      const dev = scriptCmd(scripts, 'dev') || scriptCmd(scripts, 'start:dev');
      const start = scriptCmd(scripts, 'start');
      if (dev) lines.push(dev + '   # development');
      if (start && start !== dev) lines.push(start + '  # production');
    }
  } else if (runtime === 'python') {
    if (stack.framework === 'django') lines.push('python manage.py runserver');
    else if (stack.framework === 'flask') lines.push('flask run');
    else if (stack.framework === 'fastapi') lines.push('uvicorn main:app --reload');
    else lines.push('python main.py');
  } else if (runtime === 'go') {
    lines.push('go run .');
  } else if (runtime === 'rust') {
    lines.push('cargo run');
  }

  if (lines.length === 3) lines.push('# TODO: add run command');
  lines.push('```');
  return lines.join('\n');
}

function buildTest(profile) {
  const { scripts, runtime, readmeCommands, stack } = profile;
  const lines = ['## Test', '', '```bash'];

  if (readmeCommands?.test?.length > 0) {
    readmeCommands.test.forEach(cmd => lines.push(cmd));
  } else if (runtime === 'node') {
    if (scripts.test) lines.push(scriptCmd(scripts, 'test'));
    if (scripts.lint) lines.push(scriptCmd(scripts, 'lint'));
    const tc = scriptCmd(scripts, 'typecheck') || scriptCmd(scripts, 'type-check') || scriptCmd(scripts, 'tsc');
    if (tc) lines.push(tc);
  } else if (runtime === 'python') {
    lines.push(stack.testFramework === 'pytest' ? 'pytest' : 'python -m pytest');
    if (stack.linter) lines.push(stack.linter + ' .');
  } else if (runtime === 'go') {
    lines.push('go test ./...');
    lines.push('go vet ./...');
  } else if (runtime === 'rust') {
    lines.push('cargo test');
    lines.push('cargo clippy');
  }

  if (lines.length === 3) lines.push('# TODO: add test commands');
  lines.push('```');
  return lines.join('\n');
}

function buildStructure(profile) {
  const { structure, isMonorepo, packages } = profile;
  const lines = ['## Structure', '', '```txt'];

  const entries = [];
  const known = new Set();

  const knownDirs = [
    ['hasSrc', 'src/'], ['hasLib', 'lib/'], ['hasModels', 'models/'],
    ['hasControllers', 'controllers/'], ['hasViews', 'views/'],
    ['hasRoutes', 'routes/'], ['hasServices', 'services/'],
    ['hasMiddleware', 'middleware/'], ['hasConfig', 'config/'],
    ['hasTests', 'test/'], ['hasPublic', 'public/'],
    ['hasDocs', 'docs/'], ['hasScripts', 'scripts/'], ['hasWorkers', 'workers/'],
  ];

  for (const [flag, dir] of knownDirs) {
    if (structure[flag]) {
      const name = dir.replace('/', '');
      const actual = structure.dirs.find(d => d.toLowerCase() === name || DIR_LABELS[d.toLowerCase()] === DIR_LABELS[name]);
      const display = actual ? actual + '/' : dir;
      entries.push([display, DIR_LABELS[name] || '']);
      known.add(actual || name);
    }
  }

  for (const d of structure.dirs) {
    if (known.has(d)) continue;
    const label = DIR_LABELS[d.toLowerCase()] || '';
    entries.push([d + '/', label]);
    if (entries.length >= 16) break;
  }

  if (entries.length === 0) {
    lines.push('# TODO: document project structure');
  } else {
    const maxLen = Math.max(...entries.map(([k]) => k.length));
    entries.forEach(([dir, desc]) => {
      lines.push(`${dir.padEnd(maxLen + 2)}${desc ? '→ ' + desc : ''}`);
    });
  }

  lines.push('```');

  if (isMonorepo && packages.length > 0) {
    lines.push('');
    lines.push('### Packages');
    lines.push('');
    packages.forEach(p => {
      const parts = [p.runtime];
      if (p.framework) parts.push(p.framework);
      lines.push(`- \`${p.dir}/\` — ${p.name} (${parts.join(', ')})`);
    });
  }

  return lines.join('\n');
}

function buildStack(profile) {
  const { stack, runtime } = profile;
  if (!stack.framework && !stack.orm && !stack.testFramework && !stack.linter) return null;

  const lines = ['## Stack', ''];
  const parts = [];

  if (stack.framework) parts.push(FRAMEWORK_NOTES[stack.framework] || stack.framework);
  if (stack.language === 'typescript') parts.push('TypeScript');
  if (stack.css) parts.push(stack.css.charAt(0).toUpperCase() + stack.css.slice(1) + ' CSS');
  if (stack.orm) parts.push(ORM_NOTES[stack.orm]?.split(' — ')[0] || stack.orm);
  if (stack.testFramework) parts.push(stack.testFramework + ' tests');
  if (stack.linter) parts.push(stack.linter + ' linter');
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

function buildEnv(profile) {
  if (profile.envVars.length === 0) return null;
  const lines = ['## Environment', '', '```txt'];
  profile.envVars.forEach(v => lines.push(v));
  lines.push('```');
  lines.push('');
  lines.push('All secrets must use environment variables. Never hardcode.');
  return lines.join('\n');
}

function buildConventions(profile) {
  const { configs, stack, structure } = profile;
  const lines = ['## Conventions', ''];

  if (configs.hasEslint || stack.linter === 'eslint') lines.push('- Code style enforced by ESLint — do not duplicate style rules in this file');
  if (configs.hasPrettier) lines.push('- Formatting enforced by Prettier — do not add formatting rules here');
  if (configs.hasBiome || stack.linter === 'biome') lines.push('- Linting and formatting enforced by Biome');
  if (configs.hasEditorconfig) lines.push('- Editor settings defined in .editorconfig');
  if (stack.language === 'typescript') lines.push('- TypeScript strict mode — do not use `any` without justification');
  if (structure.isMVC) {
    lines.push('- MVC structure — keep models, controllers, views, and routes in their own layers');
    lines.push('- No business logic in views, no SQL in controllers');
  }

  if (lines.length === 2) {
    lines.push('- Keep naming consistent with existing code');
    lines.push('- Prefer simple, readable code over clever abstractions');
  }

  return lines.join('\n');
}

function buildSecurity(profile) {
  const { stack, runtime } = profile;
  const webFrameworks = /^(express|fastify|next|nuxt|koa|hono|django|flask|fastapi|gin|echo|fiber|actix|rocket|axum|ionic)$/;
  if (!stack.framework || !webFrameworks.test(stack.framework)) return null;

  const lines = ['## Security', ''];
  lines.push('- Validate all input server-side — never trust the client');
  lines.push('- Authorize at the resource level — check ownership, not just authentication');
  lines.push('- Never hardcode secrets — use environment variables');
  lines.push('- Never commit `.env`, API keys, tokens, or credentials');

  if (runtime === 'node') {
    lines.push('- Sanitize rendered output to prevent XSS');
    lines.push('- Use `helmet` or equivalent security headers');
    lines.push('- Hash passwords with `bcrypt` or `argon2` — never store plaintext');
    lines.push('- Rate-limit authentication endpoints');
  } else if (runtime === 'python' && stack.framework === 'django') {
    lines.push('- Use Django CSRF protection — do not disable it');
    lines.push('- Use Django ORM parameterized queries — no raw SQL with string formatting');
    lines.push('- Hash passwords with Django auth or `argon2` — never store plaintext');
  } else {
    lines.push('- Sanitize output to prevent XSS');
    lines.push('- Hash passwords — never store plaintext');
  }

  return lines.join('\n');
}

function buildErrorHandling() {
  return [
    '## Error handling', '',
    '- Do not swallow errors that affect state — log or propagate them',
    '- Never expose stack traces or internal details to users',
    '- Convert internal errors to safe user-facing messages at boundaries',
    '- Only retry transient failures (timeout, 503) — not validation or auth errors',
  ].join('\n');
}

function buildDoNot(profile) {
  const lines = ['## Do not', ''];
  lines.push('- Do not edit generated or auto-built files');
  if (profile.configs.hasGitignore) lines.push('- Do not commit `.env`, secrets, API keys, or credentials');
  if (profile.stack.orm) lines.push('- Do not change database schema without a migration');
  lines.push('- Do not add dependencies without justification');
  lines.push('- Do not rename or restructure code that was not asked to be changed');
  lines.push('- Do not replace working patterns with "modern" alternatives');
  lines.push('- Do not claim a file, function, or behavior exists without verifying');
  return lines.join('\n');
}

function buildDone(profile) {
  const { scripts, runtime, stack } = profile;
  const lines = ['## Done when', ''];

  if (runtime === 'node') {
    if (scripts.test) lines.push('- Tests pass (`npm test`)');
    if (scripts.lint) lines.push('- Lint passes (`npm run lint`)');
    if (scripts.typecheck || scripts['type-check']) lines.push('- Type check passes');
  } else if (runtime === 'python') {
    lines.push('- Tests pass (`pytest`)');
    if (stack.linter) lines.push(`- Lint passes (\`${stack.linter} .\`)`);
  } else if (runtime === 'go') {
    lines.push('- Tests pass (`go test ./...`)');
    lines.push('- Vet passes (`go vet ./...`)');
  } else if (runtime === 'rust') {
    lines.push('- Tests pass (`cargo test`)');
    lines.push('- Clippy clean (`cargo clippy`)');
  }

  lines.push('- Change is the smallest safe diff');
  lines.push('- No unintended side effects');
  lines.push('- Documentation updated if public behavior changed');
  return lines.join('\n');
}

exports.generate = function generate(profile) {
  const sections = [];
  const desc = profile.description || (profile.isMonorepo ? 'multi-package project' : `${profile.runtime} project`);
  sections.push(`# AGENTS.md\n\n${profile.name} — ${desc}`);

  sections.push(buildSetup(profile));
  sections.push(buildRun(profile));
  sections.push(buildTest(profile));
  sections.push(buildStructure(profile));

  const stack = buildStack(profile);
  if (stack) sections.push(stack);

  const env = buildEnv(profile);
  if (env) sections.push(env);

  sections.push(buildConventions(profile));

  const security = buildSecurity(profile);
  if (security) sections.push(security);

  sections.push(buildErrorHandling());
  sections.push(buildDoNot(profile));
  sections.push(buildDone(profile));

  return sections.join('\n\n') + '\n';
};
