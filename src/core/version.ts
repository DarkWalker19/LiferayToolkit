import type { LiferayVersion, VersionRange } from './types';

export function parseVersion(raw?: string | null): LiferayVersion | null {
  if (!raw) return null;
  const m = raw.match(/(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!m) return null;
  return { raw, major: +m[1], minor: +m[2], micro: m[3] ? +m[3] : 0 };
}

function toNumber(major: number, minor: number, micro: number): number {
  return major * 10000 + minor * 100 + micro;
}

function targetNumber(target: string): number {
  const v = parseVersion(target);
  return v ? toNumber(v.major, v.minor, v.micro) : 0;
}

/** Unknown version (null) is treated as "matches" so detection gaps never hide data. */
export function atLeast(v: LiferayVersion | null, target: string): boolean {
  if (!v) return true;
  return toNumber(v.major, v.minor, v.micro) >= targetNumber(target);
}

export function below(v: LiferayVersion | null, target: string): boolean {
  if (!v) return true;
  return toNumber(v.major, v.minor, v.micro) < targetNumber(target);
}

export function versionSupported(v: LiferayVersion | null, range?: VersionRange): boolean {
  if (!range) return true;
  if (range.min && !atLeast(v, range.min)) return false;
  if (range.max && !below(v, range.max)) return false; // max is exclusive
  return true;
}

/**
 * Compare two dotted version strings (e.g. the extension's own version against a
 * GitHub release tag). A leading "v" is ignored. Returns 1 if a>b, -1 if a<b, 0 if equal.
 */
export function compareSemver(a: string, b: string): number {
  const parts = (s: string) => s.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pa = parts(a);
  const pb = parts(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}
