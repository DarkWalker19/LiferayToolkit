import { buildContext } from '../core/context';
import { getApplicableFetchers } from '../core/registry';
import { saveSettings, type Settings } from '../core/settings';
import type { FetchResult } from '../core/types';
import { compareSemver } from '../core/version';
import { renderResult } from '../views/genericView';
import { requestSnapshot } from './bridge-client';
import { CSS } from './styles';

export class Panel {
  private root: ShadowRoot;
  private panelEl!: HTMLElement;
  private fab!: HTMLButtonElement;
  private autoBtn!: HTMLButtonElement;
  private updateLink!: HTMLAnchorElement;
  private body!: HTMLElement;
  private toastEl!: HTMLElement;
  private isOpen = false;
  private toastTimer = 0;
  private settings: Settings;

  // Confirmed Liferay page = the bridge saw Liferay.ThemeDisplay. The FAB and the
  // Alt+L hotkey are gated on this; the toolbar icon still works everywhere.
  private isLiferay = false;
  private updateChecked = false;

  // Navigation watch (auto-refresh while open).
  private lastUrl = location.href;
  private navTimer = 0;
  private navDebounce = 0;

  constructor(settings: Settings) {
    this.settings = settings;
    const host = document.createElement('div');
    host.id = 'liferay-toolkit-host';
    this.root = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = CSS;
    this.root.appendChild(style);
    document.documentElement.appendChild(host);
    this.build();
    this.applySettings(settings);
    void this.detectLiferay();
  }

  private build(): void {
    this.fab = document.createElement('button');
    this.fab.className = 'lt-fab';
    this.fab.title = 'Liferay Toolkit (Alt+L)';
    const fabIcon = document.createElement('img');
    fabIcon.src = chrome.runtime.getURL('icons/icon-128.png');
    fabIcon.alt = 'Liferay Toolkit';
    this.fab.appendChild(fabIcon);
    this.fab.addEventListener('click', () => this.toggle());
    this.root.appendChild(this.fab);

    const panel = document.createElement('div');
    panel.className = 'lt-panel';

    const header = document.createElement('div');
    header.className = 'lt-header';

    const titlewrap = document.createElement('div');
    titlewrap.className = 'lt-titlewrap';

    const titlerow = document.createElement('div');
    titlerow.className = 'lt-titlerow';
    const title = document.createElement('span');
    title.className = 'lt-title';
    title.textContent = 'Liferay Toolkit';
    const version = document.createElement('span');
    version.className = 'lt-version';
    version.textContent = chrome.runtime.getManifest().version;
    this.updateLink = document.createElement('a');
    this.updateLink.className = 'lt-update';
    this.updateLink.target = '_blank';
    this.updateLink.rel = 'noopener';
    this.updateLink.hidden = true;
    titlerow.append(title, version, this.updateLink);

    const credits = document.createElement('div');
    credits.className = 'lt-credits';
    credits.append(document.createTextNode('by '));
    const creditLink = document.createElement('a');
    creditLink.href = 'https://github.com/DarkWalker19';
    creditLink.target = '_blank';
    creditLink.rel = 'noopener';
    creditLink.textContent = 'Riccardo Serci';
    credits.appendChild(creditLink);

    titlewrap.append(titlerow, credits);

    const actions = document.createElement('div');
    actions.className = 'lt-actions';

    this.autoBtn = this.iconButton('AUTO', 'lt-btn lt-btn-auto', () => this.toggleAuto());
    const refresh = this.iconButton('↻', 'lt-btn', () => void this.refresh());
    refresh.title = 'Refresh now';
    const settingsBtn = this.iconButton('⚙', 'lt-btn', () => this.openOptions());
    settingsBtn.title = 'Settings';
    const close = this.iconButton('✕', 'lt-btn', () => this.close());
    close.title = 'Close';
    actions.append(this.autoBtn, refresh, settingsBtn, close);

    header.append(titlewrap, actions);

    this.body = document.createElement('div');
    this.body.className = 'lt-body';

    panel.append(header, this.body);
    this.root.appendChild(panel);
    this.panelEl = panel;

    this.toastEl = document.createElement('div');
    this.toastEl.className = 'lt-toast';
    this.root.appendChild(this.toastEl);
  }

  private iconButton(text: string, cls: string, onClick: () => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.className = cls;
    b.textContent = text;
    b.addEventListener('click', onClick);
    return b;
  }

  /** Apply settings from storage (live updates from the options page land here). */
  applySettings(s: Settings): void {
    this.settings = s;
    this.updateFabVisibility();
    this.updateAutoButton();
    this.syncNavWatch();
  }

  /** Show the floating button only when enabled AND on a confirmed Liferay page. */
  private updateFabVisibility(): void {
    this.fab.style.display = this.settings.showFab && this.isLiferay ? '' : 'none';
  }

  /** Is the current page a confirmed Liferay page? Gates the Alt+L hotkey. */
  isLiferayPage(): boolean {
    return this.isLiferay;
  }

