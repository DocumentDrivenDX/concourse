// Migration files in this repository use one top-level statement per terminated
// line/block. Trigger bodies terminate with a standalone END; (not inner ;).
export function statements(sql) {
  const result = []; let block = '', trigger = false;
  for (const line of sql.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('--')) continue;
    block += line + '\n';
    if (/^CREATE TRIGGER\b/i.test(block.trim())) trigger = true;
    if (trigger ? /^END;\s*$/i.test(line) : /;\s*$/.test(line)) { result.push(block); block = ''; trigger = false; }
  }
  if (block.trim()) throw new Error('Unterminated migration statement');
  return result;
}
