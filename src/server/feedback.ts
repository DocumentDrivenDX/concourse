import { Problem, type FeedbackInput, type FeedbackPage, type FeedbackReceipt, type Principal } from '../shared/types.ts';
import type { Connection } from './store.ts';
interface Row extends FeedbackInput { id: number; payload: string; author: string; created_at: string }
const receipt = (row: Row): FeedbackReceipt => ({ id: row.id, createdAt: row.created_at });
export class FeedbackStore {
  constructor(private db: Connection) {}
  async add(site: string, principal: Principal, input: FeedbackInput): Promise<{ receipt: FeedbackReceipt; replay: boolean }> {
    const payload = JSON.stringify(input);
    const row = await this.db.prepare(`INSERT INTO feedback
      (site,subject,request_id,payload,resource,revision,anchor,quote,kind,body,author,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(site,subject,request_id) DO NOTHING RETURNING *`)
      .bind(site, principal.subject, input.requestId, payload, input.resource, input.revision, input.anchor,
        input.quote, input.kind, input.body, principal.displayName, new Date().toISOString()).first<Row>();
    if (row) return { receipt: receipt(row), replay: false };
    const prior = await this.db.prepare('SELECT * FROM feedback WHERE site = ? AND subject = ? AND request_id = ?')
      .bind(site, principal.subject, input.requestId).first<Row>();
    if (!prior || prior.payload !== payload) throw new Problem(409, 'Retry key conflict');
    return { receipt: receipt(prior), replay: true };
  }
  async list(site: string, before?: number): Promise<FeedbackPage> {
    const rows = await this.db.prepare('SELECT * FROM feedback WHERE site = ? AND id < ? ORDER BY id DESC LIMIT 51')
      .bind(site, before ?? Number.MAX_SAFE_INTEGER).all<Row>();
    const page = rows.results.slice(0, 50);
    return { feedback: page.map(r => ({ id: r.id, createdAt: r.created_at, author: r.author,
      resource: r.resource, revision: r.revision, anchor: r.anchor, quote: r.quote, kind: r.kind, body: r.body })),
      next: rows.results.length > 50 ? page.at(-1)?.id ?? null : null };
  }
}
