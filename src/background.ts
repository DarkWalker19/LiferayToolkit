// Service worker.

// Clicking the toolbar icon toggles the in-page panel.
// (No default_popup is set, so action.onClicked fires.)
chrome.action.onClicked.addListener((tab) => {
  if (tab.id === undefined) return;
  chrome.tabs.sendMessage(tab.id, { source: 'liferay-toolkit', type: 'toggle' }).catch(() => {
    // No content script in this tab (e.g. chrome:// page, or tab opened
    // before install and not yet reloaded). Nothing to toggle.
  });
});

// The panel's ⚙ button asks us to open the options page (content scripts
// cannot call openOptionsPage directly).
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.source === 'liferay-toolkit' && msg.type === 'open-options') {
    chrome.runtime.openOptionsPage();
  }
});
