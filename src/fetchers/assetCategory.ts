import { headlessGet, jsonwsGet } from '../core/api';
import { paramBySuffix } from '../core/params';
import type { Field, Fetcher } from '../core/types';

/** Asset Category (Categorization). */
export const assetCategoryFetcher: Fetcher = {
  id: 'asset-category',
  label: 'Category',
  order: 51,
  appliesTo: (ctx) => paramBySuffix(ctx, 'categoryId') !== undefined,
  async fetch(ctx) {
    const categoryId = paramBySuffix(ctx, 'categoryId')!;
    const fields: Field[] = [];
    const add = (label: string, value: unknown, mono = true) => {
      if (value !== undefined && value !== null && value !== '') {
        fields.push({ label, value: value as Field['value'], mono });
      }
    };
    const raw: Record<string, unknown> = {};

    try {
      const c: any = await jsonwsGet(ctx, 'assetcategory/get-category', { categoryId });
      raw.category = c;
      add('Category ID', c.categoryId);
      add('UUID', c.uuid);
      add('Name', c.name, false);
      add('Title', c.titleCurrentValue ?? c.title, false);
      add('Vocabulary ID', c.vocabularyId);
      add('Parent Category ID', c.parentCategoryId);
      add('Group ID', c.groupId);
      add('Tree Path', c.treePath, false);
      return { id: this.id, title: 'Category', fields, raw };
    } catch (jsonwsErr) {
      try {
        const c: any = await headlessGet(
          ctx,
          `/o/headless-admin-taxonomy/v1.0/taxonomy-categories/${categoryId}`,
        );
        raw.headless = c;
        add('Category ID', c.id);
        add('Name', c.name, false);
        add('External Ref Code', c.externalReferenceCode);
        add('Vocabulary ID', c.taxonomyVocabularyId);
        add('Parent Category ID', c.parentTaxonomyCategory?.id);
        return { id: this.id, title: 'Category (Headless)', fields, raw };
      } catch {
        return {
          id: this.id,
          title: 'Category',
          fields: [{ label: 'Category ID', value: categoryId, mono: true }],
          error: `Could not load: ${(jsonwsErr as Error).message}`,
          raw,
        };
      }
    }
  },
};
