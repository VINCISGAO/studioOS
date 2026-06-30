/**
 * RBAC permission matrix — Vol 07 / Sprint 16
 * Source of truth: features/auth/permission.service.ts
 */
import { PermissionService, type Permission } from "@/features/auth/permission.service";

export type RbacMatrixRow = {
  role: string;
  permissions: Permission[];
};

export function getRbacMatrix(): RbacMatrixRow[] {
  return PermissionService.exportMatrix();
}

export function roleHasPermission(role: string, permission: Permission): boolean {
  return PermissionService.can({ id: "matrix-check", role }, permission);
}
