import { headlessGet, jsonwsGet } from '../core/api';
import { paramBySuffix } from '../core/params';
import type { Field, Fetcher } from '../core/types';

/** Documents & Media document (DLFileEntry). */
export const dmFileEntryFetcher: Fetcher = {
  id: 'dm-file-entry',
  label: 'Document & Media File',
  order: 21,
  appliesTo: (ctx) => paramBySuffix(ctx, 'fileEntryId') !== undefined,
  async fetch(ctx) {
    const fileEntryId = paramBySuffix(ctx, 'fileEntryId')!;

    const fields: Field[] = [];
    const add = (label: string, value: unknown, mono = true) => {
      if (value !== undefined && value !== null && value !== '') {
        fields.push({ label, value: value as Field['value'], mono });
      }
    };
    const raw: Record<string, unknown> = {};

    try {
      const f: any = await jsonwsGet(ctx, 'dlapp/get-file-entry', { fileEntryId });
      raw.fileEntry = f;
      add('File Entry ID', f.fileEntryId);
      add('UUID', f.uuid);
      add('Title', f.title, false);
      add('File Name', f.fileName, false);
      add('Group ID', f.groupId);
      add('Folder ID', f.folderId);
      add('Repository ID', f.repositoryId);
      add('Version', f.version, false);
      add('MIME Type', f.mimeType, false);
      add('Size (bytes)', f.size, false);
      add('User ID', f.userId);
      return { id: this.id, title: 'Document File', fields, raw };
    } catch (jsonwsErr) {
      try {
        const f: any = await headlessGet(
          ctx,
          `/o/headless-delivery/v1.0/documents/${fileEntryId}`,
        );
        raw.headless = f;
        add('Document ID', f.id);
        add('Title', f.title, false);
        add('File Name', f.fileName ?? f.contentUrl, false);
        add('External Ref Code', f.externalReferenceCode);
        add('Folder ID', f.documentFolderId);
        add('Site ID', f.siteId);
        return { id: this.id, title: 'Document File (Headless)', fields, raw };
      } catch {
        return {
          id: this.id,
          title: 'Document File',
          fields: [{ label: 'File Entry ID', value: fileEntryId, mono: true }],
          error: `Could not load: ${(jsonwsErr as Error).message}`,
          raw,
        };
      }
    }
  },
};
