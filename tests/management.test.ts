import { test, expect } from 'bun:test';
import { fixture, token, input, site, database } from './helpers.ts';
import { D1Management } from '../src/server/management/d1/repository.ts';
import { criteria, reviewCommand } from '../src/server/management/validation.ts';
import { sites } from '../src/server/config.ts';
const owner = await token({ sub: 'owner', email: 'owner@example.org', name: 'Owner' });
const moderator = await token({ sub: 'moderator', email: 'moderator@example.org', name: 'Moderator' });
const reviewer = { subject: 'owner', email: 'owner@example.org', displayName: 'Owner' };
const makeCommand = (status: string, expectedVersion = 0, latest?: number) => ({ status, expectedVersion, requestId: crypto.randomUUID(), ...(latest ? { expectedLatestContributionId: latest } : {}) });
function post(value: unknown, origin = site.origin): RequestInit { return { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(value) }; }
test('management role matrix protects assets and every feedback/discussion surface, without granting site membership', async () => {
  const f = await fixture();
  try {
    const session = await (await f.call('session', {}, moderator)).json(); expect(session.canManageFeedback).toBe(false); expect(session.canManageDiscussions).toBe(true);
    const feedbackOnly = await token({ sub: 'feedback', email: 'feedback@example.org' });
    expect((await f.call('admin/feedback/query', post({}), feedbackOnly)).status).toBe(200);
    expect((await f.call('admin/discussions/query', post({}), feedbackOnly)).status).toBe(403);
    const shell = await f.call('admin/', {}, owner); expect(shell.status).toBe(200); expect(shell.headers.get('cache-control')).toBe('no-store');
    const html = await shell.text(), asset = html.match(/src="([^"]+)"/)![1]!.replace('/__concourse/', '');
    expect((await f.call(asset, {}, owner)).status).toBe(200);
    for (const identity of [null, await token(), await token({ email: 'outsider@foreign.org' })]) {
      expect((await f.call('admin/', {}, identity)).status).toBe(identity ? 403 : 401);
      expect((await f.call(asset, {}, identity)).status).toBe(identity ? 403 : 401);
    }
    for (const path of ['query', 'summary', '1/triage']) expect((await f.call('admin/feedback/' + path, post({}), moderator)).status).toBe(403);
    for (const path of ['1', '1/history']) expect((await f.call('admin/feedback/' + path, {}, moderator)).status).toBe(403);
    expect((await f.call('admin/discussions/query', post({}), moderator)).status).toBe(200);
    expect((await f.call('admin/discussions/query', post({ site: 'second' }), owner)).status).toBe(400);
    expect((await f.call('admin/feedback/query', post({}, 'https://evil.example'), owner)).status).toBe(403);
    expect((await f.call('admin/feedback/query', post({}), await token({ exp: 0 }))).status).toBe(401);
    expect((await f.call('admin/feedback/query', post({}), await token({ aud: 'second-aud' }))).status).toBe(401);
    expect((await f.call('admin/assets/not-in-manifest.js', {}, owner)).status).toBe(404);
    expect((await f.call('admin/feedback/query?extra=x', post({}), owner)).status).toBe(400);
    expect((await f.call('login?return=%2F__concourse%2Fadmin%2F', {}, owner)).status).toBe(303);
    expect(() => sites(JSON.stringify([{ ...site, moderators: ['*@example.org'] }]))).toThrow();
  } finally { f.db.close(); }
});
test('full-result feedback queries combine filters, exact FTS terms, safe orders, coherent counts and query-bound cursors', async () => {
  const f = await fixture(), repository = new D1Management(f.connection);
  try {
    for (let n = 0; n < 63; n++) await f.call('feedback', post({ ...input({ body: n % 2 ? 'Café login failure' : 'Draft preview question', resource: n < 40 ? 'guide.md' : 'hosting.md' }), kind: n % 2 ? 'problem' : 'question' }));
    const q = criteria({ q: 'cafe', filters: { kinds: ['problem'], resource: 'guide.md' }, limit: 7 }, 'feedback');
    const first = await repository.query(site.id, 'feedback', q); expect(first.matchedCount).toBe(20); expect(first.items).toHaveLength(7);
    expect(first.items.every(i => i.kind === 'problem')).toBe(true);
    const summary = await repository.summary(site.id, 'feedback', q); expect(summary.total).toBe(20); expect(summary.statusCounts.new).toBe(20); expect(summary.kindCounts?.problem).toBe(20);
    const ids = first.items.map(r => r.id); let cursor = first.nextCursor;
    await f.call('feedback', post({ ...input({ body: 'Café login failure', resource: 'guide.md' }), kind: 'problem' }));
    while (cursor) { const p = await repository.query(site.id, 'feedback', { ...q, cursor }); ids.push(...p.items.map(r => r.id)); cursor = p.nextCursor; }
    expect(ids).toHaveLength(20); expect(new Set(ids).size).toBe(20); expect(ids).toEqual([...ids].sort((a, b) => b - a));
    await expect(repository.query(site.id, 'feedback', { ...q, sort: 'oldest', cursor: first.nextCursor! })).rejects.toMatchObject({ status: 400 });
    await expect(repository.query('second', 'feedback', { ...q, cursor: first.nextCursor! })).rejects.toMatchObject({ status: 400 });
    expect((await repository.query(site.id, 'feedback', criteria({ q: 'caf' }, 'feedback'))).matchedCount).toBe(0);
    expect((await repository.query(site.id, 'feedback', criteria({ q: 'login" OR' }, 'feedback'))).matchedCount).toBe(0);
    const oldest = await repository.query(site.id, 'feedback', criteria({ sort: 'oldest' }, 'feedback')); expect(oldest.items[0]!.id).toBe(1);
    const kinds = await repository.query(site.id, 'feedback', criteria({ sort: 'kind' }, 'feedback')); expect(kinds.items[0]!.kind).toBe('problem');
    expect(JSON.stringify(first)).not.toContain('person-1'); expect(JSON.stringify(first)).not.toContain('mira@example.org');
    expect((await repository.query('second', 'feedback', criteria({}, 'feedback'))).items).toHaveLength(0);
  } finally { f.db.close(); }
});
test('thread ancestry and reply-only search count each root once; continuation freezes contribution order and matching', async () => {
  const f = await fixture(), r = new D1Management(f.connection);
  try {
    for (let n = 0; n < 4; n++) await f.post(input({ body: 'Root ' + n }));
    await f.post(input({ body: 'A volume response', parentId: 1 }));
    await f.post(input({ body: 'Another volume detail', parentId: 5 }));
    const match = await r.query(site.id, 'discussions', criteria({ q: 'volume' }, 'discussions'));
    expect(match.items.map(v => v.id)).toEqual([1]); expect(match.items[0]!.replyCount).toBe(2);
    const count = await r.summary(site.id, 'discussions', criteria({}, 'discussions')); expect(count.threadCount).toBe(4); expect(count.contributionCount).toBe(6);
    const q = criteria({ limit: 2 }, 'discussions'), first = await r.query(site.id, 'discussions', q);
    const unseen = first.items.some(v => v.id === 2) ? 3 : 2;
    await f.post(input({ body: 'New late activity', parentId: unseen }));
    const second = await r.query(site.id, 'discussions', { ...q, cursor: first.nextCursor! });
    expect(new Set([...first.items, ...second.items].map(v => v.id)).size).toBe(4);
    expect(second.items.find(v => v.id === unseen)?.replyCount ?? 0).toBe(0);
    const detail = await r.detail(site.id, 'discussions', 1); expect(detail.replies.map(v => v.parentId)).toEqual([1, 5]);
    expect(detail.original.body).toBe('Root 0');
    await expect(r.detail(site.id, 'discussions', 5)).rejects.toMatchObject({ status: 404 });
  } finally { f.db.close(); }
});
test('review writes are versioned, retry-safe after later changes and atomic with projection failure', async () => {
  const f = await fixture();
  try {
    await f.call('feedback', post({ ...input(), kind: 'question' }));
    const command = makeCommand('in_review');
    const send = (v: unknown) => f.call('admin/feedback/1/triage', post(v), owner);
    const results = await Promise.all([send(command), send(command)]); expect(results.map(v => v.status).sort()).toEqual([200, 201]);
    expect((await send(makeCommand('closed', 1))).status).toBe(201);
    const replay = await send(command); expect(replay.status).toBe(200); expect((await replay.json()).receipt.version).toBe(1);
    expect((await send({ ...command, status: 'closed' })).status).toBe(409);
    expect((await send(makeCommand('new', 0))).status).toBe(409);
    expect((await send(makeCommand('closed', 2))).status).toBe(201);
    f.db.exec("CREATE TRIGGER reject_head BEFORE UPDATE ON review_heads BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;");
    expect((await send(makeCommand('new', 3))).status).toBe(503);
    expect((f.db.query('SELECT count(*) n FROM review_events').get() as { n: number }).n).toBe(3);
    expect((f.db.query('SELECT version FROM review_heads').get() as { version: number }).version).toBe(3);
  } finally { f.db.close(); }
});
test('both reply/resolve interleavings reject unseen activity or reopen once, preserving reader compatibility', async () => {
  const f = await fixture();
  try {
    await f.post(input()); const resolve = (v: unknown) => f.call('admin/discussions/1/review', post(v), moderator);
    const first = makeCommand('resolved', 0, 1); expect((await resolve(first)).status).toBe(201);
    const reply = input({ parentId: 1, body: 'A new reply reopens this.' }); await f.post(reply); await f.post(reply);
    const d = await (await f.call('admin/discussions/1', {}, moderator)).json(); expect(d.status).toBe('open'); expect(d.version).toBe(2);
    expect(d.history[0].cause).toBe('reply'); expect(d.history[0].commentId).toBe(2); expect(d.history[0].actor).toBe('Mira');
    const stale = await resolve(makeCommand('resolved', 2, 1)); expect(stale.status).toBe(409); expect((await stale.json()).code).toBe('activity_conflict');
    expect((await resolve(first)).status).toBe(200); // Historical acknowledgement must not resolve it again.
    const state = await (await f.call('comments?resource=reference%2Fkeys.md&anchor=equality')).json();
    expect(state.threadStates).toEqual([{ threadId: 1, status: 'open', version: 2 }]); expect(state.comments[1].threadId).toBe(1);
    expect(JSON.stringify(state)).not.toContain('history'); expect(JSON.stringify(state)).not.toContain('subject');
    expect((await resolve(makeCommand('resolved', 2, 2))).status).toBe(201);
    await f.post(input({ parentId: 2, body: 'Grandchild also reopens.' }));
    expect((await (await f.call('admin/discussions/1', {}, moderator)).json()).version).toBe(4);
  } finally { f.db.close(); }
});
test('strict query/command validation bounds terms, dates, fields, states and cursor shapes', () => {
  for (const body of [{ q: '!' }, { q: 'x '.repeat(9) }, { q: 'a'.repeat(201) }, { filters: { anchor: 'x' } }, { filters: { statuses: ['open'] } }, { filters: { createdFrom: '2026-02-30T00:00:00Z' } }, { filters: { createdFrom: '2026-11-02T00:00:00Z', createdTo: '2026-11-01T00:00:00Z' } }, { limit: 101 }, { sort: 'id; DROP' }, { role: 'admin' }]) expect(() => criteria(body, 'feedback')).toThrow();
  expect(criteria({ q: ' Ｃａｆｅ  login ' }, 'feedback').q).toBe('Cafe login');
  expect(() => reviewCommand(makeCommand('resolved'), 'discussions')).toThrow();
  expect(() => reviewCommand(makeCommand('open'), 'feedback')).toThrow();
});
test('migration backfills existing data; canonical restore and projection rebuild preserve queries and review heads', async () => {
  const f = await fixture(), restore = database();
  try {
    await f.call('feedback', post({ ...input({ body: 'Synthetic restore corpus' }), kind: 'problem' }));
    await f.post(input()); await f.post(input({ parentId: 1, body: 'Synthetic search reply' }));
    const r = new D1Management(f.connection); await r.review(site.id, 'feedback', 1, reviewer, reviewCommand(makeCommand('closed'), 'feedback'));
    for (const n of ['0001_comments', '0002_feedback', '0003_management']) restore.db.exec(await Bun.file(`migrations/${n}.sql`).text());
    for (const table of ['feedback', 'comments', 'review_events']) {
      const rows = f.db.query(`SELECT * FROM ${table} ORDER BY id`).all() as Record<string, unknown>[];
      for (const row of rows) restore.db.query(`INSERT INTO ${table}(${Object.keys(row).join(',')}) VALUES(${Object.keys(row).map(() => '?').join(',')})`).run(...Object.values(row) as never[]);
    }
    restore.db.exec(await Bun.file('operations/rebuild-management.sql').text());
    const restored = new D1Management(restore.connection), q = criteria({ q: 'synthetic' }, 'feedback');
    expect((await restored.query(site.id, 'feedback', q)).items).toEqual((await r.query(site.id, 'feedback', q)).items);
    expect(await restored.detail(site.id, 'discussions', 1)).toEqual(await r.detail(site.id, 'discussions', 1));
    const old = database(); try {
      old.db.exec(await Bun.file('migrations/0001_comments.sql').text()); old.db.exec(await Bun.file('migrations/0002_feedback.sql').text());
      await old.store.add(site.id, reviewer, input()); await old.store.add(site.id, reviewer, input({ parentId: 1 }));
      old.db.exec(await Bun.file('migrations/0003_management.sql').text());
      expect((await new D1Management(old.connection).detail(site.id, 'discussions', 1)).replies).toHaveLength(1);
    } finally { old.db.close(); }
  } finally { f.db.close(); restore.db.close(); }
});

