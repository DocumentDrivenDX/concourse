import { test, expect } from 'bun:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isAccessChallenge } from '../src/cli/check-access.ts';
import { violations } from '../scripts/check-boundaries.ts';
test('challenge requires an actual Access HTTPS login host, not a substring @covers US-001-AC1', () => {
  expect(isAccessChallenge(new Response(null, { status: 302, headers: { location: 'https://team.cloudflareaccess.com/cdn-cgi/access/login/guide.example' } }))).toBe(true);
  for (const location of ['https://evil.example/?x=cloudflareaccess.com', 'https://team.cloudflareaccess.com.evil.example/cdn-cgi/access/login/a', 'http://team.cloudflareaccess.com/cdn-cgi/access/login/a', 'https://team.cloudflareaccess.com/not-login']) {
    expect(isAccessChallenge(new Response(null, { status: 302, headers: { location } }))).toBe(false);
  }
  expect(isAccessChallenge(new Response('Public content', { status: 200 }))).toBe(false);
});
test('generic protection covers origin wildcard and custom domain with no incumbent names @covers US-001-AC2', async () => {
  const source = await Bun.file('infra/protected-publication/main.tf').text();
  expect(source).toContain('*.${var.pages_project}.pages.dev'); expect(source).toContain('${var.hostname}');
  expect(source).toMatch(/depends_on\s*=\s*\[cloudflare_zero_trust_access_application.site\]/);
  expect(source.toLowerCase()).not.toMatch(/entropy|synaptiq|playbooks/);
});
test('module boundary gate rejects a real forbidden import negative control', async () => {
  expect(await violations(process.cwd())).toEqual([]);
  const root = await mkdtemp(join(tmpdir(), 'concourse-boundary-'));
  try {
    await mkdir(join(root, 'src/browser'), { recursive: true });
    await writeFile(join(root, 'src/browser/bad.ts'), "import { store } from '../server/store.ts';");
    expect(await violations(root)).toHaveLength(1);
  } finally { await rm(root, { recursive: true }); }
});
