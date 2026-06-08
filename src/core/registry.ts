import type { Fetcher, PageContext } from './types';
import { versionSupported } from './version';

const fetchers: Fetcher[] = [];

export function registerFetcher(fetcher: Fetcher): void {
  if (fetchers.some((f) => f.id === fetcher.id)) return;
  fetchers.push(fetcher);
}

export function getFetchers(): Fetcher[] {
  return [...fetchers].sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

/** Fetchers that both apply to the page and support the detected version. */
export function getApplicableFetchers(ctx: PageContext): Fetcher[] {
  return getFetchers().filter((f) => {
    try {
      return f.appliesTo(ctx) && versionSupported(ctx.version, f.version);
    } catch {
      return false;
    }
  });
}
