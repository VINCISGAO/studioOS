import "server-only";

import { validateAdminSession } from "@/features/admin/auth/admin-auth.service";
import type { AdminUser } from "@/features/admin/auth/admin-user.repository";
import { guardAdminApiMutation } from "@/features/admin/auth/admin-mutation-guard";
import type { AuthUser } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";

export function adminUserToAuthUser(admin: AdminUser): AuthUser {
  return {
    id: admin.id,
    role: "ADMIN"
  };
}

export async function requireAdminSession(request?: Request): Promise<AdminUser> {
  const admin = await validateAdminSession(request);
  if (!admin) {
    throw appError("UNAUTHORIZED", "Admin session required");
  }
  return admin;
}

export async function requireAdminAuthUser(request?: Request): Promise<AuthUser> {
  return adminUserToAuthUser(await requireAdminSession(request));
}

export async function requireAdminMutation(request: Request): Promise<AdminUser> {
  return guardAdminApiMutation(request);
}

export async function requireMasterAdminSession(request?: Request): Promise<AdminUser> {
  const admin = await requireAdminSession(request);
  if (!admin.isMaster) {
    throw appError("FORBIDDEN", "Master admin required");
  }
  return admin;
}

export async function requireMasterAdminMutation(request: Request): Promise<AdminUser> {
  const admin = await requireAdminMutation(request);
  if (!admin.isMaster) {
    throw appError("FORBIDDEN", "Master admin required");
  }
  return admin;
}

export async function requireAdminMutationUser(request: Request): Promise<AuthUser> {
  return adminUserToAuthUser(await requireAdminMutation(request));
}

/** @deprecated use adminUserToAuthUser */
export const adminProfileToAuthUser = adminUserToAuthUser;

/** @deprecated Admin is not a User profile */
export type AdminProfileWithUser = AdminUser;
