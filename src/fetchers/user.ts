import { headlessGet, jsonwsGet } from '../core/api';
import { firstParam, paramBySuffix } from '../core/params';
import type { Field, Fetcher } from '../core/types';

function userIdFor(ctx: Parameters<Fetcher['appliesTo']>[0]): string | undefined {
  return firstParam(ctx, 'p_u_i_d') ?? paramBySuffix(ctx, 'userId', 'user');
}

/** User account (Users & Organizations admin, profile pages). */
export const userFetcher: Fetcher = {
  id: 'user',
  label: 'User',
  order: 40,
  appliesTo: (ctx) => userIdFor(ctx) !== undefined,
  async fetch(ctx) {
    const userId = userIdFor(ctx)!;
    const fields: Field[] = [];
    const add = (label: string, value: unknown, mono = true) => {
      if (value !== undefined && value !== null && value !== '') {
        fields.push({ label, value: value as Field['value'], mono });
      }
    };
    const raw: Record<string, unknown> = {};

    try {
      const u: any = await jsonwsGet(ctx, 'user/get-user-by-id', { userId });
      raw.user = u;
      add('User ID', u.userId);
      add('UUID', u.uuid);
      add('Screen Name', u.screenName, false);
      add('Email', u.emailAddress, false);
      add('First Name', u.firstName, false);
      add('Last Name', u.lastName, false);
      add('Contact ID', u.contactId);
      add('Company ID', u.companyId);
      add('Status', u.status, false);
      return { id: this.id, title: 'User', fields, raw };
    } catch (jsonwsErr) {
      try {
        const u: any = await headlessGet(
          ctx,
          `/o/headless-admin-user/v1.0/user-accounts/${userId}`,
        );
        raw.headless = u;
        add('User ID', u.id);
        add('Screen Name', u.alternateName, false);
        add('Email', u.emailAddress, false);
        add('Name', u.name, false);
        add('Given Name', u.givenName, false);
        add('Family Name', u.familyName, false);
        return { id: this.id, title: 'User (Headless)', fields, raw };
      } catch {
        return {
          id: this.id,
          title: 'User',
          fields: [{ label: 'User ID', value: userId, mono: true }],
          error: `Could not load: ${(jsonwsErr as Error).message}`,
          raw,
        };
      }
    }
  },
};
