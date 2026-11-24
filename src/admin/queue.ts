import type { Criteria, Family, QueuePage, QueueItem } from '../shared/management.ts';
import { Workspace, fresh } from './state.ts';
import { el, button, select, status, title, time } from './dom.ts';
import { detail } from './detail.ts';
export function queue(w: Workspace, family: Family, parent: HTMLElement): void {
  const state = w.queues[family]; parent.classList.toggle('detail-open', !!state.selected);
  const heading = el('h1', title(family));
  parent.append(heading, el('p', family === 'feedback' ? 'Private reports and suggestions, with their original publication context.' : 'Conversations across this publication. Search includes replies.', 'muted'));
  const form = filters(family, state.criteria, apply), split = el('div', '', 'split'), results = el('section', '', 'results'), pane = el('section', '', 'detail');
  results.setAttribute('aria-label', 'Search results'); pane.setAttribute('aria-label', 'Selected item');
  const notice = status('Loading results…'), list = el('ol', '', 'queue'), pager = el('div', '', 'pager');
  const previous = button('Previous page', () => { state.page--; state.selected = undefined; void load(); });
  const next = button('Next page', () => { state.page++; state.selected = undefined; void load(); });
  const refresh = button('Refresh results', () => { state.cursors = [undefined]; state.page = 0; void load(); });
  const back = button('Back to results', () => { split.classList.remove('selected'); parent.classList.remove('detail-open'); state.selected = undefined; w.save(); list.querySelector<HTMLButtonElement>('button')?.focus(); }, 'back');
  const detailHost = el('div'); pane.append(back, detailHost); detailHost.append(el('p', 'Select an item to review its context and history.', 'muted'));
  pager.append(previous, next, refresh); results.append(notice, list, pager); split.append(results, pane); parent.append(form, split);
  let generation = 0;
  function apply(criteria: Criteria) {
    state.criteria = criteria; state.page = 0; state.cursors = [undefined]; state.selected = undefined;
    split.classList.remove('selected'); w.save(); parent.replaceChildren(); queue(w, family, parent);
  }
  function context(resource: string, anchor: string) {
    state.criteria.filters = { ...state.criteria.filters, resource, anchor }; state.page = 0; state.cursors = [undefined]; w.save(); parent.replaceChildren(); queue(w, family, parent);
  }
  function open(id: number) {
    state.selected = id; w.save(); split.classList.add('selected'); parent.classList.add('detail-open');
    void detail(w, family, id, detailHost, () => { void load(false); }, context).then(() => {
      detailHost.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    });
    for (const li of list.children) li.querySelector('button')?.setAttribute('aria-pressed', String(li.getAttribute('data-id') === String(id)));
  }
  async function load(openSelection = true) {
    const current = ++generation; notice.textContent = 'Loading results…'; previous.disabled = next.disabled = true; w.save();
    try {
      const query = { ...state.criteria, cursor: state.cursors[state.page] ?? undefined };
      const page = await w.post<QueuePage>(`${family}/query`, query);
      if (current !== generation || !parent.isConnected) return;
      showPage(page, openSelection);
    } catch (error) {
      if (current !== generation) return;
      notice.textContent = 'Results unavailable. Your filters are retained.'; list.replaceChildren(); w.failure(results, error);
    }
  }
  function showPage(page: QueuePage, openSelection: boolean) {
      state.cursors[state.page + 1] = page.nextCursor ?? undefined;
      notice.textContent = `${page.matchedCount} matching ${family === 'feedback' ? 'feedback items' : 'threads'} · page ${state.page + 1} · observed ${time(page.observedAt)}`;
      list.replaceChildren();
      if (!page.items.length) list.append(el('li', emptyMessage(page.matchedCount, state.criteria)));
      for (const row of page.items) list.append(queueRow(row, state.selected, open));
      previous.disabled = state.page === 0; next.disabled = !page.nextCursor; w.save();
      if (openSelection && state.selected) open(state.selected);
      if (openSelection) window.scrollTo({ top: state.scroll ?? 0 });
  }
  void load();
}
function filters(family: Family, criteria: Criteria, apply: (query: Criteria) => void): HTMLFormElement {
  const form = el('form', '', 'filters'), fields = el('div', '', 'filter-grid');
  const inputs: Record<string, HTMLInputElement | HTMLSelectElement> = {};
  function input(key: string, label: string, value = '', type = 'text') {
    const wrapper = el('label', label), control = el('input'); control.type = type; if (type === 'datetime-local') control.step = '0.001'; control.value = value; wrapper.append(control); fields.append(wrapper); inputs[key] = control;
    if (key === 'q') { control.placeholder = 'Search messages and context'; control.maxLength = 200; }
  }
  function choose(key: string, label: string, choices: string[], value: string) {
    const control = select(label, choices, value); inputs[key] = control.input; fields.append(control.label);
  }
  const f = criteria.filters, datePrefix = family === 'feedback' ? 'created' : 'activity';
  input('q', 'Search', criteria.q);
  choose('statuses', 'Status', ['', ...(family === 'feedback' ? ['new', 'in_review', 'closed'] : ['open', 'resolved'])], (f.statuses as string[] | undefined)?.[0] ?? '');
  if (family === 'feedback') choose('kinds', 'Type', ['', 'question', 'problem', 'suggestion'], (f.kinds as string[] | undefined)?.[0] ?? '');
  input('resource', 'Resource', f.resource as string ?? ''); input('anchor', 'Section', f.anchor as string ?? '');
  input(datePrefix + 'From', family === 'feedback' ? 'Received from (UTC)' : 'Activity from (UTC)', String(f[datePrefix + 'From'] ?? '').replace(/Z$/, ''), 'datetime-local');
  input(datePrefix + 'To', 'Before time (UTC)', String(f[datePrefix + 'To'] ?? '').replace(/Z$/, ''), 'datetime-local');
  choose('sort', 'Sort', ['newest', 'oldest', family === 'feedback' ? 'kind' : 'activity'], criteria.sort);
  const submit = el('button', 'Apply filters', 'primary'); submit.type = 'submit';
  form.append(fields, submit, button('Clear filters', () => apply(fresh(family).criteria)));
  const error = status(); form.append(error);
  form.onsubmit = e => {
    e.preventDefault(); const filters: Criteria['filters'] = {};
    for (const [key, control] of Object.entries(inputs)) {
      if (!control.value || ['q', 'sort'].includes(key)) continue;
      filters[key] = filterValue(key, control.value);
    }
    if (filters.anchor && !filters.resource) { error.textContent = 'Enter a resource when filtering by section.'; return; }
    error.textContent = ''; apply({ q: inputs.q!.value, filters, sort: inputs.sort!.value, limit: criteria.limit });
  };
  return form;
}

