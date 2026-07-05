import "server-only";

import { validateAdminCsrf, validateAdminCsrfValue } from "@/lib/auth/admin-csrf";
import { validateAdminMutationOrigin } from "@/lib/auth/admin-mutation-origin";
import { validateAdminSession } from "@/features/admin/auth/admin-auth.service";
import type { AdminUser } from "@/features/admin/auth/admin-user.repository";
import { adminUserToAuthUser } from "@/features/admin/auth/admin-api-guard";
import type { AuthUser } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import { headers } from "next/headers";

async function requireAdminUser(request?: Request): Promise<AdminUser> {
  const admin = await validateAdminSession(request);
  if (!admin) {
    throw appError("UNAUTHORIZED", "Admin session required");
  }
  return admin;
}

function requestFromHeaders(headerList: Headers) {
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost";
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  return new Request(`${proto}://${host}/admin`, { headers: headerList });
}

/** Unified mutation guard for REST APIs. */
export async function guardAdminApiMutation(request: Request): Promise<AdminUser> {
  if (!validateAdminMutationOrigin(request)) {
    throw appError("FORBIDDEN", "Cross-origin admin mutation blocked");
  }
  if (!(await validateAdminCsrf(request))) {
    throw appError("FORBIDDEN", "Invalid CSRF token");
  }
  return requireAdminUser(request);
}

/** Unified mutation guard for Server Actions (CSRF + origin + session). */
export async function guardAdminServerAction(formData: FormData): Promise<AdminUser> {
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

  return requireAdminUser(request);
}

export async function guardAdminServerActionUser(formData: FormData): Promise<AuthUser> {
  return adminUserToAuthUser(await guardAdminServerAction(formData));
}

export async function guardMasterServerAction(formData: FormData): Promise<AdminUser> {
  const admin = await guardAdminServerAction(formData);
  if (!admin.isMaster) {
    throw appError("FORBIDDEN", "Master admin required");
  }
  return admin;
}

/** @deprecated use AdminUser */
export type AdminProfileWithUser = AdminUser;
