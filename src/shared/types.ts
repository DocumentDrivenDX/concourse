export interface Site {
  id: string; origin: string; issuer: string; audience: string;
  domains: string[]; emails: string[];
}
export interface Principal { subject: string; displayName: string; email: string }
export interface CommentInput {
  resource: string; anchor: string; revision: string; quote: string; body: string;
  requestId: string; parentId?: number;
}
export interface Comment {
  id: number; resource: string; anchor: string; revision: string; quote: string;
  body: string; author: string; createdAt: string; parentId: number | null;
}
export interface CommentPage { comments: Comment[]; next: number | null }
export class Problem extends Error {
  constructor(public status: number, message: string) { super(message); }
}
