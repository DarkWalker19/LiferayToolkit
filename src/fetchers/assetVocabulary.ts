import { headlessGet, jsonwsGet } from '../core/api';
import { paramBySuffix } from '../core/params';
import type { Field, Fetcher } from '../core/types';

/** Asset Vocabulary (Categorization). */
export const assetVocabularyFetcher: Fetcher = {
  id: 'asset-vocabulary',
  label: 'Vocabulary',
  order: 50,
  appliesTo: (ctx) => paramBySuffix(ctx, 'vocabularyId') !== undefined,
  async fetch(ctx) {
    const vocabularyId = paramBySuffix(ctx, 'vocabularyId')!;
    const fields: Field[] = [];
    const add = (label: string, value: unknown, mono = true) => {
      if (value !== undefined && value !== null && value !== '') {
        fields.push({ label, value: value as Field['value'], mono });
      }
    };
    const raw: Record<string, unknown> = {};

    try {
      const v: any = await jsonwsGet(ctx, 'assetvocabulary/get-vocabulary', { vocabularyId });
      raw.vocabulary = v;
      add('Vocabulary ID', v.vocabularyId);
      add('UUID', v.uuid);
      add('Name', v.name, false);
      add('Title', v.titleCurrentValue ?? v.title, false);
      add('Group ID', v.groupId);
      add('Company ID', v.companyId);
      add('User ID', v.userId);
      return { id: this.id, title: 'Vocabulary', fields, raw };
    } catch (jsonwsErr) {
      try {
        const v: any = await headlessGet(
          ctx,
          `/o/headless-admin-taxonomy/v1.0/taxonomy-vocabularies/${vocabularyId}`,
        );
        raw.headless = v;
        add('Vocabulary ID', v.id);
        add('Name', v.name, false);
        add('External Ref Code', v.externalReferenceCode);
        add('Categories', v.numberOfTaxonomyCategories, false);
        add('Site ID', v.siteId);
        return { id: this.id, title: 'Vocabulary (Headless)', fields, raw };
      } catch {
        return {
          id: this.id,
          title: 'Vocabulary',
          fields: [{ label: 'Vocabulary ID', value: vocabularyId, mono: true }],
          error: `Could not load: ${(jsonwsErr as Error).message}`,
          raw,
        };
      }
    }
  },
};
