import { headlessGet, jsonwsGet } from '../core/api';
import { paramBySuffix } from '../core/params';
import type { Field, Fetcher } from '../core/types';

/** Asset Tag (Categorization). In Headless these are called "keywords". */
export const assetTagFetcher: Fetcher = {
  id: 'asset-tag',
  label: 'Tag',
  order: 52,
  appliesTo: (ctx) => paramBySuffix(ctx, 'tagId') !== undefined,
  async fetch(ctx) {
    const tagId = paramBySuffix(ctx, 'tagId')!;
    const fields: Field[] = [];
    const add = (label: string, value: unknown, mono = true) => {
      if (value !== undefined && value !== null && value !== '') {
        fields.push({ label, value: value as Field['value'], mono });
      }
    };
    const raw: Record<string, unknown> = {};

    try {
      const t: any = await jsonwsGet(ctx, 'assettag/get-tag', { tagId });
      raw.tag = t;
      add('Tag ID', t.tagId);
      add('UUID', t.uuid);
      add('Name', t.name, false);
      add('Group ID', t.groupId);
      add('Company ID', t.companyId);
      add('User ID', t.userId);
      add('Asset Count', t.assetCount, false);
      return { id: this.id, title: 'Tag', fields, raw };
    } catch (jsonwsErr) {
      try {
        const t: any = await headlessGet(
          ctx,
          `/o/headless-admin-taxonomy/v1.0/keywords/${tagId}`,
        );
        raw.headless = t;
        add('Tag ID (keyword)', t.id);
        add('Name', t.name, false);
        add('External Ref Code', t.externalReferenceCode);
        add('Usage Count', t.keywordUsageCount, false);
        add('Site ID', t.siteId);
        return { id: this.id, title: 'Tag (Headless)', fields, raw };
      } catch {
        return {
          id: this.id,
          title: 'Tag',
          fields: [{ label: 'Tag ID', value: tagId, mono: true }],
          error: `Could not load: ${(jsonwsErr as Error).message}`,
          raw,
        };
      }
    }
  },
};
