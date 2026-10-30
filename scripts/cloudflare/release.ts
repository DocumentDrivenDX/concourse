import { lstat, mkdir, readdir, realpath } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { profile, wranglerConfig, fromWrangler } from './profile.ts';

type Manifest = {
  format: number; sourceCommit: string; wranglerVersion: string;
  lockHash: string; files: Record<string, string>; digest: string;
};
const root = resolve(import.meta.dir, '../..');
const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;
export const hash = (data: string | Uint8Array) => new Bun.CryptoHasher('sha256').update(data).digest('hex');
function digest(manifest: Omit<Manifest, 'digest'>) {
  return hash(JSON.stringify({ format: manifest.format, sourceCommit: manifest.sourceCommit,
    wranglerVersion: manifest.wranglerVersion, lockHash: manifest.lockHash,
    files: Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b))) }));
}
async function fileNames(directory: string, prefix = ''): Promise<string[]> {
  const result: string[] = [];
  for (const name of await readdir(join(directory, prefix))) {
    const path = prefix ? `${prefix}/${name}` : name;
    const stat = await lstat(join(directory, path));
    if (stat.isSymbolicLink()) throw new Error('Release symlinks are forbidden');
    if (stat.isDirectory() && path === 'migrations') result.push(...await fileNames(directory, path));
    else if (stat.isFile()) result.push(path);
    else throw new Error('Unexpected release entry');
  }
  return result.sort();
}
export async function prepare(profilePath: string, directory: string): Promise<Manifest> {
  const p = profile(await Bun.file(profilePath).json());
  const worker = await Bun.file(join(root, 'dist/worker.js')).bytes();
  const migrations = (await readdir(join(root, 'migrations'))).filter(n => /^\d{4}_[a-z0-9_]+\.sql$/.test(n)).sort();
  if (!worker.length || !migrations.length) throw new Error('Build Worker and supply migrations before preparation');
  const source = Bun.spawn(['git', 'rev-parse', 'HEAD'], { cwd: root, stdout: 'pipe', stderr: 'pipe' });
  const sourceCommit = (await new Response(source.stdout).text()).trim();
  if (await source.exited !== 0 || !/^[a-f0-9]{40}$/.test(sourceCommit)) throw new Error('Cannot identify source commit');
  // No recursive creation: an existing release can never be silently overwritten.
  await mkdir(directory);
  await mkdir(join(directory, 'migrations'));
  await Bun.write(join(directory, 'worker.js'), worker);
  await Bun.write(join(directory, 'wrangler.json'), json(wranglerConfig(p)));
  for (const name of migrations) await Bun.write(join(directory, 'migrations', name), await Bun.file(join(root, 'migrations', name)).bytes());
  const files: Record<string, string> = {};
  for (const name of await fileNames(directory)) files[name] = hash(await Bun.file(join(directory, name)).bytes());
  const pkg = await Bun.file(join(root, 'package.json')).json();
  const payload = { format: 1, sourceCommit, wranglerVersion: pkg.devDependencies.wrangler as string,
    lockHash: hash(await Bun.file(join(root, 'bun.lock')).bytes()), files };
  const manifest = { ...payload, digest: digest(payload) };
  await Bun.write(join(directory, 'release.json'), json(manifest));
  return manifest;
}
export async function verify(directory: string, approved: string): Promise<Manifest> {
  if (!/^[a-f0-9]{64}$/.test(approved)) throw new Error('An explicit reviewed release digest is required');
  if ((await lstat(directory)).isSymbolicLink()) throw new Error('Release symlinks are forbidden');
  const names = await fileNames(directory);
  const manifest = await Bun.file(join(directory, 'release.json')).json() as Manifest;
  if (Object.keys(manifest).sort().join(',') !== 'digest,files,format,lockHash,sourceCommit,wranglerVersion') throw new Error('Invalid manifest');
  if (manifest.format !== 1 || manifest.digest !== approved || digest(manifest) !== approved) throw new Error('Release approval does not match');
  if (!manifest.files || Object.keys(manifest.files).sort().join('\n') !== names.filter(n => n !== 'release.json').join('\n')) throw new Error('Release file list changed');
  if (!manifest.files['worker.js'] || !manifest.files['wrangler.json'] || !names.some(n => n.startsWith('migrations/'))) throw new Error('Incomplete release');
  for (const name of Object.keys(manifest.files)) {
    if (!/^(worker\.js|wrangler\.json|migrations\/\d{4}_[a-z0-9_]+\.sql)$/.test(name)) throw new Error('Unexpected release file');
    if (hash(await Bun.file(join(directory, name)).bytes()) !== manifest.files[name]) throw new Error('Release bytes changed');
  }
  fromWrangler(await Bun.file(join(directory, 'wrangler.json')).json());
  const installed = await Bun.file(join(root, 'node_modules/wrangler/package.json')).json();
  if (installed.version !== manifest.wranglerVersion || hash(await Bun.file(join(root, 'bun.lock')).bytes()) !== manifest.lockHash) throw new Error('Deployment toolchain changed');
  return manifest;
}

export async function deploymentCommand(directory: string, approved: string): Promise<string[]> {
  await verify(directory, approved);
  return ['node', join(root, 'node_modules/wrangler/bin/wrangler.js'), 'deploy', '--config', join(await realpath(directory), 'wrangler.json')];
}

if (import.meta.main) {
  try {
    const [action, path, outputOrFlag, approved] = process.argv.slice(2);
    if (action === 'prepare' && path && outputOrFlag && !approved) {
      const manifest = await prepare(path, outputOrFlag);
      const p = fromWrangler(await Bun.file(join(outputOrFlag, 'wrangler.json')).json());
      console.log(json({ release: resolve(outputOrFlag), digest: manifest.digest, sourceCommit: manifest.sourceCommit,
        worker: p.name, account: p.account_id, routes: p.routes, databases: p.d1_databases,
        sites: JSON.parse(p.vars.SITES), files: manifest.files,
        note: 'Desired configuration only; no cloud diff, deployment or migration performed.' }));
    } else if (action === 'deploy' && path && outputOrFlag === '--approve' && approved && process.argv.length === 6) {
      const command = await deploymentCommand(path, approved);
      // Installation account/environment come from the approved profile only.
      const { CLOUDFLARE_ENV: _, CLOUDFLARE_ACCOUNT_ID: __, ...environment } = process.env;
      const child = Bun.spawn(command, { cwd: await realpath(path), stdin: 'inherit', stdout: 'inherit', stderr: 'inherit',
        env: { ...environment, CI: 'true', WRANGLER_SEND_METRICS: 'false' } });
      process.exitCode = await child.exited;
    } else throw new Error('Usage: prepare <profile.json> <new-release-directory> | deploy <release-directory> --approve <digest>');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Release failed');
    process.exitCode = 1;
  }
}
