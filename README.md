# Liferay Toolkit

A free, open-source, dark-themed Chrome extension that puts Liferay's technical
metadata one keypress away while you develop, test, and debug.

Open the panel with **Alt+L** on any Liferay page and instantly see — and copy — the
IDs you always end up hunting for.

> **Disclaimer:** This is an unofficial, community-built tool. It is **not affiliated
> with, endorsed by, or sponsored by Liferay, Inc.** "Liferay" is a trademark of
> Liferay, Inc., used here only to describe what the extension works with. See
> [Trademarks](#trademarks).

---

## Features

- **Page / Site** — scope group id, site group id, company id, user id, PLID, layout id, language.
- **Page (Layout)** — `plid`, `layoutId`, `uuid`, name, friendly URL, type, group id, theme id.
- **Web Content (Journal Article)** — `articleId`, `id`, `resourcePrimKey`, `uuid`,
  group/company/user id, DDM structure & template keys, and **asset entry id**.
- **Web Content folder** — `folderId`, `uuid`, name, group/parent ids, tree path (Journal portlet).
- **Documents & Media folder** — `folderId`, `uuid`, name, group/repository/parent ids, tree path.
- **Documents & Media file** — `fileEntryId`, `uuid`, title, file name, version, MIME type, size.
- **DDM Structure** — `structureId`, `uuid`, `structureKey`, name, class name id, group id, version.
- **DDM Template** — `templateId`, `uuid`, `templateKey`, name, class name id, class PK, group id.
- **User** — `userId`, `uuid`, screen name, email, first/last name, contact id, company id, status.
- **Role** — `roleId`, `uuid`, name, title, type, class name id, company id.
- **Vocabulary** — `vocabularyId`, `uuid`, name, title, group id, company id.
- **Category** — `categoryId`, `uuid`, name, title, vocabulary id, parent category id, tree path.
- **Tag** — `tagId`, `uuid`, name, group/company/user id, asset count.

Click any value (or the ⧉ button) to copy it. **Copy JSON** copies the full raw record.

The panel activates only on confirmed Liferay pages (the floating button and Alt+L stay
hidden elsewhere); on a non-Liferay page the toolbar icon just reports "Liferay not
detected". The header shows the installed version and flags a newer GitHub release when
one is available.

Works across **Liferay 7.x**. Each data source is an independent, optional "fetcher"
and can be gated to specific versions.

## Install (from source)

No published store build yet — load it unpacked:

```bash
git clone <your-repo-url> liferay-toolkit
cd liferay-toolkit
npm install
npm run build      # outputs to dist/   (npm run watch to rebuild on change)
```

Then in Chrome (or any Chromium browser):

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. **Load unpacked** → select the `dist/` folder
4. Open a Liferay page, **reload the tab**, and press **Alt+L**

> The default `manifest.json` matches `<all_urls>` for convenience. For day-to-day use,
> narrow `content_scripts[].matches` and `host_permissions` to your Liferay host(s) and rebuild.

## Usage

Open the panel three ways:

- click the **toolbar icon**,
- press **Alt+L**, or
- click the floating **LR** button at the bottom-right of the page.

Panel header buttons: **AUTO** (auto-refresh toggle) · **↻** (refresh now) · **⚙**
(settings) · **✕** (close).

## Settings

Right-click the toolbar icon → **Options** (or click **⚙** in the panel header) to:

- show/hide the floating **LR** button,
- enable/disable the **Alt+L** shortcut,
- toggle **auto-refresh on page change** — while the panel is open it re-fetches as you
  navigate. Also toggleable from the panel's **AUTO** button.

Settings sync via your Chrome profile and apply live (no reload needed). The toolbar
icon always toggles the panel, so you can't lock yourself out.

## How it works

A MAIN-world script reads `Liferay.ThemeDisplay` / `authToken` and forwards them to the
isolated content script, which renders the panel and fetches data **using your existing
browser session** — **JSON Web Services first** (`/api/jsonws`, which exposes
`uuid` / `resourcePrimKey` / `assetEntryId`), falling back to the **Headless REST API**
(`/o/headless-delivery`) when JSONWS is disabled.

No credentials are stored or transmitted anywhere except to the Liferay server you are
already logged into. The extension has no analytics and makes no external network calls.

## Extending it

Every panel section is a **Fetcher**. To add one, drop a file in `src/fetchers/`, push
the fields you want, and register it in `src/fetchers/index.ts`:

```ts
export const myFetcher: Fetcher = {
  id: 'my-thing',
  label: 'My Thing',
  appliesTo: (ctx) => paramBySuffix(ctx, 'someId') !== undefined,
  async fetch(ctx) {
    const data = await jsonwsGet(ctx, 'some.service/get-thing', { id });
    return { id: this.id, title: 'My Thing', fields: [/* ... */], raw: data };
  },
};
```

See [`CLAUDE.md`](./CLAUDE.md) for the full architecture and walkthrough. The simplest
template is [`src/fetchers/dmFolder.ts`](./src/fetchers/dmFolder.ts).

## Project layout

```
src/
├─ manifest.json          MV3 manifest
├─ background.ts          service worker (toolbar click, open options)
├─ main-world/bridge.ts   reads Liferay page globals (MAIN world)
├─ content/               panel UI + bridge client (isolated world)
├─ core/                  types, registry, context, params, version, api, settings
├─ fetchers/              one file per entity  ← add features here
├─ options/              settings page (dark themed)
└─ views/genericView.ts   default copyable-row renderer
```

## Contributing

Issues and pull requests are welcome. Good first contributions are new fetchers for
entities you use often (structures/templates, layouts, users/roles, etc.). Please keep
fetchers self-contained and run `npm run typecheck` before opening a PR.

## License

[MIT](./LICENSE) © the Liferay Toolkit contributors. Free for personal and commercial use.

## Trademarks

"Liferay" and the Liferay logo are trademarks or registered trademarks of Liferay, Inc.
This project is an independent, community-developed tool and is **not affiliated with,
endorsed by, or sponsored by Liferay, Inc.** References to "Liferay" are nominative and
used solely to identify the platform this extension is designed to work with. This
project bundles no Liferay logos or branding. All other product names, logos, and brands
are the property of their respective owners.
