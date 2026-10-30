import { resolve, relative } from 'node:path';
export async function violations(root: string): Promise<string[]> {
  const errors: string[] = [];
  const allowed: Record<string, string[]> = { shared: ['shared'], server: ['server', 'shared'], browser: ['browser', 'shared'], cli: ['cli', 'shared'] };
  for await (const file of new Bun.Glob('src/**/*.ts').scan(root)) {
    const source = await Bun.file(resolve(root, file)).text(), owner = file.split('/')[1] ?? '';
    if (source.split('\n').length > 500) errors.push(`${file}: source exceeds 500 lines`);
    for (const match of source.matchAll(/(?:from\s*|import\s*\()['"]([^'"]+)['"]/g)) {
      const name = match[1] ?? '';
      if ((owner === 'shared' || owner === 'browser') && /^(node:|bun|jose)/.test(name)) errors.push(`${file}: forbidden runtime dependency ${name}`);
      if (name.startsWith('.')) {
        const imported = relative(resolve(root, 'src'), resolve(root, file, '..', name)).split('/')[0] ?? '';
        if (!allowed[owner]?.includes(imported)) errors.push(`${file}: forbidden ${imported} dependency`);
      }
    }
  }
  return errors;
}
if (import.meta.main) {
  const errors = await violations(process.cwd());
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log('Source module boundaries and file ceilings verified');
}
