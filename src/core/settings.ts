// Persisted in chrome.storage.sync so settings follow the user across machines.

export interface Settings {
  /** Show the floating "LR" button at the bottom-right of the page. */
  showFab: boolean;
  /** Enable the Alt+L keyboard shortcut. */
  enableHotkey: boolean;
  /** While the panel is open, re-fetch automatically when the page changes. */
  autoRefresh: boolean;
}

export const DEFAULTS: Settings = {
  showFab: true,
  enableHotkey: true,
  autoRefresh: true,
};

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  return { ...DEFAULTS, ...stored } as Settings;
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  await chrome.storage.sync.set(patch);
}

/** Re-reads and calls back whenever any of our settings change (any context). */
export function onSettingsChanged(cb: (s: Settings) => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (!Object.keys(changes).some((k) => k in DEFAULTS)) return;
    void loadSettings().then(cb);
  });
}
