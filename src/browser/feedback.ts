import { contentRoot, headingAnchor } from './anchors.ts';
import { feedbackInput } from '../shared/validation.ts';
import type { FeedbackInput, FeedbackPage, FeedbackReceipt, Session } from '../shared/types.ts';
import { ApiError, type Client } from './api.ts';
import type { Context } from './panel.ts';
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text = ''): HTMLElementTagNameMap[K] => {
  const result = document.createElement(tag); result.textContent = text; return result;
};
export function mountFeedback(marker: HTMLElement, context: Context, client: Client, session?: Session): void {
  if (marker.dataset.feedback !== 'true') return;
  const host = el('aside'); host.dataset.concourseFeedback = ''; document.body.append(host);
  const shadow = host.attachShadow({ mode: 'open' }), css = el('link'); css.rel = 'stylesheet'; css.href = context.css;
  const details = el('details'), summary = el('summary', 'Send feedback'); details.append(summary); shadow.append(css, details);
  details.append(el('p', 'Feedback is private to this site’s maintainers. Use section comments for discussion.'));
  const status = el('p'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const login = el('a', 'Sign in to send feedback'); login.href = client.login(); login.hidden = !!session;
  const form = el('form'), fields = el('fieldset'), legend = el('legend', 'Your feedback'); fields.append(legend);
  function select(labelText: string, choices: [string, string][]): HTMLSelectElement {
    const label = el('label', labelText), control = el('select');
    for (const [value, text] of choices) { const option = el('option', text); option.value = value; control.append(option); }
    control.id = `feedback-${labelText.toLowerCase().replaceAll(' ', '-')}`; label.htmlFor = control.id;
    fields.append(label, control); return control;
  }
  const kind = select('Feedback type', [['question', 'Question'], ['problem', 'Problem'], ['suggestion', 'Suggestion']]);
  const main = contentRoot();
  const headings = [...(main?.querySelectorAll<HTMLElement>('h2,h3,h4') ?? [])];
  const ids = headings.map(headingAnchor);
  const sections = headings.filter(h => headingAnchor(h) && ids.filter(id => id === headingAnchor(h)).length === 1);
  const anchor = select('Section', [['', 'Whole page'], ...sections.map(h => [headingAnchor(h), (h.textContent ?? '').trim()] as [string, string])]);
  const quote = el('p'), label = el('label', 'Your feedback'), body = el('textarea');
  body.rows = 4; body.maxLength = 4000; body.required = true; label.append(body); fields.append(label);
  const send = el('button', 'Submit feedback'); send.type = 'submit';
  form.append(fields, quote, send); form.hidden = !session; details.append(status, login, form);
  const storageKey = `concourse:feedback:${context.subject}:${context.site}:${context.resource}`;
  let pending: FeedbackInput | null = null, busy = false, selectedQuote = '';
  function remember(): void {
    if (!session) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify({ pending, body: body.value, kind: kind.value, anchor: anchor.value, quote: selectedQuote })); }
    catch { /* In-memory recovery remains available if storage is blocked. */ }
  }
  function showQuote(): void { quote.textContent = selectedQuote ? `Selected text: ${selectedQuote}` : ''; }
  const draft = readDraft(storageKey, context.resource, !!session);
  if (draft) {
    pending = draft.pending; body.value = draft.body; kind.value = draft.kind; anchor.value = draft.anchor;
    selectedQuote = draft.quote; fields.disabled = !!pending; showQuote();
    if (pending) status.textContent = 'Save outcome unknown. Retry this feedback before editing.';
  }
  form.oninput = remember;
  summary.addEventListener('pointerdown', () => {
    if (pending) return;
    const selection = window.getSelection();
    if (selection && main?.contains(selection.anchorNode) && main.contains(selection.focusNode)) {
      selectedQuote = [...selection.toString()].slice(0, 500).join(''); showQuote(); remember();
    }
  });
  form.onsubmit = async event => {
    event.preventDefault(); if (busy || !session) return;
    if (!body.value.trim()) { status.textContent = 'Enter feedback.'; body.focus(); return; }
    pending ??= { resource: context.resource, revision: context.revision, anchor: anchor.value, quote: selectedQuote,
      kind: kind.value as FeedbackInput['kind'], body: body.value.trim(), requestId: crypto.randomUUID() };
    remember(); busy = true; send.disabled = true; fields.disabled = true; status.textContent = 'Submitting feedback…';
    try {
      const result = await client.request<{ receipt: FeedbackReceipt }>('feedback', { method: 'POST',
        headers: { 'content-type': 'application/json' }, body: JSON.stringify(pending) });
      status.textContent = `Feedback received. Reference #${result.receipt.id}.`;
      pending = null; body.value = ''; selectedQuote = ''; fields.disabled = false; showQuote();
      try { sessionStorage.removeItem(storageKey); } catch { /* Receipt remains visible. */ }
      body.focus();
    } catch (error) { failed(error);
    } finally { busy = false; send.disabled = false; }
  };
  function failed(error: unknown): void {
    if (!definitiveFailure(error)) {
      status.textContent = 'Save outcome unknown. Your draft is retained. Retry this feedback before editing.'; return;
    }
    pending = null; fields.disabled = false; remember();
    status.textContent = 'Feedback was not accepted. Check your input and try again.';
    if (error.status === 401) {
      status.textContent = 'Sign in again, then retry your retained draft.'; login.hidden = false; form.hidden = true;
    }
  }
  if (session?.canManageFeedback || session?.canManageDiscussions) { const workspace = el('a', 'Open maintainer workspace'); workspace.href = '/__concourse/admin/'; details.append(workspace); }
  if (session?.canReviewFeedback) mountInbox(details, client);
}
function mountInbox(parent: HTMLElement, client: Client): void {
  const details = el('details'), summary = el('summary', 'Feedback inbox'), list = el('ol');
  const status = el('p'); status.setAttribute('role', 'status');
  const refresh = el('button', 'Refresh inbox'), older = el('button', 'Load earlier feedback'); older.hidden = true;
  refresh.type = older.type = 'button'; details.append(summary, status, list, refresh, older); parent.append(details);
  let busy = false, next: number | null = null;
  async function load(append: boolean): Promise<void> {
    if (busy) return; busy = true; status.textContent = 'Loading feedback…';
    try {
      const page = await client.request<FeedbackPage>(`feedback${append && next ? `?before=${next}` : ''}`);
      if (!append) list.replaceChildren();
      for (const item of page.feedback) list.append(inboxItem(item));
      next = page.next; older.hidden = !next; status.textContent = list.children.length ? `${list.children.length} feedback items shown.` : 'No feedback yet.';
    } catch { status.textContent = 'Inbox unavailable. Confirm your maintainer access and try again.'; }
    finally { busy = false; }
  }
  details.ontoggle = () => { if (details.open) void load(false); };
  refresh.onclick = () => { void load(false); }; older.onclick = () => { void load(true); };
}

function definitiveFailure(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 409;
}
function inboxItem(item: FeedbackPage['feedback'][number]): HTMLLIElement {
  const li = el('li'); li.append(el('p', `#${item.id} · ${item.kind} · ${item.author} · ${new Date(item.createdAt).toLocaleString()}`),
    el('p', `${item.resource} #${item.anchor || 'page'} · revision ${item.revision}`), el('p', item.quote), el('p', item.body));
  return li;
}
function readDraft(key: string, resource: string, signedIn: boolean): { pending: FeedbackInput | null; body: string; kind: string; anchor: string; quote: string } | null {
  if (!signedIn) return null;
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (!saved) return null;
    const pending = saved.pending ? feedbackInput(saved.pending) : null;
    if (pending && pending.resource !== resource) return null;
    const draft = pending ?? feedbackInput({ resource, revision: 'draft', body: saved.body || ' ',
      kind: saved.kind, anchor: saved.anchor, quote: saved.quote, requestId: '00000000-0000-4000-8000-000000000000' });
    return { pending, body: draft.body, kind: draft.kind, anchor: draft.anchor, quote: draft.quote };
  } catch { return null; }
}
