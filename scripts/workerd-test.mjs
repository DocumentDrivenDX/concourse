import { Miniflare } from 'miniflare';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
const site = { id: 'guide', origin: 'https://guide.example', issuer: 'https://team.cloudflareaccess.com', audience: 'guide-aud', domains: ['example.org'], emails: [] };
const pair = await generateKeyPair('RS256'), jwk = await exportJWK(pair.publicKey);
jwk.kid = 'test'; jwk.alg = 'RS256';
const identity = await new SignJWT({ email: 'mira@example.org', name: 'Mira' })
  .setSubject('person-1').setIssuer(site.issuer).setAudience(site.audience).setIssuedAt().setExpirationTime('5m')
  .setProtectedHeader({ alg: 'RS256', kid: 'test' }).sign(pair.privateKey);
const payload = { resource: 'reference/keys.md', anchor: 'equality', revision: 'v1', quote: 'Equality', body: 'Native D1 comment', requestId: randomUUID() };
const mf = new Miniflare({ modules: true, scriptPath: 'dist/worker.js', compatibilityDate: '2026-08-06',
  bindings: { SITES: JSON.stringify([site]) }, d1Databases: ['DB'],
  outboundService: async request => {
    if (request.url !== site.issuer + '/cdn-cgi/access/certs') throw new Error('Unexpected outbound fetch');
    return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'content-type': 'application/json' } });
  },
});
try {
  const db = await mf.getD1Database('DB');
  const sql = await readFile('migrations/0001_comments.sql', 'utf8');
  for (const statement of sql.split(';').filter(s => s.trim())) await db.prepare(statement).run();
  const post = () => mf.dispatchFetch(site.origin + '/__concourse/comments', { method: 'POST',
    headers: { 'content-type': 'application/json', origin: site.origin, 'Cf-Access-Jwt-Assertion': identity }, body: JSON.stringify(payload) });
  const first = await post(); if (first.status !== 201) throw new Error(`First write ${first.status}: ${await first.text()}`); await first.text();
  const replay = await post(); if (replay.status !== 200) throw new Error(`Replay ${replay.status}: ${await replay.text()}`); await replay.text();
  const read = await mf.dispatchFetch(site.origin + '/__concourse/comments?resource=reference%2Fkeys.md&anchor=equality', { headers: { 'Cf-Access-Jwt-Assertion': identity } });
  const page = await read.json(); if (page.comments.length !== 1) throw new Error('D1 replay duplicate');
  const denied = await mf.dispatchFetch(site.origin + '/__concourse/session'); if (denied.status !== 401) throw new Error('Unsigned access'); await denied.text();
  await mkdir('test-results', { recursive: true });
  await writeFile('test-results/workerd.json', JSON.stringify({ passed: true, node: process.version, compatibilityDate: '2026-08-06',
    scope: 'Unmodified production Worker on local workerd/D1; outbound JWKS supplies signed synthetic identity; no cloud/provider login acceptance',
    assertions: ['RS256 verified through Worker remote-JWKS path', 'D1 migration and prepared INSERT RETURNING', 'native same-key replay', 'first-primary session reads', 'missing credential denial'] }, null, 2) + '\n');
  console.log('Local workerd/D1 proof passed');
} finally { await mf.dispose(); }