function filterValue(key: string, value: string): string | string[] {
  if (['statuses', 'kinds'].includes(key)) return [value];
  if (key.endsWith('From') || key.endsWith('To')) return new Date(value + 'Z').toISOString();
  return value;
}
function queueRow(row: QueueItem, selected: number | undefined, open: (id: number) => void): HTMLLIElement {
  const li = el('li'); li.dataset.id = String(row.id);
  const b = button('', () => open(row.id)); b.setAttribute('aria-pressed', String(selected === row.id));
  b.append(el('span', `${title(row.status)}${row.kind ? ' · ' + title(row.kind) : ''}`, 'badge'), el('strong', row.excerpt + (row.truncated ? '…' : '')),
    el('span', `${row.resource} #${row.anchor || 'page'}`, 'muted'), el('span', `#${row.id} · ${row.author} · ${time(row.lastActivityAt ?? row.createdAt)}${row.replyCount !== undefined ? ` · ${row.replyCount} replies` : ''}`, 'muted'));
  li.append(b); return li;
}

function emptyMessage(count: number, criteria: Criteria): string {
  if (count) return 'No more matches. Refresh results.';
  if (criteria.q || Object.values(criteria.filters).some(v => v.length)) return 'No matches. Adjust filters or refresh.';
  return 'Nothing here yet. New contributions will appear after refresh.';
}
