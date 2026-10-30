import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { Problem, type Principal, type Site } from '../shared/types.ts';
const keys = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
export async function authenticate(request: Request, site: Site, resolver?: JWTVerifyGetKey): Promise<Principal> {
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token || token.length > 16384) throw new Problem(401, 'Sign in required');
  let jwks: JWTVerifyGetKey | undefined = resolver ?? keys.get(site.issuer);
  if (!jwks) {
    const remote = createRemoteJWKSet(new URL('/cdn-cgi/access/certs', site.issuer), { timeoutDuration: 5000 });
    keys.set(site.issuer, remote); jwks = remote;
  }
  let payload;
  try { ({ payload } = await jwtVerify(token, jwks, { issuer: site.issuer, audience: site.audience,
    algorithms: ['RS256'], requiredClaims: ['exp', 'iat', 'sub', 'email'] })); }
  catch { throw new Problem(401, 'Sign in required'); }
  if (typeof payload.sub !== 'string' || !payload.sub || typeof payload.email !== 'string' || !/^[^@\s]+@[^@\s]+$/.test(payload.email) || payload.type === 'service' || payload.common_name) throw new Problem(401, 'Human identity required');
  const email = payload.email.toLowerCase();
  if (!site.emails.includes(email) && !site.domains.includes(email.split('@')[1] ?? '')) throw new Problem(403, 'Membership required');
  const subject = `${site.issuer}|${payload.sub}`;
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(subject)));
  const label = [...digest.slice(0, 4)].map(n => n.toString(16).padStart(2, '0')).join('');
  const displayName = typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim().slice(0, 80) : `Reviewer ${label}`;
  return { subject, displayName, email };
}
