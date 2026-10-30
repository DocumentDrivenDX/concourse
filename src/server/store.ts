import type { D1Database } from '@cloudflare/workers-types';
import { Problem, type Comment, type CommentInput, type CommentPage, type Principal } from '../shared/types.ts';
export type Connection = Pick<D1Database, 'prepare'>;
interface Row {
  id: number; payload: string; resource: string; anchor: string; revision: string;
  quote: string; body: string; author: string; created_at: string; parent_id: number | null;
}
function publicComment(row: Row): Comment {
  return { id: row.id, resource: row.resource, anchor: row.anchor, revision: row.revision,
    quote: row.quote, body: row.body, author: row.author, createdAt: row.created_at, parentId: row.parent_id };
}
export class CommentStore {
  constructor(private db: Connection) {}
  async list(site: string, resource: string, anchor: string, before?: number): Promise<CommentPage> {
    const rows = await this.db.prepare('SELECT * FROM comments WHERE site = ? AND resource = ? AND anchor = ? AND id < ? ORDER BY id DESC LIMIT 51')
      .bind(site, resource, anchor, before ?? Number.MAX_SAFE_INTEGER).all<Row>();
    const more = rows.results.length > 50;
    const page = rows.results.slice(0, 50);
    return { comments: page.reverse().map(publicComment), next: more ? page[0]?.id ?? null : null };
  }
  async add(site: string, principal: Principal, input: CommentInput): Promise<{ comment: Comment; replay: boolean }> {
    const payload = JSON.stringify(input);
    const inserted = await this.db.prepare(`INSERT INTO comments
      (site,subject,request_id,payload,resource,anchor,revision,quote,body,author,created_at,parent_id)
      SELECT ?,?,?,?,?,?,?,?,?,?,?,? WHERE ? IS NULL OR EXISTS
      (SELECT 1 FROM comments WHERE id = ? AND site = ? AND resource = ? AND anchor = ?)
      ON CONFLICT(site,subject,request_id) DO NOTHING RETURNING *`)
      .bind(site, principal.subject, input.requestId, payload, input.resource, input.anchor, input.revision,
        input.quote, input.body, principal.displayName, new Date().toISOString(), input.parentId ?? null,
        input.parentId ?? null, input.parentId ?? null, site, input.resource, input.anchor).first<Row>();
    if (inserted) return { comment: publicComment(inserted), replay: false };
    const previous = await this.db.prepare('SELECT * FROM comments WHERE site = ? AND subject = ? AND request_id = ?')
      .bind(site, principal.subject, input.requestId).first<Row>();
    if (!previous) throw new Problem(404, 'Unknown parent');
    if (previous.payload !== payload) throw new Problem(409, 'Retry key conflict');
    return { comment: publicComment(previous), replay: true };
  }
}
