import { Problem, type CommentInput } from './types.ts';
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Problem(400, 'Invalid object');
  return value as Record<string, unknown>;
}
export function text(value: unknown, max: number, empty = false): string {
  if (typeof value !== 'string' || (!empty && !value.trim()) || [...value].length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) {
    throw new Problem(400, 'Invalid text');
  }
  return value.trim();
}
export function integer(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) throw new Problem(400, 'Invalid identifier');
  return value;
}
export function commentInput(value: unknown): CommentInput {
  const v = object(value);
  const keys = ['resource', 'anchor', 'revision', 'quote', 'body', 'requestId', 'parentId'];
  if (Object.keys(v).some(k => !keys.includes(k))) throw new Problem(400, 'Unknown field');
  const requestId = text(v.requestId, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) throw new Problem(400, 'Invalid retry key');
  return { resource: text(v.resource, 512), anchor: text(v.anchor, 512), revision: text(v.revision, 128),
    quote: text(v.quote, 500, true), body: text(v.body, 4000), requestId,
    ...(v.parentId === undefined ? {} : { parentId: integer(v.parentId) }) };
}
export async function readJson(request: Request): Promise<unknown> {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') ?? '')) throw new Problem(400, 'JSON required');
  if (Number(request.headers.get('content-length')) > 16384) throw new Problem(413, 'Body too large');
  const reader = request.body?.getReader();
  if (!reader) throw new Problem(400, 'Body required');
  const chunks: Uint8Array[] = []; let size = 0;
  for (;;) {
    const part = await reader.read(); if (part.done) break;
    size += part.value.byteLength;
    if (size > 16384) { await reader.cancel(); throw new Problem(413, 'Body too large'); }
    chunks.push(part.value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new Problem(400, 'Invalid JSON'); }
}
