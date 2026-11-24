import { Problem } from '../../../shared/types.ts';
import type { Criteria, Family, ReviewDetail, Summary } from '../../../shared/management.ts';
import type { Connection } from '../../store.ts';
import { matched, order, fingerprint, decode, encode, continuation } from './query.ts';
import { comment, feedback, item, event, type EventRow, type Row } from './records.ts';
export class Reads {
  constructor(protected db: Connection) {}
  async upper(site: string, family: Family): Promise<number> {
    const r = await this.db.prepare(`SELECT COALESCE(max(id),0) n FROM ${family === 'feedback' ? 'feedback' : 'comments'} WHERE site=?`).bind(site).first<{ n: number }>();
    return r!.n;
  }
  async query(site: string, family: Family, criteria: Criteria) {
    const hash = await fingerprint(family, criteria), sort = order(family, criteria);
    const cursor = criteria.cursor ? decode(criteria.cursor, site, hash, sort.fields.length) : null;
    const upper = cursor?.upper ?? await this.upper(site, family), base = matched(site, family, criteria, upper);
    const after = cursor ? continuation(sort.fields, sort.direction, cursor.last) : null;
    // One statement observes count and result page at the same read point.
    const r = await this.db.prepare(`${base.sql} SELECT (SELECT count(*) FROM matched) n,
      (SELECT json_group_array(json_object(${rowJson(family)})) FROM
        (SELECT * FROM matched ${after ? 'WHERE ' + after.sql : ''} ORDER BY ${sort.sql} LIMIT ?)) items`)
      .bind(...base.args, ...(after?.args ?? []), criteria.limit + 1).first<{ n: number; items: string }>();
    const rows = JSON.parse(r!.items) as Row[], more = rows.length > criteria.limit, page = rows.slice(0, criteria.limit), last = page.at(-1);
    return { items: page.map(row => item(row, family === 'discussions')), matchedCount: r!.n, upperId: upper, observedAt: new Date().toISOString(),
      nextCursor: more && last ? encode({ v: 1, site, fingerprint: hash, upper, last: sort.fields.map(f => (last as unknown as Record<string, string | number>)[f]!) }) : null };
  }
  async summary(site: string, family: Family, criteria: Criteria): Promise<Summary> {
    const base = matched(site, family, criteria, await this.upper(site, family));
    const status = family === 'feedback' ? ['new', 'in_review', 'closed'] : ['open', 'resolved'];
    const expressions = status.map(s => `COALESCE(sum(status='${s}'),0) '${s}'`);
    if (family === 'feedback') expressions.push(...['question', 'problem', 'suggestion'].map(s => `COALESCE(sum(kind='${s}'),0) '${s}'`), "min(CASE WHEN status='new' THEN created_at END) oldest");
    else expressions.push('COALESCE(sum(reply_count+1),0) contributions');
    const r = await this.db.prepare(`${base.sql} SELECT count(*) n,${expressions.join(',')} FROM matched`).bind(...base.args).first<Record<string, number | string | null>>();
    const common = { statusCounts: Object.fromEntries(status.map(s => [s, Number(r![s])])), observedAt: new Date().toISOString() };
    return family === 'feedback' ? { ...common, total: Number(r!.n), kindCounts: Object.fromEntries(['question', 'problem', 'suggestion'].map(k => [k, Number(r![k])])), oldestNewCreatedAt: r!.oldest as string | null }
      : { ...common, threadCount: Number(r!.n), contributionCount: Number(r!.contributions) };
  }
  async original(site: string, family: Family, id: number): Promise<Row> {
    const table = family === 'feedback' ? 'feedback' : 'comments';
    const r = await this.db.prepare(`SELECT t.*,${family === 'discussions' ? '(SELECT max(comment_id) FROM thread_members WHERE site=t.site AND root_id=t.id) latest_contribution_id,' : ''}COALESCE(h.status,?) status,COALESCE(h.version,0) version FROM ${table} t
      LEFT JOIN review_heads h ON h.site=t.site AND h.family=? AND h.target_id=t.id WHERE t.site=? AND t.id=? ${family === 'discussions' ? 'AND t.parent_id IS NULL' : ''}`)
      .bind(family === 'feedback' ? 'new' : 'open', family, site, id).first<Row>();
    if (!r) throw new Problem(404, 'Unknown item');
    return r;
  }
  async latest(site: string, id: number): Promise<number> {
    const r = await this.db.prepare('SELECT max(comment_id) n FROM thread_members WHERE site=? AND root_id=?').bind(site, id).first<{ n: number }>();
    return r!.n;
  }
  async detail(site: string, family: Family, id: number): Promise<ReviewDetail> {
    const r = await this.original(site, family, id), history = await this.history(site, family, id, r.version + 1);
    const replies = family === 'discussions' ? await this.replies(site, id, Number.MAX_SAFE_INTEGER, r.latest_contribution_id) : { replies: [], nextReplies: null };
    return { original: family === 'feedback' ? feedback(r) : comment(r, id), status: r.status, version: r.version,
      ...(family === 'discussions' ? { latestContributionId: r.latest_contribution_id } : {}), ...replies, ...history };
  }
  async history(site: string, family: Family, id: number, before = Number.MAX_SAFE_INTEGER) {
    await this.original(site, family, id);
    const r = await this.db.prepare('SELECT * FROM review_events WHERE site=? AND family=? AND target_id=? AND version<? ORDER BY version DESC LIMIT 21')
      .bind(site, family, id, before).all<EventRow>();
    const page = r.results.slice(0, 20);
    return { history: page.map(event), nextHistory: r.results.length > 20 ? page.at(-1)!.version : null };
  }
  async replies(site: string, id: number, before = Number.MAX_SAFE_INTEGER, through = Number.MAX_SAFE_INTEGER) {
    await this.original(site, 'discussions', id);
    const r = await this.db.prepare('SELECT c.* FROM comments c JOIN thread_members m ON m.comment_id=c.id WHERE m.site=? AND m.root_id=? AND c.id<>? AND c.id<? AND c.id<=? ORDER BY c.id DESC LIMIT 21')
      .bind(site, id, id, before, through).all<Row>();
    const page = r.results.slice(0, 20);
    return { replies: page.reverse().map(r => comment(r, id)), nextReplies: r.results.length > 20 ? page[0]!.id : null };
  }
}
function rowJson(family: Family): string {
  const fields = ['id', 'resource', 'anchor', 'revision', 'body', 'author', 'created_at', 'status', 'version', ...(family === 'feedback' ? ['kind'] : ['last_activity_at', 'latest_contribution_id', 'reply_count'])];
  return fields.map(f => `'${f}',${f}`).join(',');
}
