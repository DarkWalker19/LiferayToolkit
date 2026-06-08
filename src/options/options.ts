import { loadSettings, saveSettings, type Settings } from '../core/settings';

const KEYS: (keyof Settings)[] = ['showFab', 'enableHotkey', 'autoRefresh'];

function flashSaved(): void {
  const el = document.getElementById('saved');
  if (!el) return;
  el.classList.add('show');
  window.setTimeout(() => el.classList.remove('show'), 1200);
}

async function init(): Promise<void> {
  const settings = await loadSettings();
  for (const key of KEYS) {
    const input = document.getElementById(key) as HTMLInputElement | null;
    if (!input) continue;
    input.checked = settings[key];
    input.addEventListener('change', () => {
      void saveSettings({ [key]: input.checked } as Partial<Settings>).then(flashSaved);
    });
  }
}

void init();
