import type { D1Database } from '@cloudflare/workers-types';
import { sites } from './config.ts';
import { authenticate } from './auth.ts';
import { handle } from './http.ts';
import { CommentStore } from './store.ts';
interface Env { SITES: string; DB: D1Database }
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handle(request, { sites: sites(env.SITES), authenticate,
        store: new CommentStore(env.DB.withSession('first-primary')) });
    } catch { return Response.json({ error: 'Service unavailable' }, { status: 503,
      headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } }); }
  },
};
