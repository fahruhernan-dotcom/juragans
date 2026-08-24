import { APP_ROLES } from './constants';

/**
 * Dual-mode superadmin check — migration-safe.
 * Accepts BOTH new `app_role` field AND legacy `role === 'superadmin'` during
 * the DB schema transition. Remove the `|| profile?.role === ...` clause in Phase 5.
 */
export const isSuperadmin = (profile) =>
  profile?.app_role === APP_ROLES.SUPERADMIN ||
  profile?.role === APP_ROLES.SUPERADMIN ||
  profile?.user_type === APP_ROLES.SUPERADMIN;

export const isUser = (profile) => profile?.app_role === APP_ROLES.USER;
