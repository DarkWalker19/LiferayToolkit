// Service worker.

import { compareSemver } from './core/version';
import { loadSettings } from './core/settings';

// GitHub repo to check for newer tagged releases.
const REPO = 'DarkWalker19/LiferayToolkit';
const UPDATE_CACHE_KEY = 'lt_update_check';
const UPDATE_TTL_MS = 6 * 60 * 60 * 1000; // re-check at most every 6h (GitHub rate limits)

/** Latest tagged release from GitHub, cached so we don't hammer the API. */
async function getLatestRelease(): Promise<{ latest: string; url: string } | null> {
  const now = Date.now();
  const { fetchPrereleases } = await loadSettings();
  const cached = (await chrome.storage.local.get(UPDATE_CACHE_KEY))[UPDATE_CACHE_KEY];
  // Cache is keyed on the prerelease preference too, so toggling it re-checks.
  if (cached && cached.pre === fetchPrereleases && now - cached.ts < UPDATE_TTL_MS)
    return cached.data ?? null;

  try {
    // Use the releases *list* (not /releases/latest): the "latest" endpoint
    // returns 404 unless there is a published non-draft, non-prerelease release.
    // We pick the highest semver ourselves, optionally including prereleases.
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    const list: any[] = r.ok ? await r.json() : [];
    const newest = (Array.isArray(list) ? list : [])
      .filter((rel) => rel && !rel.draft && rel.tag_name && (fetchPrereleases || !rel.prerelease))
      .reduce<any>((best, rel) => {
        const tag = String(rel.tag_name).replace(/^v/i, '');
        return !best || compareSemver(tag, best.tag) > 0
          ? { tag, url: rel.html_url as string }
          : best;
      }, null);
    const data = newest ? { latest: newest.tag, url: newest.url } : null;
    await chrome.storage.local.set({ [UPDATE_CACHE_KEY]: { ts: now, pre: fetchPrereleases, data } });
    return data;
  } catch {
    // Offline / no releases yet — fall back to whatever we cached before (if any).
    return cached?.data ?? null;
  }
}

// Clicking the toolbar icon toggles the in-page panel.
// (No default_popup is set, so action.onClicked fires.) Works on any page —
// on non-Liferay pages the panel just reports "Liferay not detected".
chrome.action.onClicked.addListener((tab) => {
  if (tab.id === undefined) return;
  chrome.tabs.sendMessage(tab.id, { source: 'liferay-toolkit', type: 'toggle' }).catch(() => {
    // No content script in this tab (e.g. chrome:// page, or tab opened
    // before install and not yet reloaded). Nothing to toggle.
  });
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.source !== 'liferay-toolkit') return;

  // The panel's ⚙ button asks us to open the options page (content scripts
  // cannot call openOptionsPage directly).
  if (msg.type === 'open-options') {
    chrome.runtime.openOptionsPage();
    return;
  }

  // The panel asks whether a newer release is published.
  if (msg.type === 'check-update') {
    void getLatestRelease().then(sendResponse);
    return true; // keep the channel open for the async response
  }
});
