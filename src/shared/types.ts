export interface Site {
  id: string; origin: string; issuer: string; audience: string;
  domains: string[]; emails: string[]; maintainers?: string[]; moderators?: string[];
}
export interface Principal { subject: string; displayName: string; email: string }
export interface CommentInput {
  resource: string; anchor: string; revision: string; quote: string; body: string;
  requestId: string; parentId?: number;
}
export interface Comment {
  id: number; resource: string; anchor: string; revision: string; quote: string;
  body: string; author: string; createdAt: string; parentId: number | null; threadId?: number;
}
export interface CommentPage { comments: Comment[]; next: number | null; threadStates?: { threadId: number; status: 'open' | 'resolved'; version: number }[] }
export class Problem extends Error {
  constructor(public status: number, message: string, public code?: string, public current?: Record<string, unknown>) { super(message); }
}

export type FeedbackKind = 'question' | 'problem' | 'suggestion';
export interface FeedbackInput {
  resource: string; revision: string; anchor: string; quote: string;
  kind: FeedbackKind; body: string; requestId: string;
}
export interface FeedbackReceipt { id: number; createdAt: string }
export interface Feedback extends Omit<FeedbackInput, 'requestId'>, FeedbackReceipt { author: string }
export interface FeedbackPage { feedback: Feedback[]; next: number | null }
export interface Session { subject: string; displayName: string; canReviewFeedback: boolean; canManageFeedback?: boolean; canManageDiscussions?: boolean; site?: string }
