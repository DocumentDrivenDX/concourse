import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
const result = await Bun.build({ entrypoints: ['src/browser/index.ts'], outdir: 'dist', naming: 'concourse.js', target: 'browser', minify: true });
if (!result.success) throw new AggregateError(result.logs, 'Browser build failed');
await copyFile('src/browser/concourse.css', 'dist/concourse.css');
await copyFile('integrations/hugo/concourse.html', 'dist/concourse.html');
const files: Record<string, string> = {};
for (const name of ['concourse.js', 'concourse.css', 'concourse.html']) files[name] = new Bun.CryptoHasher('sha256').update(await Bun.file(`dist/${name}`).bytes()).digest('hex');
await Bun.write('dist/manifest.json', JSON.stringify({ version: '0.1.0', files }, null, 2) + '\n');

if (!process.argv.includes('--browser-only')) {
const worker = await Bun.build({ entrypoints: ['src/server/worker.ts'], outdir: 'dist', naming: 'worker.js', target: 'browser', minify: true });
if (!worker.success) throw new AggregateError(worker.logs, 'Worker build failed');
}
