import type { UserRole } from "@prisma/client";
import type { Locale } from "@/lib/i18n";
import { isPlatformAdminUserRole } from "@/lib/auth/platform-admin-guard";
import type { UserWithProfiles } from "@/features/auth/user.repository";

export type PortalEntryRole = "brand" | "creator";

export class IdentityRoleConflictError extends Error {
  readonly code = "wrong-role" as const;

  constructor(message: string) {
    super(message);
    this.name = "IdentityRoleConflictError";
  }
}

export function portalEntryToUserRole(entryRole: PortalEntryRole): UserRole {
  return entryRole === "creator" ? "CREATOR" : "BRAND";
}

export function userMatchesRequestedRole(
  user: Pick<UserWithProfiles, "role">,
  requestedRole: UserRole
): boolean {
  return user.role === requestedRole;
}

export function identityRoleMismatchMessage(
  actualRole: UserRole,
  _requestedRole: UserRole,
  locale: Locale
): string {
  if (locale === "zh") {
    if (actualRole === "CREATOR") {
      return "该邮箱已注册为创作者身份，无法再以品牌方身份注册或登录。请切换到创作者登录，或使用其他邮箱。";
    }
    return "该邮箱已注册为品牌方身份，无法再以创作者身份注册或登录。请切换到品牌方登录，或使用其他邮箱。";
  }

  if (actualRole === "CREATOR") {
    return "This email is already registered as a creator. Switch to the creator login tab or use a different email for brand access.";
  }

  return "This email is already registered as a brand. Switch to the brand login tab or use a different email for creator access.";
}

export function checkIdentityRole(
  user: UserWithProfiles | null | undefined,
  requestedRole: UserRole,
  locale: Locale
): { ok: true } | { ok: false; error: string; errorCode: "wrong-role" } {
  if (!user) {
    return { ok: true };
  }

  if (userMatchesRequestedRole(user, requestedRole)) {
    return { ok: true };
  }

  if (isPlatformAdminUserRole(user.role)) {
    return {
      ok: false,
      error:
        locale === "zh"
          ? "平台管理员账号请使用管理员登录入口。"
          : "Platform admin accounts must use the admin login page.",
      errorCode: "wrong-role"
    };
  }

  return {
    ok: false,
    error: identityRoleMismatchMessage(user.role, requestedRole, locale),
    errorCode: "wrong-role"
  };
}

export function assertIdentityRoleOrThrow(
  user: UserWithProfiles | null | undefined,
  requestedRole: UserRole,
  locale: Locale
): void {
  const result = checkIdentityRole(user, requestedRole, locale);
  if (!result.ok) {
    throw new IdentityRoleConflictError(result.error);
  }
}
