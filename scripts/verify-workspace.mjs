import { access, readFile } from 'node:fs/promises';

const root = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);

if (!root.workspaces?.includes('apps/*') || !root.workspaces?.includes('packages/*')) {
  throw new Error('workspace globs missing');
}

const unifiedApp = JSON.parse(
  await readFile(new URL('../apps/plataforma/package.json', import.meta.url), 'utf8'),
);

if (unifiedApp.name !== '@udk/plataforma') {
  throw new Error(`expected unified application @udk/plataforma, received ${unifiedApp.name}`);
}

try {
  await access(new URL('../apps/web-publico/package.json', import.meta.url));
  throw new Error('separate public application must not exist');
} catch (error) {
  if (error.message === 'separate public application must not exist') throw error;
}

console.log('workspace-ok:single-app');
