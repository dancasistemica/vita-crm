export type UserRole = 'superadmin' | 'owner' | 'admin' | 'vendedor' | 'member' | null;

const CRUD_ROLES: UserRole[] = ['superadmin', 'owner', 'admin'];
const WRITE_ROLES: UserRole[] = ['superadmin', 'owner', 'admin', 'vendedor'];

export function canCreate(role: UserRole): boolean {
  return WRITE_ROLES.includes(role);
}

export function canEdit(role: UserRole): boolean {
  return WRITE_ROLES.includes(role);
}

export function canDelete(role: UserRole): boolean {
  return CRUD_ROLES.includes(role);
}

export function canAccessSettings(role: UserRole): boolean {
  return CRUD_ROLES.includes(role);
}

export function canEditRecord(role: UserRole, recordResponsible: string | null, currentUserName: string): boolean {
  if (CRUD_ROLES.includes(role)) return true;
  if (role === 'vendedor') return recordResponsible === currentUserName;
  return false;
}

export function canDeleteRecord(role: UserRole): boolean {
  return CRUD_ROLES.includes(role);
}
