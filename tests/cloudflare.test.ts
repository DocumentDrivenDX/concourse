import { test, expect } from 'bun:test';
import { mkdtemp, rm, symlink, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { profile, wranglerConfig, fromWrangler, type Profile } from '../scripts/cloudflare/profile.ts';
import { prepare, verify, deploymentCommand } from '../scripts/cloudflare/release.ts';

function fixture(): Profile {
  return {
    name: 'review-concourse', account_id: 'a'.repeat(32), compatibility_date: '2026-08-06',
    workers_dev: false, preview_urls: false,
    routes: [{ pattern: 'guide.example/__concourse/*', zone_id: 'b'.repeat(32) }],
    vars: { SITES: JSON.stringify([{ id: 'guide', origin: 'https://guide.example', issuer: 'https://test.cloudflareaccess.com', audience: 'test-audience', domains: ['example.org'], emails: [] }]) },
    d1_databases: [{ binding: 'DB', database_name: 'review-comments', database_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' }],
  };
}
test('profile refuses broad/foreign/duplicate routes, alternate origins and executable hooks', async () => {
  expect(fromWrangler(wranglerConfig(profile(fixture())))).toEqual(fixture());
  const cases = [
    { ...fixture(), workers_dev: true }, { ...fixture(), preview_urls: true },
    { ...fixture(), routes: [{ pattern: 'guide.example/*', zone_id: 'b'.repeat(32) }] },
    { ...fixture(), routes: [{ pattern: 'foreign.example/__concourse/*', zone_id: 'b'.repeat(32) }] },
    { ...fixture(), routes: [...fixture().routes, ...fixture().routes] },
    { ...fixture(), build: { command: 'unreviewed-command' } },
    { ...fixture(), env: { production: {} } }, { ...fixture(), account_id: 'REPLACE_ACCOUNT_ID' },
    { ...fixture(), vars: { SITES: '[]' } },
  ];
  for (const value of cases) expect(() => profile(value)).toThrow();
  expect(() => profile(awaitedExample)).toThrow();
});
const awaitedExample = await Bun.file('deploy/cloudflare/profile.example.json').json();

test('release approval binds actual bytes, config, SQL and toolchain; rejects tampering before command creation', async () => {
  const root = await mkdtemp(join(tmpdir(), 'concourse-release-'));
  try {
    const path = join(root, 'profile.json'), release = join(root, 'release');
    await Bun.write(path, JSON.stringify(fixture()));
    const manifest = await prepare(path, release);
    expect((await verify(release, manifest.digest)).digest).toBe(manifest.digest);
    expect(await deploymentCommand(release, manifest.digest)).toContain(join(await realpath(release), 'wrangler.json'));
    await expect(deploymentCommand(release, '')).rejects.toThrow('explicit');
    await expect(deploymentCommand(release, '0'.repeat(64))).rejects.toThrow('approval');
    await expect(prepare(path, release)).rejects.toThrow();
    const worker = await Bun.file(join(release, 'worker.js')).bytes();
    await Bun.write(join(release, 'worker.js'), '// changed');
    await expect(deploymentCommand(release, manifest.digest)).rejects.toThrow('bytes changed');
    await Bun.write(join(release, 'worker.js'), worker);
    await Bun.write(join(release, 'unexpected.txt'), 'extra');
    await expect(deploymentCommand(release, manifest.digest)).rejects.toThrow('file list');
    await rm(join(release, 'unexpected.txt'));
    const sql = await Bun.file(join(release, 'migrations/0001_comments.sql')).bytes();
    await Bun.write(join(release, 'migrations/0001_comments.sql'), '-- changed');
    await expect(deploymentCommand(release, manifest.digest)).rejects.toThrow('bytes changed');
    await Bun.write(join(release, 'migrations/0001_comments.sql'), sql);
    await rm(join(release, 'worker.js'));
    await symlink(join(root, 'profile.json'), join(release, 'worker.js'));
    await expect(deploymentCommand(release, manifest.digest)).rejects.toThrow('symlinks');
  } finally { await rm(root, { recursive: true }); }
});

test('one profile safely routes two sites without granting a wildcard route', () => {
  const p = fixture();
  const configured = JSON.parse(p.vars.SITES);
  configured.push({ ...configured[0], id: 'second', origin: 'https://second.example' });
  p.vars.SITES = JSON.stringify(configured);
  p.routes.push({ pattern: 'second.example/__concourse/*', zone_id: 'b'.repeat(32) });
  expect(profile(p).routes).toHaveLength(2);
  p.routes.pop();
  expect(() => profile(p)).toThrow('Every configured site');
});

test('pinned Wrangler accepts the prepared Worker and bindings in a real offline dry-run', async () => {
  const root = await mkdtemp(join(tmpdir(), 'concourse-wrangler-'));
  try {
    const path = join(root, 'profile.json'), release = join(root, 'release');
    await Bun.write(path, JSON.stringify(fixture()));
    const manifest = await prepare(path, release);
    const command = await deploymentCommand(release, manifest.digest);
    const child = Bun.spawn([...command, '--dry-run', '--outdir', join(root, 'dry-run')], {
      cwd: release, stdout: 'pipe', stderr: 'pipe',
      env: { PATH: process.env.PATH, CI: 'true', WRANGLER_SEND_METRICS: 'false',
        WRANGLER_LOG_PATH: join(root, 'logs'), XDG_CONFIG_HOME: join(root, 'config') },
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
    ]);
    expect({ code, output: stdout + stderr }).toMatchObject({ code: 0 });
    expect(stdout + stderr).toContain('dry-run');
    // Wrangler did not mutate any approved release bytes.
    expect((await verify(release, manifest.digest)).digest).toBe(manifest.digest);
  } finally { await rm(root, { recursive: true }); }
}, 30_000);
