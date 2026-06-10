import { loadSettings, onSettingsChanged, type Settings } from '../core/settings';
import { registerAllFetchers } from '../fetchers';
import { Panel } from './panel';

registerAllFetchers();

void (async () => {
  let settings: Settings = await loadSettings();
  const panel = new Panel(settings);

  // Toolbar icon click (relayed by the service worker) toggles the panel.
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.source === 'liferay-toolkit' && msg.type === 'toggle') {
      panel.toggle();
    }
  });

  // Live-apply changes made on the options page.
  onSettingsChanged((s) => {
    settings = s;
    panel.applySettings(s);
  });

  // Alt+L toggles the panel (when enabled).
  window.addEventListener(
    'keydown',
    (e) => {
      if (
        settings.enableHotkey &&
        panel.isLiferayPage() &&
        e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        (e.key === 'l' || e.key === 'L')
      ) {
        e.preventDefault();
        panel.toggle();
      }
    },
    true,
  );
})();
