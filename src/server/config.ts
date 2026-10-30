import { Problem, type Site } from '../shared/types.ts';
import { object, text } from '../shared/validation.ts';
export function sites(raw: string): Site[] {
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.length || value.length > 100) throw new Error('Invalid sites');
  const ids = new Set<string>(); const origins = new Set<string>();
  return value.map(v => {
    const x = object(v);
    if (Object.keys(x).sort().join(',') !== 'audience,domains,emails,id,issuer,origin') throw new Error('Invalid site keys');
    const id = text(x.id, 128), origin = text(x.origin, 512), issuer = text(x.issuer, 512);
    const u = new URL(origin), i = new URL(issuer);
    if (u.protocol !== 'https:' || u.origin !== origin || i.protocol !== 'https:' || i.origin !== issuer || !i.hostname.endsWith('.cloudflareaccess.com')) throw new Error('Invalid origins');
    if (ids.has(id) || origins.has(origin)) throw new Error('Duplicate site');
    ids.add(id); origins.add(origin);
    const domains = list(x.domains), emails = list(x.emails);
    if (!domains.length && !emails.length) throw new Error('Empty membership');
    if (domains.some(d => !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(d)) || emails.some(e => !/^[^@\s]+@[^@\s]+$/.test(e))) throw new Error('Invalid membership');
    return { id, origin, issuer, audience: text(x.audience, 512), domains, emails };
  });
}
function list(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 1000) throw new Error('Invalid membership');
  return value.map(v => text(v, 320).toLowerCase());
}
export function siteFor(request: Request, configured: Site[]): Site {
  const origin = new URL(request.url).origin;
  const site = configured.find(s => s.origin === origin);
  if (!site) throw new Problem(404, 'Unknown site');
  return site;
}
