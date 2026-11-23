import { Problem, type Site, type Principal } from '../../shared/types.ts';
import type { Family, ManagementRepository } from '../../shared/management.ts';
import { integer, readJson } from '../../shared/validation.ts';
import { criteria, reviewCommand } from './validation.ts';
export function capabilities(site: Site, principal: Principal) {
  return { canManageFeedback: site.maintainers?.includes(principal.email) ?? false,
    canManageDiscussions: site.moderators?.includes(principal.email) ?? false };
}
export function admit(site: Site, principal: Principal, family?: Family): void {
  const c = capabilities(site, principal);
  const allowed = family ? family === 'feedback' ? c.canManageFeedback : c.canManageDiscussions : c.canManageFeedback || c.canManageDiscussions;
  if (!allowed) throw new Problem(403, 'Workspace permission required');
}
export async function management(request: Request, site: Site, principal: Principal, repository: ManagementRepository): Promise<{ data: unknown; status?: number }> {
  const url = new URL(request.url), parts = url.pathname.slice('/__concourse/admin/'.length).split('/');
  const family = parts[0];
  if (family !== 'feedback' && family !== 'discussions') throw new Problem(404, 'Unknown route');
  admit(site, principal, family);
  if (url.searchParams.size && !(request.method === 'GET' && parts.length === 3)) throw new Problem(400, 'Unknown parameter');
  if (request.method === 'POST') return post(request, site, principal, family, parts, repository);
  const id = pathId(parts[1]);
  if (parts.length === 2) return { data: await repository.detail(site.id, family, id) };
  if (parts.length !== 3) throw new Problem(404, 'Unknown route');
  if (parts[2] === 'history') return { data: await repository.history(site.id, family, id, before(url, 'beforeVersion')) };
  if (parts[2] === 'replies' && family === 'discussions') return { data: await repository.replies(site.id, id, before(url, 'beforeId')) };
  throw new Problem(404, 'Unknown route');
}
function pathId(value?: string): number {
  if (!value || !/^[1-9]\d*$/.test(value)) throw new Problem(400, 'Invalid identifier');
  return integer(Number(value));
}
function before(url: URL, key: string): number | undefined {
  if ([...url.searchParams.keys()].some(k => k !== key) || url.searchParams.getAll(key).length > 1) throw new Problem(400, 'Unknown parameter');
  return url.searchParams.has(key) ? pathId(url.searchParams.get(key) ?? undefined) : undefined;
}
async function post(request: Request, site: Site, actor: Principal, family: Family, parts: string[], repository: ManagementRepository) {
  if (request.headers.get('origin') !== site.origin || request.headers.get('sec-fetch-site') === 'cross-site') throw new Problem(403, 'Origin denied');
  const body = await readJson(request);
  if (parts.length === 2 && parts[1] === 'query') return { data: await repository.query(site.id, family, criteria(body, family)) };
  if (parts.length === 2 && parts[1] === 'summary') return { data: await repository.summary(site.id, family, criteria(body, family, true)) };
  const action = family === 'feedback' ? 'triage' : 'review';
  if (parts.length !== 3 || parts[2] !== action) throw new Problem(404, 'Unknown route');
  const result = await repository.review(site.id, family, pathId(parts[1]), actor, reviewCommand(body, family));
  return { data: { receipt: result.receipt }, status: result.replay ? 200 : 201 };
}
