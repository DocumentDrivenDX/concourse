import type { CommentInput, CommentPage } from '../shared/types.ts';
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export class Client {
  private api: URL;
  constructor(api: string, private resource: string) {
    this.api = new URL(api, location.href);
    if (this.api.origin !== location.origin || this.api.pathname !== '/__concourse/' || this.api.search || this.api.hash) throw new Error('Concourse requires a same-origin API');
  }
  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(new URL(path, this.api), { ...init, credentials: 'same-origin', redirect: 'error', cache: 'no-store' });
    if (!response.ok) {
      const value = await response.json().catch(() => null) as { error?: string } | null;
      throw new ApiError(response.status, value?.error ?? 'Discussion unavailable');
    }
    return response.json() as Promise<T>;
  }
  login(): string {
    const u = new URL('login', this.api); u.searchParams.set('return', location.pathname + location.search + location.hash); return u.href;
  }
  list(anchor: string, before?: number): Promise<CommentPage> {
    const query = new URLSearchParams({ resource: this.resource, anchor });
    if (before) query.set('before', String(before));
    return this.request(`comments?${query}`);
  }
  add(input: CommentInput): Promise<unknown> {
    return this.request('comments', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) });
  }
}
