import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { fixture, site, token } from '../tests/helpers.ts';
const f = await fixture(), member = await token(), owner = await token({ sub: 'owner', email: 'owner@example.org', name: 'Owner' });
let signedIn = false, maintain = false, interrupt = false, holdComments = true;
let releaseComments!: () => void;
const initialLoad = new Promise<void>(resolve => { releaseComments = resolve; });
const root = resolve('dist/site');
const server = Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch(request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/__concourse/')) {
    if (holdComments && request.method === 'GET' && url.pathname.endsWith('/comments')) await initialLoad;
    const body = request.method === 'POST' ? await request.text() : undefined;
    const result = await f.call(url.pathname.slice('/__concourse/'.length) + url.search, {
      method: request.method, headers: { 'content-type': 'application/json', origin: site.origin }, ...(body ? { body } : {}),
    }, signedIn ? maintain ? owner : member : null);
    if (interrupt && request.method === 'POST' && url.pathname.endsWith('/feedback')) { interrupt = false; return new Response('Response lost after save', { status: 503 }); }
    return result;
  }
  const path = resolve(root, '.' + decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
  if (!path.startsWith(root + '/')) return new Response('Denied', { status: 403 });
  const file = Bun.file(path); return await file.exists() ? new Response(file) : new Response('Missing', { status: 404 });
} });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
const url = `http://127.0.0.1:${server.port}`;
try {
  await page.goto(url);
  const widget = page.locator('[data-concourse-feedback]');
  await widget.locator('summary').first().click();
  await widget.getByRole('link', { name: 'Sign in to send feedback' }).waitFor();
  if (await widget.getByRole('button', { name: 'Submit feedback' }).isVisible()) throw new Error('Anonymous submission form');
  signedIn = true; await page.reload();
  const panel = page.locator('[data-concourse-panel="try-it"]'); await panel.locator('summary').click();
  await panel.getByText('Loading comments…', { exact: true }).waitFor();
  if (!await panel.getByRole('button', { name: 'Post comment', exact: true }).isDisabled()) throw new Error('Submit enabled during initial read');
  holdComments = false; releaseComments();
  await panel.getByRole('textbox', { name: 'Your comment' }).fill('Testing comments on the actual Concourse microsite.');
  await panel.getByRole('button', { name: 'Post comment', exact: true }).click();
  await panel.getByText('Comment posted.', { exact: true }).waitFor();
  await page.reload(); await panel.locator('summary').click();
  await panel.getByText('Testing comments on the actual Concourse microsite.', { exact: true }).waitFor();
  await page.locator('#try-it').evaluate(e => { const r = document.createRange(); r.selectNodeContents(e); const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r); });
  await widget.locator('summary').first().click();
  await widget.getByText('Selected text: Start the conversation here.', { exact: true }).waitFor();
  if (await widget.getByText('Feedback inbox', { exact: true }).count()) throw new Error('Member inbox disclosed');
  const feedback = widget.getByRole('textbox', { name: 'Your feedback', exact: true });
  await widget.getByLabel('Feedback type').selectOption('problem'); await widget.getByLabel('Section', { exact: true }).selectOption('try-it');
  await feedback.fill('Private feedback draft retained across reload.');
  await page.reload(); await widget.locator('summary').first().focus(); await page.keyboard.press('Enter');
  if (await feedback.inputValue() !== 'Private feedback draft retained across reload.') throw new Error('Unsent draft lost');
  interrupt = true; await widget.getByRole('button', { name: 'Submit feedback', exact: true }).click();
  await widget.getByText('Save outcome unknown.', { exact: false }).waitFor();
  if (await feedback.isEnabled()) throw new Error('Pending payload editable');
  await page.reload(); await widget.locator('summary').first().click();
  if (await feedback.inputValue() !== 'Private feedback draft retained across reload.') throw new Error('Pending draft lost');
  await widget.getByRole('button', { name: 'Submit feedback', exact: true }).click();
  await widget.getByText('Feedback received. Reference #1.', { exact: true }).waitFor();
  if ((f.db.query('SELECT count(*) AS n FROM feedback').get() as { n: number }).n !== 1) throw new Error('Duplicate feedback');
  await page.reload(); await widget.locator('summary').first().click();
  if (await feedback.inputValue()) throw new Error('Successful draft not cleared');
  await feedback.fill('Member-only draft');
  maintain = true; await page.reload(); await widget.locator('summary').first().click();
  if (await feedback.inputValue()) throw new Error('Cross-principal draft leak');
  await widget.getByText('Feedback inbox', { exact: true }).click();
  await widget.getByText('Private feedback draft retained across reload.', { exact: true }).waitFor();
  await mkdir('test-results', { recursive: true }); await page.screenshot({ path: 'test-results/concourse-feedback-inbox.png' });
  await widget.locator('summary').first().click();
  await page.screenshot({ path: 'test-results/concourse-site-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 }); await widget.locator('summary').first().click();
  await feedback.focus(); await page.keyboard.press('Tab');
  if (!await widget.getByRole('button', { name: 'Submit feedback' }).evaluate(e => e === (e.getRootNode() as ShadowRoot).activeElement)) throw new Error('Feedback keyboard submit unreachable');
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Mobile overflow');
  await page.screenshot({ path: 'test-results/concourse-site-mobile.png' });
  for (const path of ['/guide.html', '/hosting.html']) {
    await page.goto(url + path); await page.locator('[data-concourse-feedback]').waitFor();
    if (await page.locator('main [data-concourse-panel]').count() < 3) throw new Error(`Missing integration ${path}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  await Bun.write('test-results/site-browser.json', JSON.stringify({ passed: true, browser: browser.version(),
    scope: 'Actual built Concourse site and production browser code; verified synthetic JWT/native SQLite test adapter, not a live Google or Cloudflare journey',
    assertions: ['anonymous sign-in, no submit/inbox', 'comment post and reload', 'feedback draft reload', 'response loss and replay without duplicates', 'principal-scoped drafts', 'private maintainer inbox', 'keyboard submit', 'mobile overflow', 'all documentation pages mounted'] }, null, 2) + '\n');
  console.log('Concourse site browser journey passed');
} catch (error) {
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/concourse-site-failure.png', fullPage: true });
  console.error(await page.locator('[data-concourse-panel="try-it"]').innerText().catch(() => 'No try-it panel'));
  console.error(errors); throw error;
} finally { releaseComments(); await browser.close(); server.stop(true); f.db.close(); }
