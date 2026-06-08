import type { PageContext } from './types';

// All requests run from the content script on the Liferay origin, so the user's
// session cookie is sent automatically (credentials: 'include').

function basePath(ctx: PageContext): string {
  return ctx.themeDisplay?.pathContext ?? '';
}

/** GET a Headless REST endpoint, e.g. headlessGet(ctx, "/o/headless-delivery/v1.0/document-folders/123"). */
export async function headlessGet<T = any>(
  ctx: PageContext,
  path: string,
  params?: Record<string, string | number>,
): Promise<T> {
  const url = new URL(basePath(ctx) + path, location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Headless ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

/**
 * GET a JSON Web Services endpoint, e.g.
 *   jsonwsGet(ctx, "dlapp/get-folder", { folderId: 123 })
 * Adds p_auth automatically when available. JSONWS exposes legacy fields
 * (uuid, resourcePrimKey, assetEntryId, ...) that Headless often omits.
 */
export async function jsonwsGet<T = any>(
  ctx: PageContext,
  service: string,
  params: Record<string, string | number>,
): Promise<T> {
  const url = new URL(`${basePath(ctx)}/api/jsonws/${service}`, location.origin);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  if (ctx.authToken) url.searchParams.set('p_auth', ctx.authToken);
  const res = await fetch(url.toString(), {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`JSONWS ${res.status} ${res.statusText}`);
  const data: any = await res.json();
  if (data && typeof data === 'object' && (data.exception || data.error)) {
    throw new Error(String(data.exception || data.error));
  }
  return data as T;
}
