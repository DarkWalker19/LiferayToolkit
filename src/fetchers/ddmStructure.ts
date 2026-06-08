import { jsonwsGet } from '../core/api';
import { firstParam } from '../core/params';
import type { Field, Fetcher } from '../core/types';

/** DDM Structure (web content / object structures). */
export const ddmStructureFetcher: Fetcher = {
  id: 'ddm-structure',
  label: 'DDM Structure',
  order: 30,
  appliesTo: (ctx) => firstParam(ctx, 'ddmStructureId', 'structureId') !== undefined,
  async fetch(ctx) {
    const structureId = firstParam(ctx, 'ddmStructureId', 'structureId')!;
    const fields: Field[] = [];
    const add = (label: string, value: unknown, mono = true) => {
      if (value !== undefined && value !== null && value !== '') {
        fields.push({ label, value: value as Field['value'], mono });
      }
    };

    try {
      const s: any = await jsonwsGet(ctx, 'ddm.ddmstructure/get-structure', { structureId });
      add('Structure ID', s.structureId);
      add('UUID', s.uuid);
      add('Structure Key', s.structureKey);
      add('Name', s.nameCurrentValue ?? s.name, false);
      add('Class Name ID', s.classNameId);
      add('Group ID', s.groupId);
      add('Version', s.version, false);
      return { id: this.id, title: 'DDM Structure', fields, raw: { structure: s } };
    } catch (e) {
      return {
        id: this.id,
        title: 'DDM Structure',
        fields: [{ label: 'Structure ID', value: structureId, mono: true }],
        error: `Could not load: ${(e as Error).message}`,
      };
    }
  },
};
