import { jsonwsGet } from '../core/api';
import type { Field, Fetcher } from '../core/types';

/** The current page (Layout). Applies whenever ThemeDisplay exposes a PLID. */
export const layoutFetcher: Fetcher = {
  id: 'layout',
  label: 'Page (Layout)',
  order: 1,
  appliesTo: (ctx) => !!ctx.themeDisplay?.plid,
  async fetch(ctx) {
    const plid = ctx.themeDisplay!.plid!;
    const fields: Field[] = [];
    const add = (label: string, value: unknown, mono = true) => {
      if (value !== undefined && value !== null && value !== '') {
        fields.push({ label, value: value as Field['value'], mono });
      }
    };

    try {
      const l: any = await jsonwsGet(ctx, 'layout/get-layout', { plid });
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
    } catch {
      // JSONWS off — fall back to what ThemeDisplay already gave us (no error noise).
      add('PLID', plid);
      add('Layout ID', ctx.themeDisplay?.layoutId);
      return { id: this.id, title: 'Page (Layout)', fields };
    }
  },
};
