import type { UserRole } from "@/services/permissionService";

export function canDeleteLead(userRole: UserRole): boolean {
  return userRole === "admin" || userRole === "owner";
}

export function assertCanDeleteLead(userRole: UserRole): void {
  if (!canDeleteLead(userRole)) {
    throw new Error("Sem permissao para excluir este lead");
  }
}
