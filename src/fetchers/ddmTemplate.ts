import { jsonwsGet } from '../core/api';
import { firstParam } from '../core/params';
import type { Field, Fetcher } from '../core/types';

/** DDM Template (display / form templates). */
export const ddmTemplateFetcher: Fetcher = {
  id: 'ddm-template',
  label: 'DDM Template',
  order: 31,
  appliesTo: (ctx) => firstParam(ctx, 'ddmTemplateId', 'templateId') !== undefined,
  async fetch(ctx) {
    const templateId = firstParam(ctx, 'ddmTemplateId', 'templateId')!;
    const fields: Field[] = [];
    const add = (label: string, value: unknown, mono = true) => {
      if (value !== undefined && value !== null && value !== '') {
        fields.push({ label, value: value as Field['value'], mono });
      }
    };

    try {
      const t: any = await jsonwsGet(ctx, 'ddm.ddmtemplate/get-template', { templateId });
      add('Template ID', t.templateId);
      add('UUID', t.uuid);
      add('Template Key', t.templateKey);
      add('Name', t.nameCurrentValue ?? t.name, false);
      add('Class Name ID', t.classNameId);
      add('Class PK', t.classPK);
      add('Group ID', t.groupId);
      add('Language', t.language, false);
      add('Version', t.version, false);
      return { id: this.id, title: 'DDM Template', fields, raw: { template: t } };
    } catch (e) {
      return {
        id: this.id,
        title: 'DDM Template',
        fields: [{ label: 'Template ID', value: templateId, mono: true }],
        error: `Could not load: ${(e as Error).message}`,
      };
    }
  },
};
