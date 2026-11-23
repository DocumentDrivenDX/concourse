import { Problem, type Principal, type Site } from '../shared/types.ts';
import { commentInput, integer, readJson, text, feedbackInput } from '../shared/validation.ts';
import { type CommentStore } from './store.ts';
import type { FeedbackStore } from './feedback.ts';
import type { ManagementRepository } from '../shared/management.ts';
import { management, admit, capabilities } from './management/application.ts';
import { assetResponse, builtAssets, type AdminAsset } from './admin-assets.ts';
import { siteFor } from './config.ts';
export interface Dependencies {
  sites: Site[];
  authenticate(request: Request, site: Site): Promise<Principal>;
  store: CommentStore;
  feedback: FeedbackStore;
  management?: ManagementRepository;
  adminAssets?: Record<string, AdminAsset>;
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
    if (request.method === 'GET' && path === '/__concourse/session') return json({ subject: principal.subject, displayName: principal.displayName,
      canReviewFeedback: site.maintainers?.includes(principal.email) ?? false, ...capabilities(site, principal), site: site.id });
    if (path.startsWith('/__concourse/admin')) return await admin(request, deps, site, principal, path);
    if (request.method === 'GET') return await read(request, deps, site, principal, path);
    return await write(request, deps, site, principal, path);
  } catch (error) {
    if (error instanceof Problem) return problem(error);
    return json({ error: 'Service unavailable' }, 503);
  }
}

function login(url: URL, site: Site): Response {
  const target = new URL(url.searchParams.get('return') ?? '/', url.origin);
  if (target.origin !== site.origin || !target.pathname.startsWith('/') || (target.pathname.startsWith('/__concourse/') && target.pathname !== '/__concourse/admin/')) throw new Problem(400, 'Invalid return');
  return new Response(null, { status: 303, headers: { location: target.href,
    'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
}
async function list(url: URL, store: CommentStore, site: Site): Promise<Response> {
  const resource = text(url.searchParams.get('resource'), 512), anchor = text(url.searchParams.get('anchor'), 512);
  const cursor = url.searchParams.get('before');
  const before = cursor === null ? undefined : integer(Number(cursor));
  return json(await store.list(site.id, resource, anchor, before));
}

async function read(request: Request, deps: Dependencies, site: Site, principal: Principal, path: string): Promise<Response> {
  const url = new URL(request.url);
  if (path === '/__concourse/comments') return list(url, deps.store, site);
  if (path !== '/__concourse/feedback') throw new Problem(404, 'Unknown route');
  if (!site.maintainers?.includes(principal.email)) throw new Problem(403, 'Maintainer access required');
  const before = url.searchParams.get('before');
  return json(await deps.feedback.list(site.id, before === null ? undefined : integer(Number(before))));
}

async function write(request: Request, deps: Dependencies, site: Site, principal: Principal, path: string): Promise<Response> {
  if (path !== '/__concourse/comments' && path !== '/__concourse/feedback') throw new Problem(404, 'Unknown route');
  if (request.headers.get('origin') !== site.origin) throw new Problem(403, 'Origin denied');
  if (request.headers.get('sec-fetch-site') === 'cross-site') throw new Problem(403, 'Origin denied');
  if (path === '/__concourse/feedback') {
    const result = await deps.feedback.add(site.id, principal, feedbackInput(await readJson(request)));
    return json({ receipt: result.receipt }, result.replay ? 200 : 201);
  }
  const input = commentInput(await readJson(request));
  const result = await deps.store.add(site.id, principal, input);
  return json({ comment: result.comment }, result.replay ? 200 : 201);
}

async function admin(request: Request, deps: Dependencies, site: Site, actor: Principal, path: string): Promise<Response> {
  admit(site, actor);
  if (path === '/__concourse/admin' && request.method === 'GET') return new Response(null, { status: 303, headers: { location: '/__concourse/admin/', 'cache-control': 'no-store' } });
  if (!path.startsWith('/__concourse/admin/')) throw new Problem(404, 'Unknown route');
  const relative = path.slice('/__concourse/admin/'.length);
  if (request.method === 'GET' && (!relative || relative.startsWith('assets/'))) {
    if (new URL(request.url).search) throw new Problem(400, 'Unknown parameter');
    return assetResponse(relative || 'index.html', deps.adminAssets ?? builtAssets());
  }
  if (!deps.management) throw new Problem(503, 'Workspace unavailable');
  const result = await management(request, site, actor, deps.management);
  return json(result.data, result.status);
}

function problem(error: Problem): Response { return json({ error: error.message, code: error.code, current: error.current }, error.status); }
