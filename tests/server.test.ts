import { test, expect } from 'bun:test';
import { fixture, input, token, site, resolver } from './helpers.ts';
import { sites } from '../src/server/config.ts';
import { authenticate } from '../src/server/auth.ts';
import { commentInput } from '../src/shared/validation.ts';

test('verified human posts and replies persist without exposing private subject/email @covers US-005-AC1', async () => {
  const f = await fixture(), first = input();
  const result = await f.post(first); expect(result.status).toBe(201);
  const saved = await result.json();
  expect(saved.comment.author).toBe('Mira'); expect(saved.comment.body).toBe(first.body);
  const reply = await f.post(input({ parentId: saved.comment.id }), await token({ sub: 'person-2', name: 'Sol' }));
  expect(reply.status).toBe(201);
  const rows = await f.call('comments?resource=reference%2Fkeys.md&anchor=equality');
  const page = await rows.json(); expect(page.comments).toHaveLength(2);
  expect(page.comments[1].parentId).toBe(saved.comment.id);
  expect(JSON.stringify(page)).not.toContain('mira@example.org');
  expect(JSON.stringify(page)).not.toContain('person-1');
  expect(rows.headers.get('cache-control')).toBe('no-store');
  f.db.close();
});
test('same retry payload is one native row; changed body conflicts @covers US-005-AC4', async () => {
  const f = await fixture(), value = input();
  const results = await Promise.all([f.post(value), f.post(value), f.post(value)]);
  expect(results.map(r => r.status).sort()).toEqual([200,200,201]);
  expect((f.db.query('SELECT count(*) AS n FROM comments').get() as { n: number }).n).toBe(1);
  const changed = await f.post({ ...value, body: 'Changed input' }); expect(changed.status).toBe(409);
  f.db.close();
});
test('unsigned, expired, wrong audience/issuer and service identities deny @covers US-002-AC3', async () => {
  const f = await fixture();
  for (const identity of [null, 'not-a-jwt', await token({ exp: 1 }), await token({ aud: 'wrong' }), await token({ iss: 'https://evil.example' }), await token({ common_name: 'service' }), await token({ email: undefined })]) {
    expect((await f.call('session', {}, identity)).status).toBe(401);
  }
  expect((await f.call('session', {}, await token({ email: 'outsider@elsewhere.org' }))).status).toBe(403);
  f.db.close();
});
test('site origin and audience isolate reads, writes and parents @covers US-003-AC2 @covers US-004-AC3', async () => {
  const f = await fixture();
  const first = await (await f.post(input())).json();
  expect((await f.call('session', {}, await token(), 'https://unknown.example')).status).toBe(404);
  expect((await f.call('session', {}, await token(), 'https://second.example')).status).toBe(401);
  const secondToken = await token({ aud: 'second-aud' });
  const other = await f.call('comments?resource=reference%2Fkeys.md&anchor=equality', {}, secondToken, 'https://second.example');
  expect((await other.json()).comments).toEqual([]);
  expect((await f.post(input({ parentId: first.comment.id }), secondToken, 'https://second.example')).status).toBe(404);
  expect((await f.post(input({ resource: 'another.md', parentId: first.comment.id }))).status).toBe(404);
  f.db.close();
});
test('foreign and missing write origins, author spoofing and size violations deny', async () => {
  const f = await fixture();
  for (const origin of ['https://evil.example', '']) {
    expect((await f.call('comments', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(input()) })).status).toBe(403);
  }
  expect((await f.post({ ...input(), author: 'Admin' })).status).toBe(400);
  expect((await f.post(input({ body: 'x'.repeat(4001) }))).status).toBe(400);
  expect((await f.post(input({ body: 'x'.repeat(17000) }))).status).toBe(413);
  expect((await f.post(input({ body: ' ' }))).status).toBe(400);
  expect((await f.call('comments?resource=a&anchor=b&before=NaN')).status).toBe(400);
  f.db.close();
});
test('revision context survives and keyset pagination returns every row once @covers US-004-AC2', async () => {
  const f = await fixture();
  for (let n = 0; n < 55; n++) expect((await f.post(input({ revision: n ? 'v2' : 'v1' }))).status).toBe(201);
  const first = await (await f.call('comments?resource=reference%2Fkeys.md&anchor=equality')).json();
  expect(first.comments).toHaveLength(50); expect(first.next).toBe(6);
  const second = await (await f.call(`comments?resource=reference%2Fkeys.md&anchor=equality&before=${first.next}`)).json();
  expect(second.comments).toHaveLength(5); expect(second.next).toBeNull(); expect(second.comments[0].revision).toBe('v1');
  expect(new Set([...first.comments, ...second.comments].map(c => c.id)).size).toBe(55);
  f.db.close();
});
test('login redirect stays on site and rejects protocol-relative/open redirects', async () => {
  const f = await fixture();
  expect((await f.call('login?return=%2Fhelix%2Fguide%2F%23section')).headers.get('location')).toBe('https://guide.example/helix/guide/#section');
  for (const target of ['https://evil.example/', '//evil.example/', '/__concourse/login']) {
    expect((await f.call('login?return=' + encodeURIComponent(target))).status).toBe(400);
  }
  f.db.close();
});
test('config has no empty allow-all fallback and identity is not merged by email', async () => {
  expect(sites(JSON.stringify([site]))).toEqual([site]);
  for (const value of ['[]', JSON.stringify([{ ...site, emails: [], domains: [] }]), JSON.stringify([site, site]), JSON.stringify([{ ...site, extra: true }])]) expect(() => sites(value)).toThrow();
  const a = await authenticate(new Request(site.origin, { headers: { 'Cf-Access-Jwt-Assertion': await token() } }), site, resolver);
  const b = await authenticate(new Request(site.origin, { headers: { 'Cf-Access-Jwt-Assertion': await token({ sub: 'another-person' }) } }), site, resolver);
  expect(a.email).toBe(b.email); expect(a.subject).not.toBe(b.subject);
  expect(commentInput(input({ body: ' hi ' })).body).toBe('hi');
});
