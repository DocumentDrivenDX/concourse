import { resolve, dirname } from 'node:path';
import { mkdir } from 'node:fs/promises';
const args = process.argv.slice(2), check = args.includes('--check');
const target = args.find(a => a !== '--check');
if (!target) throw new Error('Usage: install-hugo.ts <site-directory> [--check]');
const root = resolve(import.meta.dir, '../..');
const files = [ ['integrations/hugo/concourse.html', 'layouts/_partials/concourse.html'],
  ['dist/concourse.js', 'static/concourse/concourse.js'], ['dist/concourse.css', 'static/concourse/concourse.css'],
  ['dist/manifest.json', 'static/concourse/manifest.json'] ];
for (const [source, destination] of files) {
  if (!source || !destination) throw new Error('Invalid installation inventory');
  const bytes = await Bun.file(resolve(root, source)).bytes(); const output = resolve(target, destination);
  if (check) {
    if (!await Bun.file(output).exists() || !Buffer.from(bytes).equals(Buffer.from(await Bun.file(output).bytes()))) throw new Error(`Concourse asset drift: ${destination}`);
  } else { await mkdir(dirname(output), { recursive: true }); await Bun.write(output, bytes); }
}
console.log(check ? 'Concourse Hugo assets verified' : 'Concourse Hugo assets installed');
