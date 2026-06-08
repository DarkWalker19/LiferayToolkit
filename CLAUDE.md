# Liferay Toolkit — project memory

Chrome MV3 extension that shows copyable Liferay technical metadata (folder/article
IDs, UUIDs, asset entry ids, ThemeDisplay context) in a dark side panel while
developing/testing/debugging. Built with TypeScript + Vite. Owner: rickyserci@gmail.com.

## Design goals (do not regress)

- **Simplicity & speed**: open panel (Alt+L) → see/copy the IDs. No clicks to drill.
- **Expandable**: adding a feature = one new `Fetcher` file. Nothing else changes.
- **Version-flexible**: must work across all Liferay 7.x. Version-specific data is
  opt-in per fetcher; if something doesn't exist in a version, just don't implement
  it (gate with `version: { min, max }`). Unknown version is treated as "supported".
- **Dark themed**, shadow-DOM isolated (no page CSS bleed).

## Architecture

```
page MAIN world          isolated content script (UI)
─────────────────        ─────────────────────────────
bridge.ts  ──postMessage──►  bridge-client.ts ─► context.ts ─► registry
reads Liferay.ThemeDisplay,   (Snapshot)          (PageContext)   │
Liferay.authToken, version                                        ▼
                                              applicable Fetchers run fetch(ctx)
                                                                  │
                                              genericView renders copyable rows
```

- `src/main-world/bridge.ts` — MAIN world (manifest `world: "MAIN"`). Only place that
  can read `window.Liferay`. Posts a `Snapshot` to the content script. Cannot use chrome.*.
- `src/content/` — isolated world. `panel.ts` builds the shadow-DOM UI; `bridge-client.ts`
  requests/receives the snapshot; `index.ts` wires Alt+L.
- `src/core/` — framework, no DOM:
  - `types.ts` — the `Fetcher`/`Field`/`FetchResult`/`PageContext` contracts.
  - `registry.ts` — register + filter fetchers by `appliesTo` and version.
  - `context.ts` — builds `PageContext` from snapshot + URL.
  - `params.ts` — `paramBySuffix(ctx, "articleId")` matches portlet-namespaced query params.
  - `api.ts` — `jsonwsGet(ctx, service, params)` and `headlessGet(ctx, path, params)`.
    Both use the session cookie (`credentials:'include'`); JSONWS adds `p_auth` automatically.
  - `version.ts` — parse/compare; `versionSupported(v, range)`.
- `src/fetchers/` — one file per entity. Registered in `fetchers/index.ts`.
- `src/views/genericView.ts` — default renderer. A fetcher may set `view` to override.
- `src/core/settings.ts` — `Settings` (showFab, enableHotkey, autoRefresh) in
  `chrome.storage.sync`; `onSettingsChanged` live-applies changes to open panels.
- `src/options/` — dark settings page (`options.html` static + `options.js`), opened
  via `options_ui` and from the panel's ⚙ button (content script → background → `openOptionsPage`).
- `src/background.ts` — service worker: toolbar-icon click toggles the panel; relays
  the "open options" request.

## Settings & auto-refresh

Three toggles persisted in `chrome.storage.sync`: show floating button, enable Alt+L,
auto-refresh on page change. The panel header has an **AUTO** button that toggles
auto-refresh and writes it back to settings (kept in sync both ways). Auto-refresh
watches navigation only while the panel is open (URL poll every 600ms + popstate,
250ms debounce) — covers SennaJS SPA pushState and full reloads.

## Data strategy

Hybrid. **JSONWS first** (`/api/jsonws/...`) because it exposes legacy fields the
Headless API omits (`uuid`, `resourcePrimKey`, `assetEntryId`). **Headless REST**
(`/o/headless-delivery/...`) as fallback when JSONWS is disabled. Never hardcode the
origin/context path — read `themeDisplay.pathContext` (done inside `api.ts`).

## How to add a fetcher (the main extension point)

1. Create `src/fetchers/myThing.ts` exporting a `Fetcher`:
   - `appliesTo(ctx)` — usually `paramBySuffix(ctx, "<someId>") !== undefined`.
   - `fetch(ctx)` — call `jsonwsGet`/`headlessGet`, push `Field`s, return `FetchResult`
     (include `raw` so "Copy JSON" works).
   - optional `version: { min: "7.3", max: "7.4" }` to gate by version.
2. Register it in `src/fetchers/index.ts`.
3. `npm run build`, reload the extension. That's it.

Copy `dmFolder.ts` as the simplest template; `journalArticle.ts` shows the
JSONWS→Headless fallback + a secondary (asset entry) lookup.

## Build / load

- `npm install` then `npm run build` → `dist/`. `npm run watch` to rebuild on change.
- Load: chrome://extensions → Developer mode → Load unpacked → select `dist/`.
- Build = IIFE bundles (`content.js`, `bridge.js`, `background.js`, `options.js`) via
  `scripts/build.mjs` (MV3 content scripts can't be ES modules, hence per-entry IIFE).
- Icons: source is `public/icons/allen-icon.svg` (white glyph on black circle).
  `npm run icons` rasterizes it to `icon-{16,32,48,128}.png` via `@resvg/resvg-js`
  (Chrome requires PNG, not SVG). The PNGs are committed; `build.mjs` copies them to
  `dist/icons/`. Re-run `npm run icons` only when the SVG changes.

## Known gaps / TODO ideas

- Version detection is best-effort (meta tag / `Liferay.PROPS`); often null → fetchers
  still run. Improve if a reliable signal is found.
- `matches` is `<all_urls>` for dev convenience; narrow it to the user's Liferay hosts
  for a production build.
- Detection relies on portlet query params (`_..._folderId` etc.). Some D&M/Journal
  admin screens keep the id in DOM/state instead of the URL — may need DOM probes.
- Shipped fetchers: theme-display (always), layout, journal-article, dm-folder,
  dm-file-entry, ddm-structure, ddm-template, user, role, asset-vocabulary, asset-category.
- Ideas next: current portlet instance ids, "resolve any classNameId", expando
  values, organizations/sites, asset tags.
