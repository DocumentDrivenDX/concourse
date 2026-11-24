import type { Family, Summary, QueuePage } from '../shared/management.ts';
import type { Session } from '../shared/types.ts';
import { Workspace, fresh } from './state.ts';
import { el, button, select, status, title, time } from './dom.ts';
import { queue } from './queue.ts';
const root = document.querySelector<HTMLElement>('#workspace')!;
async function start(): Promise<void> {
  const w = new Workspace({ subject: '', displayName: '', canReviewFeedback: false });
  try {
    const session = await w.client.request<Session>('session');
    if (!session.canManageFeedback && !session.canManageDiscussions) throw new Error('Workspace permission required.');
    mount(new Workspace(session));
  } catch (error) { root.replaceChildren(el('h1', 'Maintainer workspace')); w.failure(root, error); }
}
function mount(w: Workspace): void {
  root.replaceChildren();
  const header = el('header'), brand = el('a', 'concourse', 'brand'); brand.href = '/';
  header.append(brand, el('span', 'Maintainer workspace'), el('span', w.session.displayName, 'identity'));
  const layout = el('div', '', 'layout'), nav = el('nav'), main = el('main'); main.id = 'main';
  nav.setAttribute('aria-label', 'Workspace');
  const views: (Family | 'overview')[] = ['overview', ...(['feedback', 'discussions'] as Family[]).filter(f => w.allowed(f))];
  for (const view of views) {
    const b = button(title(view), () => show(view)); b.dataset.view = view; nav.append(b);
  }
  const publication = el('a', 'Back to publication'); publication.href = '/'; nav.append(publication);
  layout.append(nav, main); root.append(header, layout);
  function show(view: Family | 'overview') {
    if (view !== 'overview' && !w.allowed(view)) view = 'overview';
    if (w.view !== 'overview') w.queues[w.view].scroll = window.scrollY;
    w.view = view; w.save(); main.replaceChildren();
    for (const b of nav.querySelectorAll('button')) b.setAttribute('aria-current', String(b.dataset.view === view));
    const recovery = el('aside', '', 'recovery'); main.append(recovery);
    w.onChange = () => {
      recovery.replaceChildren(); recovery.hidden = !w.pending;
      if (w.pending) recovery.append(status('A review has an unknown outcome. Recover it before making another change.'),
        button('Open pending review', () => { const p = w.pending; if (p) { w.queues[p.family].selected = p.id; show(p.family); } }));
    };
    w.onChange();
    const content = el('div'); main.append(content);
    if (view === 'overview') overview(w, content, (family, filters, id) => {
      w.queues[family] = fresh(family); w.queues[family].criteria.filters = filters; w.queues[family].selected = id; show(family);
    });
    else queue(w, view, content);
  }
  show(w.view);
}
function overview(w: Workspace, parent: HTMLElement, open: (family: Family, filters: Record<string, string | string[]>, id?: number) => void): void {
  parent.append(el('p', 'YOUR PUBLICATION, IN CONVERSATION', 'eyebrow'), el('h1', 'What needs attention?'), el('p', 'Feedback reports and discussion threads are counted separately.', 'muted'));
  const period = select('Period', ['all_time', 'last_7_days', 'last_30_days'], 'all_time'); parent.append(period.label);
  const sections = el('div', '', 'overview'); parent.append(sections);
  function load() {
    sections.replaceChildren();
    for (const family of (['feedback', 'discussions'] as Family[]).filter(f => w.allowed(f))) {
      const section = el('section', '', 'dashboard-section'); sections.append(section);
      const filters: Record<string, string | string[]> = {};
      Object.assign(filters, periodFilter(family, period.input.value));
      void populate(family, filters, section);
    }
  }
  async function populate(family: Family, filters: Record<string, string | string[]>, section: HTMLElement) {
    section.append(el('h2', title(family)), status('Loading counts…'));
    try {
      const s = await w.post<Summary>(`${family}/summary`, { filters });
      if (!section.isConnected) return;
      section.replaceChildren(el('h2', title(family)), el('p', family === 'feedback' ? 'By received time · New means untriaged, not unread.' : 'By latest contribution · Replies can reopen resolved threads.', 'muted'));
      const cards = el('div', '', 'cards');
      for (const [state, count] of Object.entries(s.statusCounts)) {
        const b = button('', () => open(family, { ...filters, statuses: [state] }), 'card'); b.append(el('strong', String(count)), el('span', title(state))); cards.append(b);
      }
      section.append(cards, el('p', family === 'feedback' ? `${s.total} feedback items` : `${s.threadCount} threads · ${s.contributionCount} contributions`, 'muted'), el('p', `Observed ${time(s.observedAt)}`, 'muted'), button(`View ${family}`, () => open(family, filters)));
      if (s.oldestNewCreatedAt) section.append(el('p', `Oldest new feedback received ${time(s.oldestNewCreatedAt)}`, 'muted'));
      section.append(el('h3', 'Recent activity'));
      await recent(family, filters, section);
    } catch (error) { section.replaceChildren(el('h2', title(family)), status('Counts unavailable.')); w.failure(section, error); }
  }
  async function recent(family: Family, filters: Record<string, string | string[]>, section: HTMLElement) {
    try {
      const page = await w.post<QueuePage>(`${family}/query`, { filters, limit: 5 });
      if (!section.isConnected) return;
      const list = el('ul');
      for (const r of page.items) { const li = el('li'); li.append(button(`#${r.id} · ${r.excerpt}`, () => open(family, filters, r.id))); list.append(li); }
      section.append(page.items.length ? list : el('p', 'No activity in this period.'));
    } catch (error) { section.append(status('Recent activity unavailable.')); w.failure(section, error); }
  }
  period.input.onchange = load; parent.append(button('Refresh overview', load)); load();
}
void start();

function periodFilter(family: Family, period: string): Record<string, string> {
  if (period === 'all_time') return {};
  const from = new Date(Date.now() - (period === 'last_7_days' ? 7 : 30) * 86400000).toISOString();
  return { [family === 'feedback' ? 'createdFrom' : 'activityFrom']: from };
}
