export const isOwnerOrAdmin = (profile) =>
  ['owner', 'admin', 'superadmin', 'manajer', 'manager', 'dev'].includes(profile?.role || profile?.app_role);

export const canManageSales = (profile) =>
  ['owner', 'admin', 'superadmin', 'manajer', 'manager', 'sales', 'kasir', 'staff', 'dev'].includes(profile?.role || profile?.app_role);

export const canUpdateSales = (profile) => canManageSales(profile);

export const canManagePurchases = (profile) =>
  ['owner', 'admin', 'superadmin', 'manajer', 'manager', 'staff_gudang', 'gudang', 'staff', 'dev'].includes(profile?.role || profile?.app_role);

export const canUpdatePurchases = (profile) => canManagePurchases(profile);

export const canManagePayments = (profile) =>
  ['owner', 'admin', 'superadmin', 'manajer', 'manager', 'finance', 'sales', 'kasir', 'dev'].includes(profile?.role || profile?.app_role);

export const canUpdatePayments = (profile) => canManagePayments(profile);

export const canManageInventory = (profile) =>
  ['owner', 'admin', 'superadmin', 'manajer', 'manager', 'gudang', 'staff_gudang', 'staff', 'dev'].includes(profile?.role || profile?.app_role);

export const canManageLogistics = (profile) =>
  ['owner', 'admin', 'superadmin', 'manajer', 'manager', 'supir', 'kurir', 'dev'].includes(profile?.role || profile?.app_role);

export const canViewFinance = (profile) =>
  ['owner', 'admin', 'superadmin', 'finance', 'manajer', 'manager', 'dev'].includes(profile?.role || profile?.app_role);

export const canManageOperations = (profile) =>
  ['owner', 'admin', 'superadmin', 'manajer', 'manager', 'staff', 'dev'].includes(profile?.role || profile?.app_role);

export const canManageTeam = (profile) =>
  ['owner', 'admin', 'superadmin', 'manajer', 'manager', 'dev'].includes(profile?.role || profile?.app_role);

export const canViewReports = (profile) =>
  ['owner', 'admin', 'superadmin', 'manajer', 'manager', 'finance', 'sales', 'dev'].includes(profile?.role || profile?.app_role);
