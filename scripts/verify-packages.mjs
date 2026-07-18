import { access, readFile } from 'node:fs/promises';

const packages = [
  'ui',
  'database',
  'auth',
  'permissions',
  'audit',
  'notifications',
  'payments',
  'scoring-engine',
  'results-importer',
  'disciplinary',
  'endurance',
  'offline-sync',
  'cms',
  'analytics',
];

const errors = [];

for (const directory of packages) {
  const root = new URL(`../packages/${directory}/`, import.meta.url);

  try {
    const manifest = JSON.parse(
      await readFile(new URL('package.json', root), 'utf8'),
    );
    const expectedName = `@udk/${directory}`;

    if (manifest.name !== expectedName) {
      errors.push(`${directory}: expected ${expectedName}, received ${manifest.name}`);
    }

    if (!manifest.exports?.['.']) {
      errors.push(`${directory}: package export is missing`);
    }

    await access(new URL('src/index.ts', root));
    await access(new URL('tsconfig.json', root));
  } catch (error) {
    errors.push(`${directory}: ${error.message}`);
  }
}

if (errors.length > 0) {
  throw new Error(`Package verification failed:\n- ${errors.join('\n- ')}`);
}

console.log(`packages-ok:${packages.length}`);
