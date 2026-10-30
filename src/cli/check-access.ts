export function isAccessChallenge(response: Response): boolean {
  if (response.status !== 302) return false;
  try {
    const location = new URL(response.headers.get('location') ?? '');
    return location.protocol === 'https:' && /^[a-z0-9-]+\.cloudflareaccess\.com$/.test(location.hostname)
      && location.pathname.startsWith('/cdn-cgi/access/login/');
  } catch { return false; }
}
export async function checkAccess(urls: string[]): Promise<void> {
  if (!urls.length) throw new Error('At least one protected HTTPS URL is required');
  for (const raw of urls) {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Protected probes require HTTPS');
    const response = await fetch(url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(20000) });
    await response.body?.cancel();
    if (!isAccessChallenge(response)) throw new Error(`Access challenge missing: ${url.origin}${url.pathname} (${response.status})`);
    console.log(`Access challenge verified: ${url.origin}${url.pathname}`);
  }
}
if (import.meta.main) await checkAccess(process.argv.slice(2));
