import { checkAccess } from './check-access.ts';
import { object, text } from '../shared/validation.ts';
export function publicationProbes(value: unknown, deployment?: string): string[] {
  const v = object(value);
  if (v.version !== 1 || Object.keys(v).some(k => !['version','origins','paths'].includes(k)) || !Array.isArray(v.origins) || !Array.isArray(v.paths) || !v.origins.length || !v.paths.length) throw new Error('Invalid publication probes');
  const origins = [...v.origins, ...(deployment ? [deployment] : [])].map(origin => {
    const u = new URL(text(origin, 1024));
    if (u.protocol !== 'https:' || u.username || u.password || u.pathname !== '/' || u.search || u.hash) throw new Error('Probe origin must be HTTPS without a path');
    return u.origin;
  });
  const paths = v.paths.map(path => {
    const s = text(path, 1024);
    if (!s.startsWith('/') || s.startsWith('//') || s.includes('\\') || s.includes('?') || s.includes('#') || s.includes('..')) throw new Error('Probe path must stay on origin');
    return s;
  });
  return [...new Set(origins.flatMap(origin => paths.map(path => new URL(path, origin).href)))];
}
if (import.meta.main) {
  const file = process.argv[2]; if (!file) throw new Error('Usage: check-publication.ts <probes.json> [deployment-origin]');
  await checkAccess(publicationProbes(await Bun.file(file).json(), process.argv[3]));
}
