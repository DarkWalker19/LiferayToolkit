import { headlessGet, jsonwsGet } from '../core/api';
import { isPortlet, paramBySuffix } from '../core/params';
import type { Field, Fetcher } from '../core/types';

/**
 * Web Content (Journal) folder. Uses the same `folderId` param as D&M folders,
 * disambiguated by the Journal portlet id:
 *   p_p_id=com_liferay_journal_web_portlet_JournalPortlet
 * (D&M folders go through `dlapp/get-folder`, which 404s for Journal folders.)
 */
export const journalFolderFetcher: Fetcher = {
  id: 'journal-folder',
  label: 'Web Content Folder',
  order: 19,
  appliesTo: (ctx) =>
    isPortlet(ctx, 'JournalPortlet') && paramBySuffix(ctx, 'folderId') !== undefined,
  async fetch(ctx) {
    const folderId = paramBySuffix(ctx, 'folderId')!;

    const fields: Field[] = [];
    const add = (label: string, value: unknown, mono = true) => {
      if (value !== undefined && value !== null && value !== '') {
        fields.push({ label, value: value as Field['value'], mono });
      }
    };
    const raw: Record<string, unknown> = {};

    if (folderId === '0') {
      return {
        id: this.id,
        title: 'Web Content Folder',
        fields: [{ label: 'Folder ID', value: '0 (Home / root)', mono: true }],
      };
    }

    try {
      const f: any = await jsonwsGet(ctx, 'journal.journalfolder/get-folder', { folderId });
      raw.folder = f;
      add('Folder ID', f.folderId);
      add('UUID', f.uuid);
      add('Name', f.name, false);
      add('Description', f.description, false);
      add('Group ID', f.groupId);
      add('Company ID', f.companyId);
      add('Parent Folder ID', f.parentFolderId);
      add('User ID', f.userId);
      add('Tree Path', f.treePath, false);
      return { id: this.id, title: 'Web Content Folder', fields, raw };
    } catch (jsonwsErr) {
      try {
        const f: any = await headlessGet(
          ctx,
          `/o/headless-delivery/v1.0/structured-content-folders/${folderId}`,
        );
        raw.headless = f;
        add('Folder ID', f.id);
        add('Name', f.name, false);
        add('External Ref Code', f.externalReferenceCode);
        add('Web Contents', f.numberOfStructuredContents, false);
        add('Sub-folders', f.numberOfStructuredContentFolders, false);
        add('Site ID', f.siteId);
        return { id: this.id, title: 'Web Content Folder (Headless)', fields, raw };
      } catch {
        return {
          id: this.id,
          title: 'Web Content Folder',
          fields: [{ label: 'Folder ID', value: folderId, mono: true }],
          error: `Could not load: ${(jsonwsErr as Error).message}`,
          raw,
        };
      }
    }
  },
};
