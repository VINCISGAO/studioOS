import "server-only";

import { validateAdminCsrf, validateAdminCsrfValue } from "@/lib/auth/admin-csrf";
import { validateAdminMutationOrigin } from "@/lib/auth/admin-mutation-origin";
import { validateAdminSession } from "@/features/admin/auth/admin-auth.service";
import type { AdminProfileWithUser } from "@/features/admin/auth/admin-profile.repository";
import type { AuthUser } from "@/features/auth/permission.service";
import { isPrismaAdminRole } from "@/lib/auth/route-access";
import { appError } from "@/lib/core/errors";
import { headers } from "next/headers";

async function requireAdminProfile(request?: Request): Promise<AdminProfileWithUser> {
  const profile = await validateAdminSession(request);
  if (!profile || !isPrismaAdminRole(profile.user.role)) {
    throw appError("UNAUTHORIZED", "Admin session required");
  }
  return profile;
}

function requestFromHeaders(headerList: Headers) {
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost";
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  return new Request(`${proto}://${host}/admin`, { headers: headerList });
}

/** Unified mutation guard for REST APIs. */
export async function guardAdminApiMutation(request: Request): Promise<AdminProfileWithUser> {
  if (!validateAdminMutationOrigin(request)) {
    throw appError("FORBIDDEN", "Cross-origin admin mutation blocked");
  }
  if (!(await validateAdminCsrf(request))) {
    throw appError("FORBIDDEN", "Invalid CSRF token");
  }
  return requireAdminProfile(request);
}

/** Unified mutation guard for Server Actions (CSRF + origin + session). */
export async function guardAdminServerAction(formData: FormData): Promise<AdminProfileWithUser> {
  const headerList = await headers();
  const request = requestFromHeaders(headerList);

  if (!validateAdminMutationOrigin(request)) {
    throw appError("FORBIDDEN", "Cross-origin admin mutation blocked");
  }

  const csrfHeader = headerList.get("x-admin-csrf")?.trim() ?? "";
  const csrfForm = String(formData.get("_adminCsrf") ?? "").trim();
  const csrf = csrfHeader || csrfForm;

  if (!(await validateAdminCsrfValue(csrf))) {
    throw appError("FORBIDDEN", "Invalid CSRF token");
  }

  return requireAdminProfile(request);
}

function adminProfileToAuthUser(profile: AdminProfileWithUser): AuthUser {
  return { id: profile.user.id, role: profile.user.role };
}

export async function guardAdminServerActionUser(formData: FormData): Promise<AuthUser> {
  return adminProfileToAuthUser(await guardAdminServerAction(formData));
}

export async function guardMasterServerAction(formData: FormData): Promise<AdminProfileWithUser> {
  const profile = await guardAdminServerAction(formData);
  if (!profile.isMaster) {
    throw appError("FORBIDDEN", "Master admin required");
  }
  return profile;
}
