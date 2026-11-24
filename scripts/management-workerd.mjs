import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { statements } from './migration-statements.mjs';
export async function managementProof({ mf, db, identity, site, sql }) {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  async function call(path, body) {
    const r = await mf.dispatchFetch(site.origin + '/__concourse/' + path, { method: body ? 'POST' : 'GET',
      headers: { 'Cf-Access-Jwt-Assertion': identity, 'content-type': 'application/json', origin: site.origin }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const value = await r.json(); return { status: r.status, value };
  }
  const query = (family, body = {}) => call('admin/' + family + '/query', body);
  const command = (status, version, latest) => ({ status, expectedVersion: version, requestId: randomUUID(), ...(latest ? { expectedLatestContributionId: latest } : {}) });
  const resolve = command('resolved', 0, 1);
  assert((await call('admin/discussions/1/review', resolve)).status === 201, 'D1 resolution failed');
  const reply = { resource: 'reference/keys.md', anchor: 'equality', revision: 'v2', quote: '', body: 'Volume reply only', parentId: 1, requestId: randomUUID() };
  assert((await call('comments', reply)).status === 201, 'D1 reply failed');
  assert((await call('comments', reply)).status === 200, 'D1 reply replay failed');
  const d = await call('admin/discussions/1');
  assert(d.value.status === 'open' && d.value.version === 2, 'D1 reply did not reopen once');
  const stale = await call('admin/discussions/1/review', command('resolved', 2, 1));
  assert(stale.status === 409 && stale.value.code === 'activity_conflict', 'D1 unseen reply was resolved');
  assert((await call('admin/discussions/1/review', resolve)).status === 200, 'D1 historical command replay');
  const results = await query('discussions', { q: 'volume' });
  assert(results.status === 200 && results.value.matchedCount === 1, 'D1 reply FTS failed');
  const first = command('in_review', 0), same = await Promise.all([call('admin/feedback/1/triage', first), call('admin/feedback/1/triage', first)]);
  assert(same.map(x => x.status).sort().join(',') === '200,201', 'D1 concurrent replay mismatch');
  assert((await call('admin/feedback/1/triage', command('closed', 1))).status === 201, 'D1 triage follow-up');
  assert((await call('admin/feedback/1/triage', first)).value.receipt.version === 1, 'D1 receipt was replaced');
  assert((await call('admin/discussions/1/review', command('resolved', 2, d.value.latestContributionId))).status === 201, 'D1 resolution before rollback case');
  await db.prepare("CREATE TRIGGER reject_head BEFORE UPDATE ON review_heads BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;").run();
  const failed = await call('admin/feedback/1/triage', command('new', 2)); assert(failed.status === 503, 'D1 trigger failure not surfaced');
  assert((await db.prepare("SELECT count(*) n FROM review_events WHERE family='feedback'").first()).n === 2, 'D1 failed trigger leaked event');
  const failedReply = { ...reply, body: 'Rollback contribution', requestId: randomUUID() };
  assert((await call('comments', failedReply)).status === 503, 'D1 comment projection failure not surfaced');
  assert((await db.prepare('SELECT count(*) n FROM comments').first()).n === 2, 'D1 failed comment leaked canonical row');
  assert((await db.prepare("SELECT count(*) n FROM comment_search WHERE comment_search MATCH 'rollback'").first()).n === 0, 'D1 failed comment leaked FTS row');
  assert((await db.prepare('SELECT count(*) n FROM thread_members').first()).n === 2, 'D1 failed comment leaked ancestry');
  await db.prepare('DROP TRIGGER reject_head').run();
  assert((await call('comments', failedReply)).status === 201, 'D1 failed comment retry could not commit');
  const summary = await call('admin/discussions/summary', {});
  assert(summary.value.threadCount === 1 && summary.value.contributionCount === 3, 'D1 summary units wrong');
  // Qualify canonical-only export/reimport and projection rebuild on a separate local D1 binding.
  const restore = await mf.getD1Database('RESTORE');
  for (const statement of statements(sql)) await restore.prepare(statement).run();
  for (const table of ['feedback', 'comments', 'review_events']) {
    const rows = (await db.prepare(`SELECT * FROM ${table} ORDER BY id`).all()).results;
    for (const row of rows) await restore.prepare(`INSERT INTO ${table}(${Object.keys(row).join(',')}) VALUES(${Object.keys(row).map(() => '?').join(',')})`).bind(...Object.values(row)).run();
  }
  for (const statement of statements(await readFile('operations/rebuild-management.sql', 'utf8'))) await restore.prepare(statement).run();
  const heads = (await db.prepare('SELECT * FROM review_heads ORDER BY site,family,target_id').all()).results;
  assert(JSON.stringify(heads) === JSON.stringify((await restore.prepare('SELECT * FROM review_heads ORDER BY site,family,target_id').all()).results), 'D1 restored heads mismatch');
  assert((await restore.prepare("SELECT count(*) n FROM comment_search WHERE comment_search MATCH 'volume'").first()).n === 1, 'D1 restored FTS mismatch');
  // Local synthetic scale probe: real application queries, no production traffic/data.
  for (const table of ['feedback', 'comments']) {
    const extraColumns = table === 'feedback' ? ',kind' : '';
    const extraValues = table === 'feedback' ? ",'problem'" : '';
    await db.prepare(`WITH RECURSIVE n(v) AS (SELECT 1 UNION ALL SELECT v+1 FROM n WHERE v<10000)
      INSERT INTO ${table}(site,subject,request_id,payload,resource,anchor,revision,quote,body,author,created_at${extraColumns})
      SELECT ?,'scale','seed-'||v,'{}','scale.md','scale','v1','','Synthetic scale search '||v,'Sample contributor','2026-01-01T00:00:00.000Z'${extraValues} FROM n`).bind(site.id).run();
  }
  const timings = {};
  for (const family of ['feedback', 'discussions']) {
    const start = performance.now(), response = await query(family, { q: 'scale', filters: { resource: 'scale.md' } });
    assert(response.status === 200 && response.value.matchedCount === 10000, 'D1 scale corpus mismatch');
    timings[family] = Math.round(performance.now() - start);
  }
  const probe = await db.prepare("SELECT rowid FROM comment_search WHERE comment_search MATCH 'scale' LIMIT 25").all();
  const plan = await db.prepare('EXPLAIN QUERY PLAN SELECT comment_id FROM thread_members WHERE site=? AND root_id=? AND comment_id<=?').bind(site.id, 1, 10000).all();
  assert(JSON.stringify(plan.results).includes('thread_roots'), 'Thread ancestry index not selected');
  await mkdir('test-results', { recursive: true });
  await writeFile('test-results/management-workerd.json', JSON.stringify({ passed: true, scope: 'Production bundle on local workerd/D1; not remote D1 or Google acceptance',
    assertions: ['reply-only FTS', 'guarded resolve/reply interleavings', 'same-key concurrent replay', 'projection failure rollback', 'isolated canonical restore/rebuild', '10000 feedback and 10000 root-comment query corpus'],
    scale: { recordsPerFamily: 10000, endToEndQueryMs: timings, ftsProbeRowsRead: probe.meta.rows_read, note: 'FTS probe rows read is not the full application query; local timings do not establish cloud cost/latency budgets' } }, null, 2) + '\n');
  console.log('Management local D1 proof passed: FTS, review/reply races, replay, rollback, canonical restore/rebuild');
}
