import { Problem, type Principal, type Site } from '../shared/types.ts';
import { commentInput, integer, readJson, text } from '../shared/validation.ts';
import { type CommentStore } from './store.ts';
import { siteFor } from './config.ts';
export interface Dependencies {
  sites: Site[];
  authenticate(request: Request, site: Site): Promise<Principal>;
  store: CommentStore;
}
function json(data: unknown, status = 200): Response { return Response.json(data, { status, headers: {
  'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'same-origin' } }); }
export async function handle(request: Request, deps: Dependencies): Promise<Response> {
  try {
    const site = siteFor(request, deps.sites);
    const url = new URL(request.url), path = url.pathname;
    if (!path.startsWith('/__concourse/')) throw new Problem(404, 'Unknown route');
    if (!['GET', 'POST'].includes(request.method)) throw new Problem(405, 'Method not allowed');
    const principal = await deps.authenticate(request, site);
    if (request.method === 'GET' && path === '/__concourse/login') {
      return login(url, site);
    }
    if (request.method === 'GET' && path === '/__concourse/session') return json({ subject: principal.subject, displayName: principal.displayName });
    if (path !== '/__concourse/comments') throw new Problem(404, 'Unknown route');
    if (request.method === 'GET') {
      return await list(url, deps.store, site);
    }
    if (request.headers.get('origin') !== site.origin) throw new Problem(403, 'Origin denied');
    if (request.headers.get('sec-fetch-site') === 'cross-site') throw new Problem(403, 'Origin denied');
    const input = commentInput(await readJson(request));
    const result = await deps.store.add(site.id, principal, input);
    return json({ comment: result.comment }, result.replay ? 200 : 201);
  } catch (error) {
    if (error instanceof Problem) return json({ error: error.message }, error.status);
    return json({ error: 'Service unavailable' }, 503);
  }
}

function login(url: URL, site: Site): Response {
  const target = new URL(url.searchParams.get('return') ?? '/', url.origin);
  if (target.origin !== site.origin || !target.pathname.startsWith('/') || target.pathname.startsWith('/__concourse/')) throw new Problem(400, 'Invalid return');
  return new Response(null, { status: 303, headers: { location: target.href,
    'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
}
async function list(url: URL, store: CommentStore, site: Site): Promise<Response> {
  const resource = text(url.searchParams.get('resource'), 512), anchor = text(url.searchParams.get('anchor'), 512);
  const cursor = url.searchParams.get('before');
  const before = cursor === null ? undefined : integer(Number(cursor));
  return json(await store.list(site.id, resource, anchor, before));
}
