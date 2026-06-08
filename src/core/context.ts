import type { PageContext, Snapshot } from './types';
import { parseVersion } from './version';

/** Build the immutable context handed to every fetcher. */
export function buildContext(snap: Snapshot | null): PageContext {
  const url = new URL(location.href);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return {
    url,
    params,
    themeDisplay: snap?.themeDisplay ?? null,
    authToken: snap?.authToken ?? null,
    version: parseVersion(snap?.version ?? null),
    document,
  };
}
