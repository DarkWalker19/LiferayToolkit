// Runs in the page's MAIN world (has access to window.Liferay). It cannot use
// chrome.* APIs, so it forwards a snapshot of Liferay globals to the isolated
// content script via window.postMessage.
(() => {
  const SOURCE = 'liferay-toolkit';
  const REQ = 'liferay-toolkit-req';

  const s = (v: unknown): string | null =>
    v === undefined || v === null ? null : String(v);

  function detectVersion(): string | null {
    try {
      const meta = document.querySelector(
        'meta[name="Liferay-Portal" i]',
      ) as HTMLMetaElement | null;
      if (meta?.content) return meta.content;
      const L: any = (window as any).Liferay;
      const fromProps = L?.PROPS?.['release.info.version'];
      if (fromProps) return String(fromProps);
      if (L?.version) return String(L.version);
    } catch {
      /* ignore */
    }
    return null;
  }

  function snapshot() {
    const L: any = (window as any).Liferay;
    const td = L?.ThemeDisplay;
    let themeDisplay: Record<string, string | null> | null = null;
    if (td) {
      const g = (fn: string): string | null => {
        try {
          return typeof td[fn] === 'function' ? s(td[fn]()) : null;
        } catch {
          return null;
        }
      };
      themeDisplay = {
        companyId: g('getCompanyId'),
        scopeGroupId: g('getScopeGroupId'),
        siteGroupId: g('getSiteGroupId'),
        parentGroupId: g('getParentGroupId'),
        userId: g('getUserId'),
        plid: g('getPlid'),
        layoutId: g('getLayoutId'),
        languageId: g('getLanguageId'),
        defaultLanguageId: g('getDefaultLanguageId'),
        pathContext: g('getPathContext'),
        portalURL: g('getPortalURL'),
        canonicalURL: g('getCanonicalURL'),
      };
    }
    return {
      themeDisplay,
      authToken: s(L?.authToken),
      version: detectVersion(),
      hasLiferay: !!L,
    };
  }

  function send() {
    try {
      window.postMessage({ source: SOURCE, type: 'context', payload: snapshot() }, '*');
    } catch {
      /* ignore */
    }
  }

  window.addEventListener('message', (e) => {
    if (e.source === window && e.data?.source === REQ && e.data?.type === 'request') {
      send();
    }
  });

  // Re-send after Liferay SPA (SennaJS) navigation.
  try {
    (window as any).Liferay?.on?.('endNavigate', () => setTimeout(send, 200));
  } catch {
    /* ignore */
  }

  send();
})();
