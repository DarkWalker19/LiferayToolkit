import { headlessGet, jsonwsGet } from '../core/api';
import { paramBySuffix } from '../core/params';
import type { Field, Fetcher } from '../core/types';

/**
 * Web Content (JournalArticle).
 * Tries JSONWS first (gives uuid, resourcePrimKey + asset entry id), then falls
 * back to Headless Delivery if JSONWS is disabled.
 */
export const journalArticleFetcher: Fetcher = {
  id: 'journal-article',
  label: 'Web Content (Journal Article)',
  order: 10,
  appliesTo: (ctx) => paramBySuffix(ctx, 'articleId') !== undefined,
  async fetch(ctx) {
    const articleId = paramBySuffix(ctx, 'articleId')!;
    const groupId = paramBySuffix(ctx, 'groupId') ?? ctx.themeDisplay?.scopeGroupId ?? '';

    const fields: Field[] = [];
    const add = (label: string, value: unknown, mono = true) => {
      if (value !== undefined && value !== null && value !== '') {
        fields.push({ label, value: value as Field['value'], mono });
      }
    };
    const raw: Record<string, unknown> = {};

    try {
      const a: any = await jsonwsGet(ctx, 'journal.journalarticle/get-latest-article', {
        groupId,
        articleId,
        status: -1, // WorkflowConstants.STATUS_ANY
      });
      raw.article = a;
      add('Article ID', a.articleId);
      add('id (id_)', a.id);
      add('Resource Prim Key', a.resourcePrimKey);
      add('UUID', a.uuid);
      add('Group ID', a.groupId);
      add('Company ID', a.companyId);
      add('User ID', a.userId);
      add('Folder ID', a.folderId);
      add('Title', a.titleCurrentValue ?? a.title, false);
      add('Version', a.version, false);
      add('Status', a.status, false);
      add('DDM Structure Key', a.DDMStructureKey ?? a.ddmStructureKey);
      add('DDM Template Key', a.DDMTemplateKey ?? a.ddmTemplateKey);

      // Asset entry id is a separate service — best effort.
      try {
        const ae: any = await jsonwsGet(ctx, 'assetentry/get-entry', {
          className: 'com.liferay.journal.model.JournalArticle',
          classPK: a.resourcePrimKey,
        });
        raw.assetEntry = ae;
        add('Asset Entry ID', ae.entryId);
        add('Asset classNameId', ae.classNameId);
        add('Asset classPK', ae.classPK);
      } catch {
        /* asset entry optional */
      }

      return { id: this.id, title: 'Web Content', fields, raw };
    } catch (jsonwsErr) {
      // Fallback: Headless Delivery (StructuredContent key == articleId).
      try {
        const data: any = await headlessGet(
          ctx,
          `/o/headless-delivery/v1.0/sites/${groupId}/structured-contents`,
          { filter: `key eq '${articleId}'`, page: 1, pageSize: 1 },
        );
        const item = data?.items?.[0];
        raw.headless = item;
        if (!item) {
          return {
            id: this.id,
            title: 'Web Content',
            fields: [{ label: 'Article ID', value: articleId, mono: true }],
            error: 'Article not found via Headless Delivery.',
            raw,
          };
        }
        add('Article ID (key)', item.key);
        add('id', item.id);
        add('UUID', item.uuid);
        add('Title', item.title, false);
        add('Site ID', item.siteId);
        add('Friendly URL', item.friendlyUrlPath, false);
        return { id: this.id, title: 'Web Content (Headless)', fields, raw };
      } catch (headlessErr) {
        return {
          id: this.id,
          title: 'Web Content',
          fields: [
            { label: 'Article ID', value: articleId, mono: true },
            { label: 'Group ID', value: groupId, mono: true },
          ],
          error: `Could not load: ${(jsonwsErr as Error).message}`,
          raw,
        };
      }
    }
  },
};
