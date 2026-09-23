import { build as viteBuild } from 'vite';
import { build } from 'esbuild';
import { mkdir, copyFile, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await viteBuild({ configFile: 'apps/frontend/vite.config.ts' });
await build({
  entryPoints: ['apps/backend/src/worker.ts'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  outfile: 'dist/server/index.js',
  minify: true,
});
await build({
  entryPoints: ['apps/backend/src/local.ts'],
  bundle: true,
  packages: 'external',
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile: 'dist/node/server.mjs',
});
await mkdir('dist/.openai', { recursive: true });
await copyFile('.openai/hosting.json', 'dist/.openai/hosting.json');
console.info('Built frontend, Worker API and Node API.');
