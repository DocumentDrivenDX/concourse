import { mkdir, rm, copyFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
const output = 'dist/site';
await rm(output, { recursive: true, force: true });
await mkdir(join(output, 'concourse'), { recursive: true });
const hashes: Record<string, string> = {};
for (const name of ['index.html', 'guide.html', 'hosting.html']) {
  const source = await Bun.file(`site/${name}`).text();
  if (source.split('<!-- CONCOURSE -->').length !== 2) throw new Error(`One integration marker required: ${name}`);
  const revision = new Bun.CryptoHasher('sha256').update(source).digest('hex');
  const marker = `<div data-concourse data-site="concourse" data-resource="${name}" data-revision="${revision}" data-api="/__concourse/" data-css="/concourse/concourse.css" data-feedback="true"></div><script type="module" src="/concourse/concourse.js"></script>`;
  await Bun.write(join(output, name), source.replace('<!-- CONCOURSE -->', marker));
  hashes[name] = revision;
}
await copyFile('site/site.css', join(output, 'site.css'));
await mkdir(join(output, 'images'), { recursive: true });
for (const name of await readdir('site/images')) if (/\.(png|jpg|webp)$/.test(name)) await copyFile(join('site/images', name), join(output, 'images', name));
for (const name of ['concourse.js', 'concourse.css', 'THIRD-PARTY-NOTICES.txt']) await copyFile(join('dist', name), join(output, 'concourse', name));
const files: Record<string, string> = {};
for (const name of (await readdir(output, { recursive: true })).sort()) {
  const file = Bun.file(join(output, name));
  if ((await file.stat()).isFile()) files[name] = new Bun.CryptoHasher('sha256').update(await file.bytes()).digest('hex');
}
await Bun.write(join(output, 'build.json'), JSON.stringify({ format: 1, resources: hashes, files }, null, 2) + '\n');
console.log('Built Concourse microsite in dist/site/');
