import type { Criteria, Family, ReviewCommand } from '../shared/management.ts';
import type { Session } from '../shared/types.ts';
import { Client, ApiError } from '../client/api.ts';
import { el, status } from './dom.ts';
export interface QueueState { criteria: Criteria; cursors: (string | undefined)[]; page: number; selected?: number; scroll?: number }
export interface Pending { family: Family; id: number; command: ReviewCommand }
export class Workspace {
  client = new Client('/__concourse/', '');
  view: Family | 'overview' = 'overview';
  queues: Record<Family, QueueState> = { feedback: fresh('feedback'), discussions: fresh('discussions') };
  pending?: Pending;
  onChange?: () => void;
  private key: string;
  constructor(public session: Session) {
    this.key = `concourse:workspace:${session.subject}:${session.site}`;
    try {
      const v = JSON.parse(sessionStorage.getItem(this.key) ?? 'null');
      if (v) { this.queues = { ...this.queues, ...v.queues }; this.pending = v.pending; this.view = ['feedback', 'discussions'].includes(v.view) ? v.view : 'overview'; }
    } catch { /* Memory-only navigation/retry remains available. */ }
  }
  allowed(family: Family): boolean { return !!(family === 'feedback' ? this.session.canManageFeedback : this.session.canManageDiscussions); }
  save(): void {
    try { sessionStorage.setItem(this.key, JSON.stringify({ queues: this.queues, pending: this.pending, view: this.view })); } catch { /* Do not replace an uncertain command in memory. */ }
    this.onChange?.();
  }
  async post<T>(path: string, body: unknown): Promise<T> {
    return this.client.request<T>('admin/' + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  }
  async get<T>(path: string): Promise<T> { return this.client.request<T>('admin/' + path); }
  failure(parent: HTMLElement, error: unknown): void {
    const message = error instanceof ApiError ? error.message : 'Service unavailable. Try again.';
    parent.append(status(message));
    if (!(error instanceof ApiError) || error.status === 401) {
      const login = el('a', 'Sign in again'); login.href = this.client.login(); parent.append(login);
    }
  }
}
export function fresh(family: Family): QueueState {
  return { criteria: { q: '', filters: {}, sort: family === 'feedback' ? 'newest' : 'activity', limit: 25 }, cursors: [undefined], page: 0 };
}
