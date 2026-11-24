import { Problem } from '../../../shared/types.ts';
import type { Criteria, Family } from '../../../shared/management.ts';
export interface Cursor { v: 1; site: string; fingerprint: string; upper: number; last: (string | number)[] }
export async function fingerprint(family: Family, query: Criteria): Promise<string> {
  const filters = Object.fromEntries(Object.entries(query.filters).sort(([a], [b]) => a.localeCompare(b)));
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([family, query.q, filters, query.sort, query.limit])));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
export function decode(raw: string, site: string, hash: string, arity: number): Cursor {
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(raw)) throw new Error();
    const c = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(raw.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0)))) as Cursor;
    if (c.v !== 1 || c.site !== site || c.fingerprint !== hash || !Number.isSafeInteger(c.upper) || c.upper < 0 || !Array.isArray(c.last) || c.last.length !== arity) throw new Error();
    if (Object.keys(c).sort().join(',') !== 'fingerprint,last,site,upper,v') throw new Error();
    if (!validLast(c.last, c.upper)) throw new Error();
    return c;
  } catch { throw new Problem(400, 'Invalid cursor'); }
}
export function encode(cursor: Cursor): string { return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(cursor)))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, ''); }
export function order(family: Family, query: Criteria): { fields: string[]; direction: string[]; sql: string } {
  let fields = ['created_at', 'id'], direction = query.sort === 'oldest' ? ['ASC', 'ASC'] : ['DESC', 'DESC'];
  if (query.sort === 'kind') { fields = ['kind', 'created_at', 'id']; direction = ['ASC', 'DESC', 'DESC']; }
  if (family === 'discussions' && query.sort === 'activity') fields = ['last_activity_at', 'id'];
  return { fields, direction, sql: fields.map((f, i) => `${f} ${direction[i]}`).join(',') };
}
export function continuation(fields: string[], direction: string[], last: Cursor['last']): { sql: string; args: (string | number)[] } {
  const args: (string | number)[] = [];
  const predicates = fields.map((f, i) => {
    const prefix = fields.slice(0, i).map((p, j) => { args.push(last[j]!); return `${p}=?`; });
    args.push(last[i]!); return `(${[...prefix, `${f}${direction[i] === 'ASC' ? '>' : '<'}?`].join(' AND ')})`;
  });
  return { sql: predicates.join(' OR '), args };
}
export function matched(site: string, family: Family, query: Criteria, upper: number): { sql: string; args: (string | number)[] } {
  const args: (string | number)[] = [site, upper];
  const feedback = family === 'feedback';
  const base = feedback ? `SELECT f.*,COALESCE(h.status,'new') status,COALESCE(h.version,0) version
    FROM feedback f LEFT JOIN review_heads h ON h.site=f.site AND h.family='feedback' AND h.target_id=f.id WHERE f.site=? AND f.id<=?`
    : `SELECT c.*,COALESCE(h.status,'open') status,COALESCE(h.version,0) version,
      (SELECT max(x.created_at) FROM comments x JOIN thread_members m ON m.comment_id=x.id WHERE m.site=c.site AND m.root_id=c.id AND x.id<=?) last_activity_at,
      (SELECT max(m.comment_id) FROM thread_members m WHERE m.site=c.site AND m.root_id=c.id AND m.comment_id<=?) latest_contribution_id,
      (SELECT count(*)-1 FROM thread_members m WHERE m.site=c.site AND m.root_id=c.id AND m.comment_id<=?) reply_count
    FROM comments c LEFT JOIN review_heads h ON h.site=c.site AND h.family='discussions' AND h.target_id=c.id WHERE c.site=? AND c.id<=? AND c.parent_id IS NULL`;
  if (!feedback) args.unshift(upper, upper, upper);
  const predicates: string[] = [];
  addFilters(query, predicates, args, feedback);
  if (query.q) {
    const phrase = query.q.split(' ').map(chunk => '"' + chunk.replaceAll('"', '""') + '"').join(' AND ');
    predicates.push(feedback ? 'id IN (SELECT rowid FROM feedback_search WHERE feedback_search MATCH ?)'
      : 'id IN (SELECT m.root_id FROM comment_search s JOIN thread_members m ON m.comment_id=s.rowid WHERE comment_search MATCH ? AND m.site=? AND m.comment_id<=?)');
    args.push(phrase); if (!feedback) args.push(site, upper);
  }
  return { sql: `WITH base AS (${base}), matched AS (SELECT * FROM base${predicates.length ? ' WHERE ' + predicates.join(' AND ') : ''})`, args };
}
function addFilters(query: Criteria, predicates: string[], args: (string | number)[], feedback: boolean): void {
  for (const [key, val] of Object.entries(query.filters)) {
    if (Array.isArray(val)) {
      if (val.length) { predicates.push(`${key === 'statuses' ? 'status' : 'kind'} IN (${val.map(() => '?').join(',')})`); args.push(...val); }
    } else { predicates.push(scalarFilter(key, feedback)); args.push(val); }
  }
}

function scalarFilter(key: string, feedback: boolean): string {
  if (key === 'resource' || key === 'anchor') return `${key}=?`;
  return `${feedback ? 'created_at' : 'last_activity_at'}${key.endsWith('From') ? '>=' : '<'}?`;
}

function validLast(last: Cursor['last'], upper: number): boolean {
  const id = last.at(-1), created = last.at(-2);
  if (!Number.isSafeInteger(id) || Number(id) < 1 || Number(id) > upper) return false;
  if (typeof created !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(created) || !Number.isFinite(Date.parse(created))) return false;
  return last.length !== 3 || ['question', 'problem', 'suggestion'].includes(String(last[0]));
}
