import { Problem, type Principal } from '../../../shared/types.ts';
import type { Family, ReviewCommand, ReviewReceipt, ManagementRepository } from '../../../shared/management.ts';
import { Reads } from './reads.ts';
interface ReceiptRow { target_id: number; to_status: ReviewReceipt['status']; version: number; changed_at: string; payload: string }
const receipt = (r: ReceiptRow): ReviewReceipt => ({ targetId: r.target_id, status: r.to_status, version: r.version, changedAt: r.changed_at });
export class D1Management extends Reads implements ManagementRepository {
  private async prior(site: string, family: Family, actor: Principal, input: ReviewCommand, payload: string) {
    const row = await this.db.prepare('SELECT * FROM review_events WHERE site=? AND family=? AND subject=? AND request_id=?')
      .bind(site, family, actor.subject, input.requestId).first<ReceiptRow>();
    if (!row) return null;
    if (row.payload !== payload) throw new Problem(409, 'Retry key conflict', 'request_id_conflict');
    return { receipt: receipt(row), replay: true };
  }
  async review(site: string, family: Family, id: number, actor: Principal, input: ReviewCommand) {
    const payload = JSON.stringify({ id, ...input });
    const prior = await this.prior(site, family, actor, input, payload); if (prior) return prior;
    const table = family === 'feedback' ? 'feedback' : 'comments', initial = family === 'feedback' ? 'new' : 'open';
    const activity = family === 'discussions' ? 'AND t.parent_id IS NULL AND (SELECT max(comment_id) FROM thread_members WHERE site=t.site AND root_id=t.id)=?' : '';
    const row = await this.db.prepare(`INSERT INTO review_events(site,family,target_id,version,from_status,to_status,subject,author,request_id,payload,changed_at,cause)
      SELECT t.site,?,t.id,COALESCE(h.version,0)+1,COALESCE(h.status,?),?,?,?,?,?,?,'manual'
      FROM ${table} t LEFT JOIN review_heads h ON h.site=t.site AND h.family=? AND h.target_id=t.id
      WHERE t.site=? AND t.id=? AND COALESCE(h.version,0)=? ${activity}
      ON CONFLICT(site,family,subject,request_id) DO NOTHING RETURNING *`)
      .bind(family, initial, input.status, actor.subject, actor.displayName, input.requestId, payload, new Date().toISOString(), family, site, id, input.expectedVersion,
        ...(family === 'discussions' ? [input.expectedLatestContributionId!] : [])).first<ReceiptRow>();
    if (row) return { receipt: receipt(row), replay: false };
    const replay = await this.prior(site, family, actor, input, payload); if (replay) return replay;
    const current = await this.original(site, family, id);
    const latest = family === 'discussions' ? await this.latest(site, id) : undefined;
    const code = latest !== undefined && latest !== input.expectedLatestContributionId ? 'activity_conflict' : 'version_conflict';
    throw new Problem(409, 'Review changed. Reload and reconcile your choice.', code, { status: current.status, version: current.version, ...(latest ? { latestContributionId: latest } : {}) });
  }
}
