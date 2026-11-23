import type { Comment, Feedback, Principal } from './types.ts';
export type Family = 'feedback' | 'discussions';
export type ReviewStatus = 'new' | 'in_review' | 'closed' | 'open' | 'resolved';
export interface Criteria {
  q: string; filters: Record<string, string | string[]>; sort: string; limit: number; cursor?: string;
}
export interface ReviewCommand { status: ReviewStatus; expectedVersion: number; expectedLatestContributionId?: number; requestId: string }
export interface ReviewReceipt { targetId: number; status: ReviewStatus; version: number; changedAt: string }
export interface ReviewEvent { version: number; fromStatus: ReviewStatus; toStatus: ReviewStatus; actor: string; changedAt: string; cause: 'manual' | 'reply'; commentId: number | null }
export interface QueueItem {
  id: number; createdAt: string; author: string; resource: string; anchor: string; revision: string;
  kind?: string; status: ReviewStatus; version: number; excerpt: string; truncated: boolean;
  lastActivityAt?: string; latestContributionId?: number; replyCount?: number;
}
export interface QueuePage { items: QueueItem[]; nextCursor: string | null; matchedCount: number; upperId: number; observedAt: string }
export interface Summary {
  observedAt: string; statusCounts: Record<string, number>; total?: number; kindCounts?: Record<string, number>;
  oldestNewCreatedAt?: string | null; threadCount?: number; contributionCount?: number;
}
export interface ReviewDetail {
  original: Comment | Feedback; status: ReviewStatus; version: number; latestContributionId?: number;
  replies: Comment[]; nextReplies: number | null; history: ReviewEvent[]; nextHistory: number | null;
}
export interface HistoryPage { history: ReviewEvent[]; nextHistory: number | null }
export interface RepliesPage { replies: Comment[]; nextReplies: number | null }
// Host-neutral repository port. Verified host/actor are supplied by the application.
export interface ManagementRepository {
  query(site: string, family: Family, criteria: Criteria): Promise<QueuePage>;
  summary(site: string, family: Family, criteria: Criteria): Promise<Summary>;
  detail(site: string, family: Family, id: number): Promise<ReviewDetail>;
  history(site: string, family: Family, id: number, before?: number): Promise<HistoryPage>;
  replies(site: string, id: number, before?: number): Promise<RepliesPage>;
  review(site: string, family: Family, id: number, actor: Principal, command: ReviewCommand): Promise<{ receipt: ReviewReceipt; replay: boolean }>;
}
