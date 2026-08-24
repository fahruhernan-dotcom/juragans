import { BUSINESS_ROLES, APP_ROLES } from './constants';

export const isDevUser = (profile) => profile?.role === 'dev' || profile?.app_role === APP_ROLES.SUPERADMIN || profile?.role === APP_ROLES.SUPERADMIN;

export const isOwnerUser = (profile) => isDevUser(profile) || profile?.role === BUSINESS_ROLES.OWNER || profile?.role === 'owner';

export const isAdminUser = (profile) => profile?.role === BUSINESS_ROLES.ADMIN || profile?.role === 'admin';

export const canViewProfit = (profile) =>
  isDevUser(profile) ||
  isOwnerUser(profile);

export const canManageAccounts = (profile) => isDevUser(profile);

export const canViewAuditLogs = (profile) => isOwnerUser(profile) || isDevUser(profile);

export const isOwner = (profile) => isOwnerUser(profile);

export const isManager = (profile) => [BUSINESS_ROLES.MANAGER, BUSINESS_ROLES.MANAJER].includes(profile?.role);

export const isStaff = (profile) => profile?.role === BUSINESS_ROLES.STAFF;

export const isViewOnly = (profile) => profile?.role === BUSINESS_ROLES.VIEW_ONLY;

