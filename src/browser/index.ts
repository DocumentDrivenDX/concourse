import { Client } from './api.ts';
import { sectionPanel, type Context } from './panel.ts';
export async function mountComments(marker: HTMLElement): Promise<void> {
  if (marker.dataset.mounted) return;
  marker.dataset.mounted = 'true';
  const { site, resource, revision, api, css } = marker.dataset;
  if (!site || !resource || !revision || !api || !css) throw new Error('Incomplete Concourse configuration');
  const style = new URL(css, location.href);
  if (style.origin !== location.origin) throw new Error('Concourse assets must be same-origin');
  const context: Context = { site, resource, revision, api, css };
  const client = new Client(api, resource);
  let signedIn = false;
  try { const session = await client.request<{ subject: string }>('session'); context.subject = session.subject; signedIn = true; } catch { /* Explicit sign-in entrypoint, no anonymous data. */ }
  const main = document.querySelector<HTMLElement>('main .content') ?? document.querySelector<HTMLElement>('main article') ?? document.querySelector<HTMLElement>('main') ?? document.querySelector<HTMLElement>('article');
  if (!main) return;
  const headings = [...main.querySelectorAll<HTMLElement>('h2,h3,h4')];
  if (!headings.length) {
    const heading = document.createElement('span'); heading.id = 'page'; heading.textContent = document.title; main.append(heading); headings.push(heading);
  }
  const anchorOf = (h: HTMLElement) => h.id || h.querySelector<HTMLElement>('[id]')?.id || '';
  const ids = headings.map(anchorOf);
  for (const heading of headings) {
    const anchor = anchorOf(heading);
    if (!anchor || ids.filter(id => id === anchor).length !== 1) continue; // Ambiguous authored anchor: never attach silently.
    await sectionPanel(heading, context, client, signedIn, anchor);
  }
}
for (const marker of document.querySelectorAll<HTMLElement>('[data-concourse]')) {
  void mountComments(marker).catch(() => { marker.textContent = 'Comments unavailable.'; });
}
