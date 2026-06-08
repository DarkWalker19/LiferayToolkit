import { headlessGet, jsonwsGet } from '../core/api';
import { paramBySuffix } from '../core/params';
import type { Field, Fetcher } from '../core/types';

/** Role (Roles admin). */
export const roleFetcher: Fetcher = {
  id: 'role',
  label: 'Role',
  order: 41,
  appliesTo: (ctx) => paramBySuffix(ctx, 'roleId') !== undefined,
  async fetch(ctx) {
    const roleId = paramBySuffix(ctx, 'roleId')!;
    const fields: Field[] = [];
    const add = (label: string, value: unknown, mono = true) => {
      if (value !== undefined && value !== null && value !== '') {
        fields.push({ label, value: value as Field['value'], mono });
      }
    };
    const raw: Record<string, unknown> = {};

    try {
      const r: any = await jsonwsGet(ctx, 'role/get-role', { roleId });
      raw.role = r;
      add('Role ID', r.roleId);
      add('UUID', r.uuid);
      add('Name', r.name, false);
      add('Title', r.titleCurrentValue ?? r.title, false);
      add('Type', r.type, false);
      add('Subtype', r.subtype, false);
      add('Class Name ID', r.classNameId);
      add('Company ID', r.companyId);
      return { id: this.id, title: 'Role', fields, raw };
    } catch (jsonwsErr) {
      try {
        const r: any = await headlessGet(ctx, `/o/headless-admin-user/v1.0/roles/${roleId}`);
        raw.headless = r;
        add('Role ID', r.id);
        add('Name', r.name, false);
        add('Type', r.roleType, false);
        add('Description', r.description, false);
        return { id: this.id, title: 'Role (Headless)', fields, raw };
      } catch {
        return {
          id: this.id,
          title: 'Role',
          fields: [{ label: 'Role ID', value: roleId, mono: true }],
          error: `Could not load: ${(jsonwsErr as Error).message}`,
          raw,
        };
      }
    }
  },
};
