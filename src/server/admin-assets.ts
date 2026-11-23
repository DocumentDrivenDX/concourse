import { Problem } from '../shared/types.ts';
export interface AdminAsset { body: string; contentType: string }
declare const __ADMIN_ASSETS__: Record<string, AdminAsset>;
export function builtAssets(): Record<string, AdminAsset> {
  return typeof __ADMIN_ASSETS__ === 'undefined' ? {} : __ADMIN_ASSETS__;
}
export function assetResponse(path: string, assets: Record<string, AdminAsset>): Response {
  const file = assets[path]; if (!file) throw new Problem(404, 'Unknown asset');
  return new Response(file.body, { headers: { 'content-type': file.contentType, 'cache-control': 'no-store',
    'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
    'content-security-policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'" } });
}
