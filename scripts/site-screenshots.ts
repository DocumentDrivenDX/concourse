// Public documentation images: actual application, isolated synthetic data only.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fixture, token, site, input } from '../tests/helpers.ts';
import { FeedbackStore } from '../src/server/feedback.ts';
import { D1Management } from '../src/server/management/d1/repository.ts';
const f = await fixture(), actor = { subject: 'demo', displayName: 'Sample reviewer', email: 'owner@example.org' };
const identity = await token({ sub: actor.subject, email: actor.email, name: actor.displayName });
const feedback = new FeedbackStore(f.connection), review = new D1Management(f.connection);
const messages = [
  ['problem', 'The Google sign-in link is difficult to find on mobile.', 'guide.html', 'feedback'],
  ['question', 'Can one installation support several publications?', 'hosting.html', 'cloudflare'],
  ['suggestion', 'Add an example of the Batten volume publication plugin.', 'hosting.html', 'databricks'],
  ['question', 'How does discussion context survive a new revision?', 'guide.html', 'install-static'],
  ['suggestion', 'Show a short checklist for reviewing incoming feedback.', 'guide.html', 'admin-ui'],
  ['problem', 'Clarify which preview URLs must require sign-in.', 'hosting.html', 'public-private'],
] as const;
for (const [kind, body, resource, anchor] of messages) await feedback.add(site.id, actor, { ...input({ body, resource, anchor, revision: 'example-revision', quote: '' }), kind });
for (const [id, status] of [[1, 'in_review'], [2, 'closed']] as const) await review.review(site.id, 'feedback', id, actor, { status, expectedVersion: 0, requestId: crypto.randomUUID() });
await f.store.add(site.id, actor, input({ body: 'Should the volume plugin serve the complete static directory?', resource: 'hosting.html', anchor: 'databricks', quote: 'Batten on Databricks Apps.', revision: 'example-revision' }));
await f.store.add(site.id, actor, input({ parentId: 1, body: 'Yes. Keep relative assets and downloads behind the same application proxy.', resource: 'hosting.html', anchor: 'databricks', quote: 'Batten on Databricks Apps.', revision: 'example-revision' }));
await f.store.add(site.id, actor, input({ body: 'What happens when a reader replies to a resolved thread?', resource: 'guide.html', anchor: 'admin-ui', quote: '', revision: 'example-revision' }));
await review.review(site.id, 'discussions', 3, actor, { status: 'resolved', expectedVersion: 0, expectedLatestContributionId: 3, requestId: crypto.randomUUID() });
const server = Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch(request) {
  const u = new URL(request.url), body = request.method === 'POST' ? await request.text() : undefined;
  return f.call(u.pathname.slice('/__concourse/'.length) + u.search, { method: request.method,
    headers: { origin: site.origin, 'content-type': 'application/json' }, ...(body ? { body } : {}) }, identity);
} });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 1440, height: 1080 }, deviceScaleFactor: 1 });
const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
try {
  await page.goto(`http://127.0.0.1:${server.port}/__concourse/admin/`);
  await page.getByText('6 feedback items', { exact: true }).waitFor();
  await page.getByRole('button', { name: '#6 · Clarify which preview URLs must require sign-in.', exact: true }).waitFor();
  await mkdir('site/images', { recursive: true });
  const dimensions: Record<string, {width: number; height: number}> = {};
  async function capture(name: string) {
    dimensions[name] = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
    await page.screenshot({ path: 'site/images/' + name, fullPage: true, type: 'jpeg', quality: 85 });
  }
  await capture('admin-overview.jpg');
  await page.getByRole('navigation', { name: 'Workspace' }).getByRole('button', { name: 'Feedback', exact: true }).click();
  await page.getByLabel('Search', { exact: true }).fill('Google');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await page.locator('.queue button').first().click();
  await page.getByRole('heading', { name: 'Feedback #1', exact: true }).waitFor();
  await capture('admin-feedback.jpg');
  await page.getByRole('navigation', { name: 'Workspace' }).getByRole('button', { name: 'Discussions', exact: true }).click();
  await page.getByLabel('Search', { exact: true }).fill('downloads');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await page.locator('.queue button').first().click();
  await page.getByRole('heading', { name: 'Discussion #1', exact: true }).waitFor();
  await capture('admin-discussions.jpg');
  await Bun.write('site/images/screenshots.json', JSON.stringify(dimensions, null, 2) + '\n');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Captured three public admin screenshots from isolated synthetic data.');
} finally { await browser.close(); server.stop(true); f.db.close(); }
