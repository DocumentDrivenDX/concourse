import type { Comment, CommentInput, CommentPage } from '../shared/types.ts';
import { ApiError, Client } from './api.ts';
export interface Context { site: string; resource: string; revision: string; api: string; css: string; subject?: string }
function node<K extends keyof HTMLElementTagNameMap>(tag: K, content = ''): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag); el.textContent = content; return el;
}
export async function sectionPanel(heading: HTMLElement, context: Context, client: Client, signedIn: boolean, anchor: string): Promise<void> {
  const quote = (heading.textContent ?? '').trim().slice(0, 500);
  const host = node('aside'); host.dataset.concoursePanel = anchor;
  heading.insertAdjacentElement('afterend', host);
  const shadow = host.attachShadow({ mode: 'open' });
  const css = node('link'); css.rel = 'stylesheet'; css.href = context.css; shadow.append(css);
  const details = node('details'), summary = node('summary', `Comments on ${quote || 'this page'}`);
  details.append(summary); shadow.append(details);
  const status = node('p'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const list = node('ol'), older = node('button', 'Load earlier comments'); older.type = 'button'; older.hidden = true;
  const refresh = node('button', 'Refresh comments'); refresh.type = 'button';
  const login = node('a', 'Sign in to comment'); login.href = client.login(); login.hidden = signedIn;
  const form = node('form'), label = node('label', 'Your comment'), input = node('textarea');
  input.maxLength = 4000; input.required = true; input.rows = 3;
  label.append(input); const send = node('button', 'Post comment'); send.type = 'submit';
  const reply = node('p'), cancel = node('button', 'Cancel reply'); cancel.type = 'button'; cancel.hidden = true;
  form.append(label, reply, cancel, send); form.hidden = !signedIn;
  details.append(status, login, list, older, refresh, form);
  let loaded = false, busy = false, next: number | null = null, parentId: number | undefined;
  const pendingKey = `concourse:${context.subject}:${context.site}:${context.resource}:${anchor}`;
  let pending: CommentInput | null = null;
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(pendingKey) ?? 'null');
    if (saved && context.subject) {
      const candidate = saved as CommentInput;
      if (candidate.resource === context.resource && candidate.anchor === anchor) {
        pending = candidate; input.value = candidate.body; input.readOnly = true;
      }
    }
  } catch { /* Storage may be disabled: the in-memory retry path still works. */ }
  function remember(value: CommentInput | null): void {
    try {
      if (value && context.subject) sessionStorage.setItem(pendingKey, JSON.stringify(value));
      else sessionStorage.removeItem(pendingKey);
    } catch { /* Never replace a retry key when browser storage is unavailable. */ }
  }
  function failure(error: unknown): void {
    if (error instanceof ApiError && error.status === 401) { login.hidden = false; form.hidden = true; }
    status.textContent = pending ? 'Save outcome unknown. Your draft is retained. Retry this contribution before editing.' : 'Discussion unavailable. Refresh to try again.';
  }
  function item(comment: Comment): HTMLLIElement {
    const li = node('li'); li.dataset.commentId = String(comment.id);
    li.append(node('p', `${comment.author} · ${new Date(comment.createdAt).toLocaleString()}`));
    if (comment.revision !== context.revision) li.append(node('p', 'From an earlier or different revision.'));
    if (comment.quote !== quote) li.append(node('p', `Original section: ${comment.quote}`));
    if (comment.parentId) li.append(node('p', `Reply to comment ${comment.parentId}`));
    li.append(node('p', comment.body));
    if (signedIn) {
      const button = node('button', `Reply to comment ${comment.id}`); button.type = 'button';
      button.onclick = () => { if (pending) return; parentId = comment.id; reply.textContent = `Replying to comment ${comment.id}`; cancel.hidden = false; input.focus(); };
      li.append(button);
    }
    return li;
  }
  function show(page: CommentPage, append: boolean): void {
    if (!append) list.replaceChildren();
    const fragment = document.createDocumentFragment();
    for (const comment of page.comments) fragment.append(item(comment));
    if (append) list.prepend(fragment); else list.append(fragment);
    next = page.next; older.hidden = !next;
    status.textContent = list.children.length ? `${list.children.length} comments shown.` : 'No comments yet. Start the discussion.';
  }
  async function load(append = false): Promise<void> {
    if (busy || !signedIn) return; busy = true; status.textContent = 'Loading comments…';
    try { show(await client.list(anchor, append ? next ?? undefined : undefined), append); loaded = true; }
    catch (error) { failure(error); } finally { busy = false; }
  }
  details.ontoggle = () => { if (details.open && !loaded) void load(); };
  refresh.onclick = () => { void load(); }; older.onclick = () => { void load(true); };
  cancel.onclick = () => { if (pending) return; parentId = undefined; reply.textContent = ''; cancel.hidden = true; input.focus(); };
  form.onsubmit = async event => {
    event.preventDefault(); if (busy) return;
    if (!input.value.trim()) { status.textContent = 'Enter a comment.'; input.focus(); return; }
    pending ??= { resource: context.resource, anchor, revision: context.revision, quote,
      body: input.value.trim(), requestId: crypto.randomUUID(), ...(parentId ? { parentId } : {}) };
    remember(pending);
    busy = true; send.disabled = true; input.readOnly = true; status.textContent = 'Saving comment…';
    try {
      await client.add(pending); pending = null; remember(null); input.value = ''; parentId = undefined;
      reply.textContent = ''; cancel.hidden = true; input.readOnly = false;
      show(await client.list(anchor), false); status.textContent = 'Comment posted.'; input.focus();
    } catch (error) {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 409) { pending = null; remember(null); input.readOnly = false; }
      failure(error);
    } finally { busy = false; send.disabled = false; }
  };
  if (!signedIn) { status.textContent = 'Sign in to read and add comments.'; refresh.hidden = true; }
}
