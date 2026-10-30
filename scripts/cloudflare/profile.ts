import { sites } from '../../src/server/config.ts';

export type Profile = {
  name: string; account_id: string; compatibility_date: string;
  workers_dev: false; preview_urls: false;
  routes: { pattern: string; zone_id: string }[];
  vars: { SITES: string };
  d1_databases: { binding: 'DB'; database_name: string; database_id: string }[];
};

function record(value: unknown, keys: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected configuration object');
  const result = value as Record<string, unknown>;
  if (Object.keys(result).sort().join(',') !== keys.split(',').sort().join(',')) throw new Error('Unexpected or missing profile settings');
  return result;
}
function match(value: unknown, pattern: RegExp): string {
  if (typeof value !== 'string' || !pattern.test(value)) throw new Error('Invalid or placeholder profile value');
  return value;
}
const id = /^[a-f0-9]{32}$/;
const slug = /^[a-z0-9][a-z0-9-]{0,62}$/;

// A deliberately bounded subset of the pinned native Wrangler configuration.
// main/no_bundle/migrations_dir are fixed by release preparation, never caller hooks.
export function profile(value: unknown): Profile {
  const p = record(value, 'name,account_id,compatibility_date,workers_dev,preview_urls,routes,vars,d1_databases');
  match(p.name, slug); match(p.account_id, id);
  if (p.compatibility_date !== '2026-08-06' || p.workers_dev !== false || p.preview_urls !== false) throw new Error('Unsupported runtime or public alternate origin');
  const vars = record(p.vars, 'SITES');
  if (typeof vars.SITES !== 'string' || /REPLACE_|PLACEHOLDER/i.test(vars.SITES)) throw new Error('SITES must contain explicit installation values');
  const configured = sites(vars.SITES);
  const expected = new Set(configured.map(s => `${new URL(s.origin).hostname}/__concourse/*`));
  if (!Array.isArray(p.routes) || p.routes.length !== expected.size) throw new Error('Every configured site needs one route');
  for (const value of p.routes) {
    const route = record(value, 'pattern,zone_id');
    match(route.zone_id, id);
    if (typeof route.pattern !== 'string' || !expected.delete(route.pattern)) throw new Error('Unsafe, duplicate or unconfigured Worker route');
  }
  if (expected.size) throw new Error('Missing Worker route');
  if (!Array.isArray(p.d1_databases) || p.d1_databases.length !== 1) throw new Error('Exactly one comment database is required');
  const db = record(p.d1_databases[0], 'binding,database_name,database_id');
  if (db.binding !== 'DB') throw new Error('Expected DB binding');
  match(db.database_name, slug);
  match(db.database_id, /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/);
  if (db.database_id === '00000000-0000-0000-0000-000000000000') throw new Error('Placeholder database');
  // Routes are hostname-based; runtime lookup is exact-origin based.
  if (configured.some(s => new URL(s.origin).port !== '')) throw new Error('Cloudflare publication origins must use the default HTTPS port');
  return p as unknown as Profile;
}

export function wranglerConfig(p: Profile) {
  return { ...p, main: 'worker.js', no_bundle: true,
    d1_databases: p.d1_databases.map(db => ({ ...db, migrations_dir: 'migrations' })) };
}

export function fromWrangler(value: unknown): Profile {
  const config = record(value, 'name,account_id,compatibility_date,workers_dev,preview_urls,routes,vars,d1_databases,main,no_bundle');
  if (config.main !== 'worker.js' || config.no_bundle !== true) throw new Error('Release must use the reviewed bundle');
  if (!Array.isArray(config.d1_databases)) throw new Error('Missing database');
  const databases = config.d1_databases.map(value => {
    const db = record(value, 'binding,database_name,database_id,migrations_dir');
    if (db.migrations_dir !== 'migrations') throw new Error('Unsafe migrations path');
    const { migrations_dir: _, ...rest } = db;
    return rest;
  });
  const { main: _, no_bundle: __, ...rest } = config;
  return profile({ ...rest, d1_databases: databases });
}
