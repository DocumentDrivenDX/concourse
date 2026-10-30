import { chromium } from '@playwright/test';
import { fixture, token, site } from '../tests/helpers.ts';
import { readFile, mkdir } from 'node:fs/promises';
const f = await fixture(), identity = await token();
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Review guide</title><main><article><h1>Guide</h1><h2 id="equality">Equality</h2><p id="signed-source">Source content remains unchanged.</p></article></main><div data-concourse data-site="guide" data-resource="reference/keys.md" data-revision="v1" data-api="/__concourse/" data-css="/concourse.css"></div><script type="module" src="/concourse.js"></script></html>`;
let signedIn = true, loseNext = false;
const server = Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch(request) {
  const url = new URL(request.url);
  if (url.pathname === '/concourse.js') return new Response(await readFile('dist/concourse.js'), { headers: { 'content-type': 'text/javascript' } });
  if (url.pathname === '/concourse.css') return new Response(await readFile('dist/concourse.css'), { headers: { 'content-type': 'text/css' } });
  if (!url.pathname.startsWith('/__concourse/')) return new Response(html, { headers: { 'content-type': 'text/html' } });
  const path = url.pathname.slice('/__concourse/'.length) + url.search;
  const body = request.method === 'POST' ? await request.text() : undefined;
  const result = await f.call(path, { method: request.method, headers: { 'content-type': 'application/json', origin: site.origin }, ...(body ? { body } : {}) }, signedIn ? identity : null);
  if (loseNext && request.method === 'POST') { loseNext = false; return new Response('Interrupted after commit', { status: 503 }); }
  return result;
} });
// This adapter is test-only: production Worker has no token minting/header override.
const executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage(); const problems: string[] = [];
page.on('pageerror', error => problems.push(error.message));
try {
  await page.goto(`http://127.0.0.1:${server.port}/helix/reference/`);
  const summary = page.getByText('Comments on Equality', { exact: true }); await summary.click();
  await page.getByText('No comments yet. Start the discussion.', { exact: true }).waitFor();
  const input = page.getByRole('textbox', { name: 'Your comment' });
  await input.fill('Inline review from Mira.'); await page.getByRole('button', { name: 'Post comment', exact: true }).click();
  await page.getByText('Comment posted.', { exact: true }).waitFor();
  await page.reload(); await summary.click();
  await page.getByText('Inline review from Mira.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Reply to comment 1', exact: true }).click();
  await input.fill('Reply after reload.'); await page.getByRole('button', { name: 'Post comment', exact: true }).click();
  await page.getByText('Comment posted.', { exact: true }).waitFor();
  loseNext = true; await input.fill('Recovered after response loss.');
  await page.getByRole('button', { name: 'Post comment', exact: true }).click();
  await page.getByText('Save outcome unknown.', { exact: false }).waitFor();
  if (await input.inputValue() !== 'Recovered after response loss.') throw new Error('Lost draft');
  await page.reload(); await summary.click();
  if (await input.inputValue() !== 'Recovered after response loss.') throw new Error('Retry draft not restored after reload');
  await page.getByRole('button', { name: 'Post comment', exact: true }).click();
  await page.getByText('Comment posted.', { exact: true }).waitFor();
  const n = f.db.query('SELECT count(*) AS n FROM comments').get() as { n: number };
  if (n.n !== 3) throw new Error(`Duplicate recovery: ${n.n}`);
  if (await page.locator('#signed-source').textContent() !== 'Source content remains unchanged.') throw new Error('Source changed');
  await page.evaluate(() => { const root = document.querySelector<HTMLElement>('[data-concourse]'); if (root) root.dataset.revision = 'v2'; });
  // Render a new publication revision without changing the persisted discussion.
  await page.route('**/helix/revised/', route => route.fulfill({ contentType: 'text/html', body: html.replace('data-revision="v1"','data-revision="v2"') }));
  await page.goto(`http://127.0.0.1:${server.port}/helix/revised/`); await summary.click();
  await page.getByText('From an earlier or different revision.', { exact: true }).first().waitFor();
  await input.focus(); if (!await input.evaluate(e => e === (e.getRootNode() as ShadowRoot).activeElement)) throw new Error('Input focus broken');
  await page.keyboard.type('Keyboard draft'); await page.keyboard.press('Tab');
  if (!await page.getByRole('button', { name: 'Post comment', exact: true }).evaluate(e => e === (e.getRootNode() as ShadowRoot).activeElement)) throw new Error('Keyboard submit unreachable');
  await mkdir('test-results', { recursive: true }); await page.screenshot({ path: 'test-results/inline-comments.png', fullPage: true });
  signedIn = false; await page.goto(`http://127.0.0.1:${server.port}/helix/reference/`); await summary.click();
  await page.getByRole('link', { name: 'Sign in to comment' }).waitFor();
  if (await page.getByText('Inline review from Mira.', { exact: true }).count()) throw new Error('Anonymous disclosure');
  if (problems.length) throw new Error(problems.join('\n'));
  await Bun.write('test-results/browser.json', JSON.stringify({ passed: true, browser: browser.version(), scope: 'Real Chromium, signed test JWT, native SQLite via test-only host adapter; no live provider/cloud acceptance', assertions: ['inline post/reload/reply', 'response-loss recovery without duplicate', 'source unchanged', 'revision context', 'keyboard focus/submit', 'anonymous login and no disclosure'] }, null, 2) + '\n');
  console.log('Browser journey passed: post/reload/reply, uncertain-write recovery, revision, keyboard, anonymous denial');
} finally { await browser.close(); server.stop(true); f.db.close(); }
