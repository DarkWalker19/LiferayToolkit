import { jsonwsGet } from '../core/api';
import type { Field, Fetcher } from '../core/types';

/** The current page (Layout). Applies whenever ThemeDisplay exposes a PLID. */
export const layoutFetcher: Fetcher = {
  id: 'layout',
  label: 'Page (Layout)',
  order: 1,
  appliesTo: (ctx) => !!ctx.themeDisplay?.plid,
  async fetch(ctx) {
    const td = ctx.themeDisplay!;
    const plid = td.plid!;
    const fields: Field[] = [];
    const add = (label: string, value: unknown, mono = true) => {
      if (value !== undefined && value !== null && value !== '') {
        fields.push({ label, value: value as Field['value'], mono });
      }
    };

    // Control Panel / virtual layouts have no real Layout row — `layout/get-layout`
    // would 404 or return the wrong page. The JSONWS API browser (`/api/jsonws`)
    // isn't a layout either. Just report the context instead.
    const isControlPanel = td.isControlPanel === 'true';
    const isVirtualLayout = td.isVirtualLayout === 'true';
    const isJsonwsApi = /\/api\/jsonws(\/|$|\?)/.test(ctx.url.pathname + ctx.url.search);
    if (isControlPanel || isVirtualLayout || isJsonwsApi) {
      add('PLID', plid);
      add('Layout ID', td.layoutId);
      add(
        'Context',
        isJsonwsApi
          ? 'JSONWS API'
          : isControlPanel
            ? 'Control Panel'
            : 'Virtual Layout',
        false,
      );
      return { id: this.id, title: 'Page (Layout)', fields, raw: { themeDisplay: td } };
    }

    // `fetch-layout` resolves by the natural key (groupId + privateLayout +
    // layoutId) and returns null instead of 404ing — more robust than get-layout
    // by plid. groupId/privateLayout/layoutId all come straight from ThemeDisplay.
    const groupId = td.siteGroupId ?? td.scopeGroupId;
    const layoutId = td.layoutId;
    const privateLayout = td.isPrivateLayout === 'true';
    try {
      const l: any =
        groupId != null && layoutId != null
          ? await jsonwsGet(ctx, 'layout/fetch-layout', {
              groupId,
              privateLayout: String(privateLayout),
              layoutId,
            })
          : null;
      if (l) {
        add('PLID', l.plid);
        add('Layout ID', l.layoutId);
        add('UUID', l.uuid);
        add('Name', l.nameCurrentValue ?? l.name, false);
        add('Friendly URL', l.friendlyURL, false);
        add('Type', l.type, false);
        add('Private', l.privateLayout, false);
        add('Group ID', l.groupId);
        add('Parent Layout ID', l.parentLayoutId);
        add('Theme ID', l.themeId, false);
        add('Layout Prototype UUID', l.layoutPrototypeUuid);
        return { id: this.id, title: 'Page (Layout)', fields, raw: { layout: l } };
      }
      // No layout found — fall back to ThemeDisplay values.
      add('PLID', plid);
      add('Layout ID', layoutId);
      add('Private', privateLayout, false);
      return { id: this.id, title: 'Page (Layout)', fields };
    } catch {
      // JSONWS off — fall back to what ThemeDisplay already gave us (no error noise).
      add('PLID', plid);
      add('Layout ID', layoutId);
      add('Private', privateLayout, false);
      return { id: this.id, title: 'Page (Layout)', fields };
    }
  },
};
