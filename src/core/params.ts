import type { PageContext } from './types';

/**
 * Liferay portlet params look like
 *   _com_liferay_journal_web_portlet_JournalPortlet_articleId=...
 * This matches by suffix so you don't need to know the exact namespace.
 * Pass `includes` to disambiguate (e.g. only keys containing "Journal").
 */
export function paramBySuffix(
  ctx: PageContext,
  suffix: string,
  includes?: string,
): string | undefined {
  const needle = includes?.toLowerCase();
  const suf = suffix.toLowerCase();
  for (const [key, value] of Object.entries(ctx.params)) {
    const k = key.toLowerCase();
    if (k === suf || k.endsWith('_' + suf) || k.endsWith(suf)) {
      if (!needle || k.includes(needle)) return value;
    }
  }
  return undefined;
}

export function firstParam(ctx: PageContext, ...suffixes: string[]): string | undefined {
  for (const s of suffixes) {
    const v = paramBySuffix(ctx, s);
    if (v !== undefined) return v;
  }
  return undefined;
}

/** The targeted portlet id from the `p_p_id` query param, if present. */
export function portletId(ctx: PageContext): string | undefined {
  return ctx.params['p_p_id'];
}

/**
 * True if the page targets a portlet whose id contains `fragment` (case-insensitive).
 * Lets fetchers disambiguate entities that share a param name across portlets
 * (e.g. `folderId` belongs to D&M *or* Journal depending on the portlet).
 */
export function isPortlet(ctx: PageContext, fragment: string): boolean {
  return (portletId(ctx) ?? '').toLowerCase().includes(fragment.toLowerCase());
}
