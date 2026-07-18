import { readFile } from 'node:fs/promises';

const root = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);

if (!root.workspaces?.includes('apps/*') || !root.workspaces?.includes('packages/*')) {
  throw new Error('workspace globs missing');
}

console.log('workspace-ok');
