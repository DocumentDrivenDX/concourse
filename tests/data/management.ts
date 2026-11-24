// Governed non-PII corpus for FEAT-008 browser verification; never production seed data.
import { input, site } from '../helpers.ts';
import { FeedbackStore } from '../../src/server/feedback.ts';
import { D1Management } from '../../src/server/management/d1/repository.ts';
import type { Connection } from '../../src/server/store.ts';
import { CommentStore } from '../../src/server/store.ts';
export const syntheticReviewer = { subject: 'owner', displayName: 'Sample reviewer', email: 'owner@example.org' };
export async function seedManagement(connection: Connection) {
  const feedback = new FeedbackStore(connection), comments = new CommentStore(connection), management = new D1Management(connection);
  for (let i = 1; i <= 32; i++) await feedback.add(site.id, syntheticReviewer, { ...input({ body: `Private sample feedback ${i}. ${i === 1 ? '<img src=x onerror="throw 1">' : 'Login needs clarification.'}`, resource: i % 2 ? 'guide.md' : 'hosting.md' }), kind: i % 2 ? 'problem' : 'question' });
  await comments.add(site.id, syntheticReviewer, input({ body: 'Sample discussion about publication.' }));
  await comments.add(site.id, syntheticReviewer, input({ parentId: 1, body: 'The volume plugin should preserve the content directory.' }));
  for (let i = 0; i < 5; i++) await comments.add(site.id, syntheticReviewer, input({ body: `Other sample discussion ${i}` }));
  return management;
}
