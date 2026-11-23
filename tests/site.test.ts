import { test, expect } from 'bun:test';
const hash = (value: string | Uint8Array) => new Bun.CryptoHasher('sha256').update(value).digest('hex');
test('microsite links, revision identity, asset inventory and independently reviewed guide sources stay current', async () => {
  const manifest = await Bun.file('dist/site/build.json').json();
  for (const name of ['index.html', 'guide.html', 'hosting.html']) {
    const source = await Bun.file(`site/${name}`).text(), built = await Bun.file(`dist/site/${name}`).text();
    expect(built).toContain(`data-resource="${name}"`); expect(built).toContain(`data-revision="${hash(source)}"`);
    expect(manifest.resources[name]).toBe(hash(source));
    const body = source.replace(/^<!-- helix:.* -->\n/gm, '');
    const review = source.match(/reviewed=\d{4}-\d{2}-\d{2}\/[^/\s]+\/([a-f0-9]{16})/);
    expect(review?.[1]).toBe(hash(body).slice(0,16));
    const sources = [...source.matchAll(/<!-- helix:source (\S+) sha256:([a-f0-9]{16}) -->/g)];
    expect(sources.length).toBeGreaterThan(2);
    for (const [, path, digest] of sources) {
      const value = await Bun.file(path!).text();
      expect(hash(value.split(/\r?\n/).map(l => l.trimEnd()).filter((_, i, a) => i < a.length - 1 || a[i] !== '').join('\n')).slice(0,16)).toBe(digest!);
    }
    for (const [, link] of built.matchAll(/(?:href|src)="(\/[^"#]*)(?:#[^"]*)?"/g)) {
      expect(await Bun.file(`dist/site${link === '/' ? '/index.html' : link}`).exists()).toBe(true);
    }
  }
  for (const [name, digest] of Object.entries(manifest.files)) expect(hash(await Bun.file(`dist/site/${name}`).bytes())).toBe(digest as string);
});
