import type { Family, HistoryPage, RepliesPage, ReviewDetail, ReviewReceipt, ReviewStatus } from '../shared/management.ts';
import { ApiError } from '../client/api.ts';
import { Workspace } from './state.ts';
import { el, button, status, select, title, time } from './dom.ts';
export async function detail(w: Workspace, family: Family, id: number, parent: HTMLElement, changed: () => void, context: (resource: string, anchor: string) => void): Promise<void> {
  const requestKey = crypto.randomUUID(); parent.dataset.requestKey = requestKey;
  const loading = status('Loading item…'); parent.replaceChildren(loading);
  try {
    const value = await w.get<ReviewDetail>(`${family}/${id}`);
    if (!parent.isConnected || parent.dataset.requestKey !== requestKey) return;
    render(w, family, id, value, parent, changed, context);
  } catch (error) { if (parent.isConnected && parent.dataset.requestKey === requestKey) { parent.replaceChildren(); w.failure(parent, error); } }
}
function render(w: Workspace, family: Family, id: number, value: ReviewDetail, parent: HTMLElement, changed: () => void, context: (resource: string, anchor: string) => void): void {
  parent.replaceChildren(); const original = value.original;
  const heading = el('h2', `${family === 'feedback' ? 'Feedback' : 'Discussion'} #${id}`); heading.tabIndex = -1;
  parent.append(heading, el('p', 'Current detail may be newer than the result list. Refresh results to update the queue.', 'muted'), el('span', title(value.status), 'badge'), el('p', `${original.author} · ${time(original.createdAt)}`, 'muted'));
  const source = el('section', '', 'source'); source.setAttribute('aria-label', 'Publication context');
  source.append(el('strong', original.resource), el('p', `Section: ${original.anchor || 'Whole page'}`), el('p', `Revision: ${original.revision}`));
  if (original.quote) source.append(el('blockquote', original.quote));
  source.append(button('Filter to this context', () => context(original.resource, original.anchor)));
  parent.append(source, el('p', original.body, 'message'));
  if (family === 'discussions') replies(w, id, value, parent);
  review(w, family, id, value, parent, changed, context);
  history(w, family, id, value, parent);
}
function replies(w: Workspace, id: number, value: ReviewDetail, parent: HTMLElement): void {
  const section = el('section'); section.append(el('h3', 'Replies'));
  const list = el('ol'), message = status(), older = button('Load earlier replies', () => { void load(); });
  const add = (page: RepliesPage, prepend = false) => {
    const fragment = document.createDocumentFragment();
    for (const r of page.replies) {
      const li = el('li'); li.append(el('p', `#${r.id} · ${r.author} · ${time(r.createdAt)}`, 'muted'), el('p', `Reply to #${r.parentId} · revision ${r.revision}`, 'muted'), el('p', r.body, 'message'));
      if (r.quote) li.append(el('blockquote', r.quote)); fragment.append(li);
    }
    if (prepend) list.prepend(fragment); else list.append(fragment);
    next = page.nextReplies; older.hidden = !next;
  };
  let next = value.nextReplies, busy = false;
  async function load() {
    if (busy || !next) return; busy = true; older.disabled = true;
    try { add(await w.get<RepliesPage>(`discussions/${id}/replies?beforeId=${next}`), true); message.textContent = ''; }
    catch (error) { message.textContent = 'Replies unavailable. Retry.'; w.failure(section, error); }
    finally { busy = false; older.disabled = false; }
  }
  add(value); if (!value.replies.length) section.append(el('p', 'No replies yet.'));
  section.append(list, older, message); parent.append(section);
}
function history(w: Workspace, family: Family, id: number, value: ReviewDetail, parent: HTMLElement): void {
  const section = el('section'); section.append(el('h3', 'Review history'));
  const list = el('ol'), older = button('Load earlier history', () => { void load(); });
  let next = value.nextHistory;
  const add = (page: HistoryPage) => {
    for (const e of page.history) list.append(el('li', `${title(e.fromStatus)} → ${title(e.toStatus)} · ${e.actor} · ${time(e.changedAt)}${e.cause === 'reply' ? ` · Reopened by reply #${e.commentId}` : ''}`));
    next = page.nextHistory; older.hidden = !next;
  };
  async function load() {
    older.disabled = true;
    try { add(await w.get<HistoryPage>(`${family}/${id}/history?beforeVersion=${next}`)); }
    catch (error) { w.failure(section, error); } finally { older.disabled = false; }
  }
  add(value); if (!value.history.length) section.append(el('p', 'No review changes yet.'));
  section.append(list, older); parent.append(section);
}
function review(w: Workspace, family: Family, id: number, value: ReviewDetail, parent: HTMLElement, changed: () => void, context: (resource: string, anchor: string) => void): void {
  const section = el('section', '', 'review'); section.append(el('h3', family === 'feedback' ? 'Triage feedback' : 'Review discussion'));
  const control = select('Status', family === 'feedback' ? ['new', 'in_review', 'closed'] : ['open', 'resolved'], value.status);
  const message = status(), save = button('Save status', () => { void send(); }, 'primary');
  const reload = button('Reload latest to reconcile', () => { void reloadLatest(); }); reload.hidden = true;
  let busy = false, conflict = false;
  const same = () => w.pending?.family === family && w.pending?.id === id;
  function lock() {
    control.input.disabled = !!w.pending; save.disabled = busy || conflict || (!!w.pending && !same());
    save.textContent = same() ? 'Retry saved command' : 'Save status';
  }
  if (same()) { control.input.value = w.pending!.command.status; message.textContent = 'Save outcome unknown. Retry this exact command before editing.'; }
  else if (w.pending) message.textContent = 'Another review has an unknown outcome. Open it from the recovery notice first.';
  async function reloadLatest() {
    const choice = control.input.value;
    try {
      const current = await w.get<ReviewDetail>(`${family}/${id}`);
      render(w, family, id, current, parent, changed, context);
      const select = parent.querySelector<HTMLSelectElement>('.review select'); if (select) select.value = choice;
    } catch (error) { w.failure(section, error); }
  }
  async function send() {
    if (busy || conflict) return;
    if (!w.pending) w.pending = { family, id, command: { status: control.input.value as ReviewStatus, expectedVersion: value.version,
      requestId: crypto.randomUUID(), ...(family === 'discussions' ? { expectedLatestContributionId: value.latestContributionId } : {}) } };
    if (!same()) return;
    w.save(); busy = true; lock(); message.textContent = 'Saving review…';
    try {
      await w.post<{ receipt: ReviewReceipt }>(`${family}/${id}/${family === 'feedback' ? 'triage' : 'review'}`, w.pending!.command);
      w.pending = undefined; w.save(); message.textContent = 'Review saved.';
    } catch (error) {
      handleFailure(error); return;
    } finally { busy = false; lock(); }
    // An acknowledged write remains acknowledged even when a subsequent read fails.
    changed(); await detail(w, family, id, parent, changed, context); parent.append(status('Review saved.'));
    parent.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }
  function handleFailure(error: unknown) {
    if (error instanceof ApiError && error.status === 409) {
      w.pending = undefined; conflict = true; reload.hidden = false;
      message.textContent = 'This item changed. Your choice is retained. Reload latest, reconcile it, then explicitly save.';
    } else if (error instanceof ApiError && [400, 403, 404, 413].includes(error.status)) {
      w.pending = undefined; message.textContent = 'Review was not accepted. Check your permission and input.'; w.failure(section, error);
    } else { message.textContent = 'Save outcome unknown. Retry this exact command before editing.'; w.failure(section, error); }
    w.save(); lock();
  }
  lock(); section.append(control.label, save, reload, message); parent.append(section);
}
