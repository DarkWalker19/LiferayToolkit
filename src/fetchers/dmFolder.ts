import { headlessGet, jsonwsGet } from '../core/api';
import { paramBySuffix } from '../core/params';
import type { Field, Fetcher } from '../core/types';

/** Documents & Media folder. */
export const dmFolderFetcher: Fetcher = {
  id: 'dm-folder',
  label: 'Document & Media Folder',
  order: 20,
  appliesTo: (ctx) => paramBySuffix(ctx, 'folderId') !== undefined,
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
        title: 'Document Folder',
        fields: [{ label: 'Folder ID', value: '0 (Home / root)', mono: true }],
      };
    }

    try {
      const f: any = await jsonwsGet(ctx, 'dlapp/get-folder', { folderId });
      raw.folder = f;
      add('Folder ID', f.folderId);
      add('UUID', f.uuid);
      add('Name', f.name, false);
      add('Group ID', f.groupId);
      add('Company ID', f.companyId);
      add('Repository ID', f.repositoryId);
      add('Parent Folder ID', f.parentFolderId);
      add('User ID', f.userId);
      add('Tree Path', f.treePath, false);
      return { id: this.id, title: 'Document Folder', fields, raw };
    } catch (jsonwsErr) {
      try {
        const f: any = await headlessGet(
          ctx,
          `/o/headless-delivery/v1.0/document-folders/${folderId}`,
        );
        raw.headless = f;
        add('Folder ID', f.id);
        add('Name', f.name, false);
        add('External Ref Code', f.externalReferenceCode);
        add('Documents', f.numberOfDocuments, false);
        add('Sub-folders', f.numberOfDocumentFolders, false);
        add('Site ID', f.siteId);
        return { id: this.id, title: 'Document Folder (Headless)', fields, raw };
      } catch {
        return {
          id: this.id,
          title: 'Document Folder',
          fields: [{ label: 'Folder ID', value: folderId, mono: true }],
          error: `Could not load: ${(jsonwsErr as Error).message}`,
          raw,
        };
      }
    }
  },
};
