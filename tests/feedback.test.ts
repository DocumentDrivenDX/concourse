import { test, expect } from 'bun:test';
import { fixture, input, token, site } from './helpers.ts';
import { sites } from '../src/server/config.ts';
const value = () => { const { parentId: _, ...common } = input(); return { ...common, kind: 'question' }; };
async function setup() {
  const f = await fixture();
  const post = (body: unknown, identity?: string | null, origin = site.origin, headers: Record<string, string> = {}) => f.call('feedback', {
    method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
  }, identity, origin);
  const owner = await token({ sub: 'owner', email: 'owner@example.org', name: 'Owner' });
  return { ...f, send: post, owner };
}
test('feedback is private to configured maintainers; receipts and inbox suppress private identity', async () => {
  const f = await setup(); const result = await f.send(value()); expect(result.status).toBe(201);
  const saved = await result.json(); expect(Object.keys(saved.receipt).sort()).toEqual(['createdAt', 'id']);
  expect((await f.call('feedback')).status).toBe(403);
  expect((await f.call('feedback', {}, null)).status).toBe(401);
  const response = await f.call('feedback', {}, f.owner); const inbox = await response.json();
  expect(inbox.feedback).toHaveLength(1); expect(inbox.feedback[0].kind).toBe('question');
  expect(inbox.feedback[0].author).toBe('Mira'); expect(inbox.feedback[0].resource).toBe('reference/keys.md');
  expect(JSON.stringify(inbox)).not.toContain('person-1'); expect(JSON.stringify(inbox)).not.toContain('mira@example.org');
  expect(response.headers.get('cache-control')).toBe('no-store'); expect(response.headers.get('access-control-allow-origin')).toBeNull();
  expect((await (await f.call('session')).json()).canReviewFeedback).toBe(false);
  expect((await (await f.call('session', {}, f.owner)).json()).canReviewFeedback).toBe(true);
  f.db.close();
});
test('feedback retries commit once, return the same receipt, and reject changed payloads', async () => {
  const f = await setup(), payload = value(); const results = await Promise.all([f.send(payload), f.send(payload), f.send(payload)]);
  expect(results.map(r => r.status).sort()).toEqual([200,200,201]);
  const receipts = await Promise.all(results.map(r => r.json())); expect(receipts[0]).toEqual(receipts[1]); expect(receipts[1]).toEqual(receipts[2]);
  expect((await f.send({ ...payload, body: 'different' })).status).toBe(409);
  expect(f.db.query('SELECT count(*) AS n FROM feedback').get()).toEqual({ n: 1 }); f.db.close();
});
test('feedback denies spoofed roles, invalid fields, origins and expired or foreign identities', async () => {
  const f = await setup();
  for (const extra of [{ author: 'Owner' }, { role: 'maintainer' }, { site: 'other' }, { url: 'https://secret/?token=x' }, { kind: 'issue' }, { body: ' ' }, { body: 'x'.repeat(4001) }]) {
    expect((await f.send({ ...value(), ...extra })).status).toBe(400);
  }
  for (const identity of [null, await token({ exp: 1 }), await token({ aud: 'elsewhere' }), await token({ common_name: 'service' })]) expect((await f.send(value(), identity)).status).toBe(401);
  expect((await f.send(value(), await token({ email: 'outside@elsewhere.org' }))).status).toBe(403);
  expect((await f.send(value(), undefined, site.origin, { origin: 'https://evil.example' })).status).toBe(403);
  expect((await f.send(value(), undefined, site.origin, { 'sec-fetch-site': 'cross-site' })).status).toBe(403);
  expect((await f.send({ ...value(), body: 'x'.repeat(17000) })).status).toBe(413);
  expect((await f.send({ ...value(), anchor: '', quote: '' })).status).toBe(201); f.db.close();
});
test('feedback inbox is bounded, site isolated and requires a valid cursor', async () => {
  const f = await setup();
  for (let n = 0; n < 55; n++) expect((await f.send(value())).status).toBe(201);
  const first = await (await f.call('feedback', {}, f.owner)).json(); expect(first.feedback).toHaveLength(50); expect(first.next).toBe(6);
  const last = await (await f.call(`feedback?before=${first.next}`, {}, f.owner)).json(); expect(last.feedback).toHaveLength(5); expect(last.next).toBeNull();
  expect((await f.call('feedback?before=NaN', {}, f.owner)).status).toBe(400);
  const other = await token({ sub: 'owner', email: 'owner@example.org', aud: 'second-aud' });
  expect((await f.call('feedback', {}, other, 'https://second.example')).status).toBe(403);
  const otherOwner = await token({ email: 'other@example.org', aud: 'second-aud' });
  expect((await (await f.call('feedback', {}, otherOwner, 'https://second.example')).json()).feedback).toEqual([]);
  expect((await f.send(value(), other, 'https://second.example')).status).toBe(201);
  expect((await (await f.call('feedback', {}, otherOwner, 'https://second.example')).json()).feedback).toHaveLength(1);
  expect((await (await f.call('feedback', {}, f.owner)).json()).feedback).toHaveLength(50); f.db.close();
});
test('maintainer config is optional, validates exact addresses and cannot bypass membership', async () => {
  expect(sites(JSON.stringify([site]))[0]?.maintainers).toEqual([]);
  expect(() => sites(JSON.stringify([{ ...site, maintainers: ['*@example.org'] }]))).toThrow();
  expect(() => sites(JSON.stringify([{ ...site, maintainers: ['example.org'] }]))).toThrow();
  const f = await setup(); expect((await f.call('feedback', {}, await token({ email: 'owner@elsewhere.org' }))).status).toBe(403); f.db.close();
});