test('bounded thread/history pages keep ancestry and never include future review versions in detail', async () => {
  const f = await fixture(), r = new D1Management(f.connection);
  try {
    await f.post(input());
    for (let i = 0; i < 26; i++) await f.post(input({ parentId: 1, body: 'Bounded reply ' + i }));
    for (let i = 0; i < 27; i++) await r.review(site.id, 'discussions', 1, reviewer, { status: i % 2 ? 'open' : 'resolved', expectedVersion: i, expectedLatestContributionId: 27, requestId: crypto.randomUUID() });
    const detail = await r.detail(site.id, 'discussions', 1); expect(detail.history).toHaveLength(20); expect(detail.replies).toHaveLength(20);
    const old = await r.replies(site.id, 1, detail.nextReplies!); expect(old.replies).toHaveLength(6); expect(old.nextReplies).toBeNull();
    expect(new Set([...detail.replies, ...old.replies].map(c => c.id)).size).toBe(26);
    const history = await r.history(site.id, 'discussions', 1, detail.nextHistory!); expect(history.history).toHaveLength(7); expect(history.nextHistory).toBeNull();
    expect(detail.history[0]!.version).toBe(detail.version);
    const response = await f.call('admin/discussions/1/history?beforeVersion=8&extra=1', {}, moderator); expect(response.status).toBe(400);
  } finally { f.db.close(); }
});
