import type { Comment, Feedback } from '../../../shared/types.ts';
import type { QueueItem, ReviewEvent, ReviewStatus } from '../../../shared/management.ts';
export interface Row {
  id: number; site: string; resource: string; anchor: string; revision: string; quote: string; body: string;
  author: string; created_at: string; parent_id: number | null; kind: Feedback['kind']; status: ReviewStatus; version: number;
  last_activity_at: string; latest_contribution_id: number; reply_count: number;
}
export function comment(r: Row, threadId?: number): Comment {
  return { id: r.id, resource: r.resource, anchor: r.anchor, revision: r.revision, quote: r.quote, body: r.body,
    author: r.author, createdAt: r.created_at, parentId: r.parent_id, ...(threadId ? { threadId } : {}) };
}
export function feedback(r: Row): Feedback {
  const c = comment(r);
  return { id: c.id, resource: c.resource, anchor: c.anchor, revision: c.revision, quote: c.quote, body: c.body,
    author: c.author, createdAt: c.createdAt, kind: r.kind };
}
export function item(r: Row, discussion: boolean): QueueItem {
  const body = [...r.body];
  return { id: r.id, resource: r.resource, anchor: r.anchor, revision: r.revision, author: r.author, createdAt: r.created_at,
    status: r.status, version: r.version, excerpt: body.slice(0, 200).join(''), truncated: body.length > 200,
    ...(discussion ? { lastActivityAt: r.last_activity_at, latestContributionId: r.latest_contribution_id, replyCount: r.reply_count } : { kind: r.kind }) };
}
export interface EventRow { version: number; from_status: ReviewStatus; to_status: ReviewStatus; author: string; changed_at: string; cause: 'manual' | 'reply'; comment_id: number | null }
export function event(r: EventRow): ReviewEvent {
  return { version: r.version, fromStatus: r.from_status, toStatus: r.to_status, actor: r.author, changedAt: r.changed_at, cause: r.cause, commentId: r.comment_id };
}
