import { Problem } from '../../shared/types.ts';
import { object, text, integer } from '../../shared/validation.ts';
import type { Criteria, Family, ReviewCommand, ReviewStatus } from '../../shared/management.ts';
export const statuses = (family: Family): string[] => family === 'feedback' ? ['new', 'in_review', 'closed'] : ['open', 'resolved'];
export function keys(v: Record<string, unknown>, allowed: string[]): void {
  if (Object.keys(v).some(k => !allowed.includes(k))) throw new Problem(400, 'Unknown field');
}
export function search(value: unknown): string {
  if (value === undefined) return '';
  const result = text(value, 200, true).normalize('NFKC').trim().replace(/\s+/gu, ' ');
  if ([...result].length > 200) throw new Problem(400, 'Search too long');
  const chunks = result ? result.split(' ') : [];
  if (chunks.length > 8 || chunks.some(s => [...s].length > 64 || !/[\p{L}\p{N}]/u.test(s))) throw new Problem(400, 'Invalid search');
  return result;
}
function array(value: unknown, allowed: string[]): string[] {
  if (!Array.isArray(value) || value.length > allowed.length || value.some(v => typeof v !== 'string' || !allowed.includes(v)) || new Set(value).size !== value.length) throw new Problem(400, 'Invalid filter');
  return [...value].sort();
}
function date(value: unknown): string {
  const raw = text(value, 40);
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(raw) || !Number.isFinite(Date.parse(raw))) throw new Problem(400, 'Invalid UTC date');
  const normalized = new Date(raw).toISOString();
  if (normalized.slice(0, 19) !== raw.slice(0, 19)) throw new Problem(400, 'Invalid UTC date');
  return normalized;
}
function filters(value: unknown, family: Family): Criteria['filters'] {
  const v = value === undefined ? {} : object(value), result: Criteria['filters'] = {};
  const prefix = family === 'feedback' ? 'created' : 'activity';
  keys(v, ['statuses', 'resource', 'anchor', `${prefix}From`, `${prefix}To`, ...(family === 'feedback' ? ['kinds'] : [])]);
  for (const [key, val] of Object.entries(v)) {
    result[key] = filterValue(key, val, family);
  }
  if ('anchor' in result && !result.resource) throw new Problem(400, 'Anchor requires resource');
  const from = result[`${prefix}From`], to = result[`${prefix}To`];
  if (from && to && from >= to) throw new Problem(400, 'Invalid date range');
  return result;
}
export function criteria(value: unknown, family: Family, summary = false): Criteria {
  const v = object(value); keys(v, summary ? ['q', 'filters'] : ['q', 'filters', 'sort', 'limit', 'cursor']);
  const sort = v.sort === undefined ? family === 'feedback' ? 'newest' : 'activity' : text(v.sort, 16);
  if (!['newest', 'oldest', family === 'feedback' ? 'kind' : 'activity'].includes(sort)) throw new Problem(400, 'Invalid order');
  const limit = v.limit === undefined ? 25 : integer(v.limit);
  if (limit > 100) throw new Problem(400, 'Invalid limit');
  return { q: search(v.q), filters: filters(v.filters, family), sort, limit,
    ...(v.cursor === undefined ? {} : { cursor: text(v.cursor, 2048) }) };
}
export function reviewCommand(value: unknown, family: Family): ReviewCommand {
  const v = object(value); keys(v, ['status', 'expectedVersion', 'requestId', ...(family === 'discussions' ? ['expectedLatestContributionId'] : [])]);
  if (!statuses(family).includes(String(v.status))) throw new Problem(400, 'Invalid status');
  if (!Number.isSafeInteger(v.expectedVersion) || Number(v.expectedVersion) < 0 || Number(v.expectedVersion) >= Number.MAX_SAFE_INTEGER) throw new Problem(400, 'Invalid version');
  const requestId = text(v.requestId, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) throw new Problem(400, 'Invalid retry key');
  return { status: v.status as ReviewStatus, expectedVersion: Number(v.expectedVersion), requestId,
    ...(family === 'discussions' ? { expectedLatestContributionId: integer(v.expectedLatestContributionId) } : {}) };
}

function filterValue(key: string, val: unknown, family: Family): string | string[] {
  if (key === 'statuses') return array(val, statuses(family));
  if (key === 'kinds') return array(val, ['question', 'problem', 'suggestion']);
  if (key === 'resource' || key === 'anchor') return text(val, 512, key === 'anchor');
  return date(val);
}
