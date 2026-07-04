import "server-only";

import { validateAdminSession } from "@/features/admin/auth/admin-auth.service";
import type { AdminProfileWithUser } from "@/features/admin/auth/admin-profile.repository";
import { guardAdminApiMutation } from "@/features/admin/auth/admin-mutation-guard";
import type { AuthUser } from "@/features/auth/permission.service";
import { isPrismaAdminRole } from "@/lib/auth/route-access";
import { appError } from "@/lib/core/errors";

export function adminProfileToAuthUser(profile: AdminProfileWithUser): AuthUser {
  return {
    id: profile.user.id,
    role: profile.user.role
  };
}

export async function requireAdminSession(request?: Request): Promise<AdminProfileWithUser> {
  const profile = await validateAdminSession(request);
  if (!profile || !isPrismaAdminRole(profile.user.role)) {
    throw appError("UNAUTHORIZED", "Admin session required");
  }
  return profile;
}

export async function requireAdminAuthUser(request?: Request): Promise<AuthUser> {
  return adminProfileToAuthUser(await requireAdminSession(request));
}

export async function requireAdminMutation(request: Request): Promise<AdminProfileWithUser> {
  return guardAdminApiMutation(request);
}

export async function requireMasterAdminSession(request?: Request): Promise<AdminProfileWithUser> {
  const profile = await requireAdminSession(request);
  if (!profile.isMaster) {
    throw appError("FORBIDDEN", "Master admin required");
  }
  return profile;
}

export async function requireMasterAdminMutation(request: Request): Promise<AdminProfileWithUser> {
  const profile = await requireAdminMutation(request);
  if (!profile.isMaster) {
    throw appError("FORBIDDEN", "Master admin required");
  }
  return profile;
}

export async function requireAdminMutationUser(request: Request): Promise<AuthUser> {
  return adminProfileToAuthUser(await requireAdminMutation(request));
}
