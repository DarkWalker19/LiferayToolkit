import type { Field, Fetcher } from '../core/types';

/** Always-on: the page/site context Liferay already exposes via ThemeDisplay. */
export const themeDisplayFetcher: Fetcher = {
  id: 'theme-display',
  label: 'Page / Site context',
  order: 0,
  appliesTo: () => true,
  async fetch(ctx) {
    const td = ctx.themeDisplay;
    const fields: Field[] = [];
    const add = (label: string, value: unknown, mono = true) => {
      if (value !== undefined && value !== null && value !== '') {
        fields.push({ label, value: value as Field['value'], mono });
      }
    };

    add('Scope Group ID', td?.scopeGroupId);
    add('Site Group ID', td?.siteGroupId);
    add('Company ID', td?.companyId);
    add('User ID', td?.userId);
    add('PLID', td?.plid);
    add('Layout ID', td?.layoutId);
    add('Language ID', td?.languageId, false);
    add('Path context', td?.pathContext, false);
    add('Liferay version', ctx.version?.raw, false);
    add('Current URL', ctx.url.href, false);

    return {
      id: this.id,
      title: 'Page / Site',
      fields,
      raw: { themeDisplay: td, version: ctx.version },
    };
  },
};
