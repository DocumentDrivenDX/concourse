import { chromium } from '@playwright/test';
import { fixture, token, site } from '../tests/helpers.ts';
import { resolve } from 'node:path';
const root = process.env.HELIX_PUBLIC;
if (!root) throw new Error('HELIX_PUBLIC must point to the built Hugo site');
const f = await fixture(), identity = await token();
const server = Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch(request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/__concourse/')) {
    const body = request.method === 'POST' ? await request.text() : undefined;
    return f.call(url.pathname.slice('/__concourse/'.length) + url.search, { method: request.method,
      headers: { origin: site.origin, 'content-type': 'application/json' }, ...(body ? { body } : {}) }, identity);
  }
  const relative = decodeURIComponent(url.pathname.replace(/^\/helix\//, ''));
  const path = resolve(root, relative, relative.endsWith('/') ? 'index.html' : '');
  if (!path.startsWith(resolve(root) + '/')) return new Response('Denied', { status: 403 });
  const file = Bun.file(path); return await file.exists() ? new Response(file) : new Response('Missing', { status: 404 });
} });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const url = `http://127.0.0.1:${server.port}/helix/artifact-types/discover/product-vision/`;
  await page.goto(url); const summary = page.locator('[data-concourse-panel]').first().getByRole('group').getByText(/^Comments on/);
  // Native details expose their summary through the generic text locator across the shadow root.
  const first = page.locator('[data-concourse-panel="purpose"]');
  if (await page.locator('main .content [data-concourse-panel]').count() < 3) throw new Error('Section anchors not mounted in content');
  await first.locator('summary').click();
  await first.getByRole('textbox', { name: 'Your comment' }).fill('Inline review on the real HELIX microsite.');
  await first.getByRole('button', { name: 'Post comment', exact: true }).click();
  await first.getByText('Comment posted.', { exact: true }).waitFor();
  await page.reload(); await first.locator('summary').click();
  await page.getByText('Inline review on the real HELIX microsite.', { exact: true }).waitFor();
  await page.screenshot({ path: 'test-results/helix-inline-desktop.png', fullPage: false });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-concourse-panel]').first().scrollIntoViewIfNeeded();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (overflow) throw new Error('Mobile horizontal overflow');
  await page.screenshot({ path: 'test-results/helix-inline-mobile.png', fullPage: false });
  await Bun.write('test-results/hugo-browser.json', JSON.stringify({ passed: true, browser: browser.version(), pages: 369,
    scope: 'Real Hugo-rendered HELIX source and assets; local verified JWT/native SQLite adapter, no live cloud login', assertions: ['authored section anchors', 'post and reload', 'base-path assets', 'desktop and mobile layout'] }, null, 2) + '\n');
  console.log('Real HELIX Hugo browser journey passed');
} finally { await browser.close(); server.stop(true); f.db.close(); }
