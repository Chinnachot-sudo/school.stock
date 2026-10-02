export type DbRole =
  | 'super_admin'
  | 'admin'
  | 'legacy_admin'
  | 'warehouse'
  | 'cashier'
  | 'accountant'
  | 'teacher';

export type UiRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'WAREHOUSE'
  | 'CASHIER'
  | 'ACCOUNTANT'
  | 'TEACHER';

/**
 * Map UI / Input role strings to the canonical lowercase DB roles
 */
export function toDbRole(role: string): DbRole | null {
  const r = String(role || '').trim().toLowerCase();
  if (r === 'super_admin') return 'super_admin';
  if (r === 'admin' || r === 'legacy_admin' || r === 'inventory_manager') return 'admin';
  if (r === 'warehouse') return 'warehouse';
  if (r === 'cashier') return 'cashier';
  if (r === 'accountant') return 'accountant';
  if (r === 'teacher' || r === 'staff') return 'teacher';
  return null;
}

/**
 * Map DB lowercase roles to UI uppercase roles
 */
export function toUiRole(role: string): UiRole {
  const r = String(role || '').trim().toLowerCase();
  switch (r) {
    case 'super_admin':
      return 'SUPER_ADMIN';
    case 'admin':
    case 'legacy_admin':
    case 'inventory_manager':
      return 'ADMIN';
    case 'warehouse':
      return 'WAREHOUSE';
    case 'cashier':
      return 'CASHIER';
    case 'accountant':
      return 'ACCOUNTANT';
    case 'teacher':
    default:
      return 'TEACHER';
  }
}

