import { Database } from 'bun:sqlite';
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from 'jose';
import { CommentStore, type Connection } from '../src/server/store.ts';
import { authenticate } from '../src/server/auth.ts';
import { handle } from '../src/server/http.ts';
import type { Site, CommentInput } from '../src/shared/types.ts';
export const site: Site = { id: 'guide', origin: 'https://guide.example', issuer: 'https://team.cloudflareaccess.com', audience: 'guide-aud', domains: ['example.org'], emails: [] };
const pair = await generateKeyPair('RS256');
export const jwk = await exportJWK(pair.publicKey); jwk.kid = 'test-key'; jwk.alg = 'RS256';
export const resolver = createLocalJWKSet({ keys: [jwk] });
export async function token(overrides: Record<string, unknown> = {}): Promise<string> {
  return new SignJWT({ sub: 'person-1', email: 'mira@example.org', name: 'Mira', iss: site.issuer, aud: site.audience,
    iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 300, ...overrides })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).sign(pair.privateKey);
}
export function database(): { db: Database; connection: Connection; store: CommentStore } {
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  const connection = { prepare(sql: string) { let values: unknown[] = [];
    const statement = { bind(...args: unknown[]) { values = args; return statement; },
      async first() { return db.query(sql).get(...values as never[]) ?? null; },
      async all() { return { results: db.query(sql).all(...values as never[]) }; } };
    return statement;
  } } as unknown as Connection;
  return { db, connection, store: new CommentStore(connection) };
}
export function input(overrides: Partial<CommentInput> = {}): CommentInput {
  return { resource: 'reference/keys.md', anchor: 'equality', revision: 'v1', quote: 'Equality',
    body: 'Clarify nullability.', requestId: crypto.randomUUID(), ...overrides };
}
export async function fixture() {
  const data = database(); data.db.exec(await Bun.file('migrations/0001_comments.sql').text());
  const configured = [site, { ...site, id: 'second', origin: 'https://second.example', audience: 'second-aud' }];
  const call = async (path: string, init: RequestInit = {}, identity: string | null | undefined = undefined, origin = site.origin) => {
    if (identity === undefined) identity = await token();
    const headers = new Headers(init.headers); if (identity) headers.set('Cf-Access-Jwt-Assertion', identity);
    return handle(new Request(origin + '/__concourse/' + path, { ...init, headers }), {
      sites: configured, store: data.store, authenticate: (r, s) => authenticate(r, s, resolver),
    });
  };
  const post = (value: unknown, identity?: string | null, origin = site.origin) => call('comments', {
    method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(value),
  }, identity, origin);
  return { ...data, call, post };
}
