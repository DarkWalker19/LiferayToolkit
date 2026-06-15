// Core contracts. Adding a feature to the toolkit means implementing a `Fetcher`
// (and optionally a custom `view`) — nothing else needs to change.

/** Parsed Liferay version, e.g. { raw: "7.4.13-ga1", major: 7, minor: 4, micro: 13 }. */
export interface LiferayVersion {
  raw: string;
  major: number;
  minor: number;
  micro: number;
}

/** Subset of Liferay.ThemeDisplay captured from the page's MAIN world. */
export interface ThemeDisplaySnapshot {
  [key: string]: string | null | undefined;
}

/** Snapshot of page globals posted from the MAIN-world bridge. */
export interface Snapshot {
  themeDisplay: ThemeDisplaySnapshot | null;
  authToken: string | null;
  version: string | null;
  hasLiferay: boolean;
}

/** Everything a fetcher needs to know about the current page. */
export interface PageContext {
  url: URL;
  /** Raw query-string params (portlet-namespaced keys included verbatim). */
  params: Record<string, string>;
  themeDisplay: ThemeDisplaySnapshot | null;
  /** Liferay auth token (p_auth) for JSONWS calls, when available. */
  authToken: string | null;
  version: LiferayVersion | null;
  document: Document;
}

/** A single copyable piece of data shown in the panel. */
export interface Field {
  label: string;
  value: string | number | null | undefined;
  /** Render value in monospace (default true — most values are IDs). */
  mono?: boolean;
  /** Optional tooltip / explanation. */
  hint?: string;
  /** Long values (e.g. URLs): show a truncated preview, click to expand. */
  foldable?: boolean;
}

/** The output of a fetcher: one titled section of fields. */
export interface FetchResult {
  /** Mirrors the fetcher id. */
  id: string;
  title: string;
  fields: Field[];
  /** Full raw object(s) — powers the "Copy JSON" button. */
  raw?: unknown;
  /** Non-fatal message shown in the section (e.g. API disabled). */
  error?: string;
}

/** Version gate. Omit to run on every Liferay version. */
export interface VersionRange {
  /** Inclusive lower bound, e.g. "7.3". */
  min?: string;
  /** Exclusive upper bound, e.g. "7.4". */
  max?: string;
}

/**
 * A unit of "show me the technical data for X".
 * Register one in src/fetchers/index.ts and it appears in the panel automatically.
 */
export interface Fetcher {
  /** Stable unique id. */
  id: string;
  /** Human label (shown if the fetcher errors before producing a title). */
  label: string;
  /** Lower numbers render first. Default 100. */
  order?: number;
  /** Only run on these versions. Omit = all versions (incl. unknown). */
  version?: VersionRange;
  /** Cheap, synchronous check: does this apply to the current page? */
  appliesTo(ctx: PageContext): boolean;
  /** Do the (possibly async) work and return the data to display. */
  fetch(ctx: PageContext): Promise<FetchResult | null>;
  /** Optional custom renderer. Falls back to the generic field list. */
  view?: (result: FetchResult, copy: CopyFn) => HTMLElement;
}

export type CopyFn = (text: string, label?: string) => void;