  /** Ask the bridge for a snapshot to decide whether this is a Liferay page. */
  private async detectLiferay(): Promise<void> {
    const snap = await requestSnapshot();
    this.isLiferay = !!snap?.themeDisplay;
    this.updateFabVisibility();
    if (this.isLiferay && !this.updateChecked) void this.checkForUpdate();
  }

  /** Compare the installed version against the latest GitHub release (via the worker). */
  private async checkForUpdate(): Promise<void> {
    this.updateChecked = true;
    try {
      const res: any = await chrome.runtime.sendMessage({
        source: 'liferay-toolkit',
        type: 'check-update',
      });
      if (!res?.latest) return;
      const current = chrome.runtime.getManifest().version;
      if (compareSemver(res.latest, current) > 0) {
        this.updateLink.hidden = false;
        this.updateLink.textContent = `↑ ${res.latest}`;
        this.updateLink.href = res.url || `https://github.com/DarkWalker19`;
        this.updateLink.title = `Update available: ${res.latest} (installed ${current})`;
      }
    } catch {
      /* offline / no releases — leave the badge hidden */
    }
  }

  private updateAutoButton(): void {
    this.autoBtn.classList.toggle('active', this.settings.autoRefresh);
    this.autoBtn.title = `Auto-refresh on page change: ${this.settings.autoRefresh ? 'ON' : 'OFF'}`;
  }

  private toggleAuto(): void {
    this.settings.autoRefresh = !this.settings.autoRefresh;
    this.updateAutoButton();
    this.syncNavWatch();
    void saveSettings({ autoRefresh: this.settings.autoRefresh });
    this.toast(`Auto-refresh ${this.settings.autoRefresh ? 'on' : 'off'}`);
  }

  private openOptions(): void {
    chrome.runtime
      .sendMessage({ source: 'liferay-toolkit', type: 'open-options' })
      .catch(() => {});
  }

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  open(): void {
    this.isOpen = true;
    this.panelEl.classList.add('open');
    this.syncNavWatch();
    void this.refresh();
  }

  close(): void {
    this.isOpen = false;
    this.panelEl.classList.remove('open');
    this.syncNavWatch();
  }

  // ── Auto-refresh on navigation ──────────────────────────────────────────
  private syncNavWatch(): void {
    if (this.isOpen && this.settings.autoRefresh) this.startNavWatch();
    else this.stopNavWatch();
  }

  private startNavWatch(): void {
    if (this.navTimer) return;
    this.lastUrl = location.href;
    // Poll covers SennaJS pushState SPA nav; popstate covers back/forward.
    this.navTimer = window.setInterval(this.checkNav, 600);
    window.addEventListener('popstate', this.checkNav, true);
  }

  private stopNavWatch(): void {
    if (this.navTimer) {
      clearInterval(this.navTimer);
      this.navTimer = 0;
    }
    window.removeEventListener('popstate', this.checkNav, true);
  }

  private checkNav = (): void => {
    if (location.href === this.lastUrl) return;
    this.lastUrl = location.href;
    clearTimeout(this.navDebounce);
    // Debounce so SennaJS has time to swap in the new page state.
    this.navDebounce = window.setTimeout(() => {
      if (this.isOpen && this.settings.autoRefresh) void this.refresh();
    }, 250);
  };

  // ── Data ────────────────────────────────────────────────────────────────
  async refresh(): Promise<void> {
    this.setBody('lt-loading', 'Loading…');
    const snap = await requestSnapshot();
    this.isLiferay = !!snap?.themeDisplay;
    this.updateFabVisibility();
    if (this.isLiferay && !this.updateChecked) void this.checkForUpdate();

    // Not a Liferay page: show only the notice, nothing else.
    if (!this.isLiferay) {
      this.setBody('lt-warn', 'Liferay not detected.');
      return;
    }

    const ctx = buildContext(snap);
    const fetchers = getApplicableFetchers(ctx);

    const results = await Promise.all(
      fetchers.map(async (f): Promise<{ result: FetchResult | null; view?: typeof f.view }> => {
        try {
          return { result: await f.fetch(ctx), view: f.view };
        } catch (e) {
          return {
            result: { id: f.id, title: f.label, fields: [], error: (e as Error).message },
          };
        }
      }),
    );

    this.body.innerHTML = '';
    let rendered = 0;
    for (const { result, view } of results) {
      if (!result) continue;
      const el = view ? view(result, this.copy) : renderResult(result, this.copy);
      this.body.appendChild(el);
      rendered++;
    }
    if (rendered === 0) {
      this.append('lt-empty', 'No Liferay entities detected on this page.');
    }
  }

  private copy = async (text: string, label?: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      this.root.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* ignore */
      }
      ta.remove();
    }
    this.toast(`Copied${label ? ': ' + label : ''}`);
  };

  private toast(msg: string): void {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('show'), 1400);
  }

  private setBody(cls: string, text: string): void {
    this.body.innerHTML = '';
    this.append(cls, text);
  }

  private append(cls: string, text: string): void {
    const el = document.createElement('div');
    el.className = cls;
    el.textContent = text;
    this.body.appendChild(el);
  }
}
