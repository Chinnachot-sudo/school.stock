import { AppUser, UserRole, PermissionKey, UserWithPermissions } from '@/types/inventory';

export type { PermissionKey, UserWithPermissions };

/**
 * Standard Role-to-Permissions Mapping
 * Acts as resilient fallback and synchronous evaluation matrix.
 */
const ALL_PERMISSIONS: PermissionKey[] = [
  'inventory:item:read',
  'inventory:item:create',
  'inventory:item:update',
  'inventory:item:delete',
  'inventory:stock:restock',
  'inventory:stock:issue',
  'inventory:stock:adjust',
  'pos:shift:manage',
  'pos:receipt:read',
  'pos:receipt:create',
  'pos:receipt:void',
  'pos:receipt:refund',
  'customer:read',
  'customer:create',
  'customer:update',
  'customer:delete',
  'invoice:create',
  'invoice:read',
  'invoice:update',
  'payment:receive',
  'request:create',
  'request:read:own',
  'request:approve',
  'request:approve:limited',
  'finance:cost:read',
  'finance:profit:read',
  'report:cost:read',
  'label:print',
  'report:read',
  'report:export',
  'iam:user:read',
  'iam:user:create',
  'iam:user:update',
  'iam:user:disable',
  'iam:user:delete',
  'iam:role:assign',
  'iam:settings:configure',
  'audit:log:read'
];

const ADMIN_PERMISSIONS: PermissionKey[] = ALL_PERMISSIONS.filter(
  p => p !== 'iam:role:assign'
);

const WAREHOUSE_PERMISSIONS: PermissionKey[] = [
  'inventory:item:read',
  'inventory:item:create',
  'inventory:item:update',
  'inventory:item:delete',
  'inventory:stock:restock',
  'inventory:stock:issue',
  'inventory:stock:adjust',
  'request:create',
  'request:read:own',
  'request:approve:limited',
  'finance:cost:read',
  'report:cost:read',
  'label:print',
  'report:read',
  'customer:read'
];

const CASHIER_PERMISSIONS: PermissionKey[] = [
  'inventory:item:read',
  'request:create',
  'request:read:own',
  'pos:shift:manage',
  'pos:receipt:create',
  'pos:receipt:read',
  'pos:receipt:void',
  'pos:receipt:refund',
  'invoice:create',
  'invoice:read',
  'invoice:update',
  'payment:receive',
  'customer:read',
  'customer:create'
];

const ACCOUNTANT_PERMISSIONS: PermissionKey[] = [
  'inventory:item:read',
  'request:create',
  'request:read:own',
  'finance:cost:read',
  'finance:profit:read',
  'report:cost:read',
  'report:read',
  'report:export',
  'invoice:create',
  'invoice:read',
  'invoice:update',
  'payment:receive',
  'pos:receipt:read',
  'customer:read'
];

const TEACHER_PERMISSIONS: PermissionKey[] = [
  'inventory:item:read',
  'request:create',
  'request:read:own',
  'customer:read'
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  super_admin: ALL_PERMISSIONS,
  SUPER_ADMIN: ALL_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  legacy_admin: ADMIN_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  warehouse: WAREHOUSE_PERMISSIONS,
  WAREHOUSE: WAREHOUSE_PERMISSIONS,
  cashier: CASHIER_PERMISSIONS,
  CASHIER: CASHIER_PERMISSIONS,
  accountant: ACCOUNTANT_PERMISSIONS,
  ACCOUNTANT: ACCOUNTANT_PERMISSIONS,
  teacher: TEACHER_PERMISSIONS,
  TEACHER: TEACHER_PERMISSIONS
};

/**
 * Evaluate if a given user holds the required permission
 */
export function can(user: AppUser | null | undefined, permission: PermissionKey): boolean {
  if (!user) return false;

  // 1. Super Admin always has full access
  const role = String(user.role || '').toLowerCase();
  if (role === 'super_admin' || user.role === 'SUPER_ADMIN') return true;

  // 2. Check explicit permissions array attached to user object (if present)
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    const list = user.permissions as string[];
    if (list.includes('*') || list.includes(permission)) {
      return true;
    }
  }

  // 3. Fallback to assigned role permissions
  const rolePermissions =
    DEFAULT_ROLE_PERMISSIONS[user.role] ||
    DEFAULT_ROLE_PERMISSIONS[role] ||
    DEFAULT_ROLE_PERMISSIONS.teacher;
  return rolePermissions.includes(permission);
}

/**
 * Check if a user holds AT LEAST ONE of the specified permissions
 */
export function canAny(user: AppUser | null | undefined, permissions: PermissionKey[]): boolean {
  if (!user || !permissions || permissions.length === 0) return false;
  return permissions.some(p => can(user, p));
}

/**
 * Check if a user holds ALL of the specified permissions
 */
export function canAll(user: AppUser | null | undefined, permissions: PermissionKey[]): boolean {
  if (!user || !permissions || permissions.length === 0) return false;
  return permissions.every(p => can(user, p));
}

/**
 * Check if a user possesses a specific role name
 */
export function hasRole(user: AppUser | null | undefined, roleName: string): boolean {
  if (!user) return false;
  if (user.role === roleName) return true;
  if (Array.isArray(user.roles) && user.roles.includes(roleName)) return true;
  return false;
}

/**
 * Retrieve all effective permissions for a user
 */
export function getUserPermissions(user: AppUser | null | undefined): PermissionKey[] {
  if (!user) return [];
  const role = String(user.role || '').toLowerCase();
  if (role === 'super_admin' || user.role === 'SUPER_ADMIN') {
    return DEFAULT_ROLE_PERMISSIONS.super_admin;
  }
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions as PermissionKey[];
  }
  return (
    DEFAULT_ROLE_PERMISSIONS[user.role] ||
    DEFAULT_ROLE_PERMISSIONS[role] ||
    DEFAULT_ROLE_PERMISSIONS.teacher
  );
}
