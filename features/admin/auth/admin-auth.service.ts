import "server-only";

import { cache } from "react";
import type { AdminAccountStatus } from "@prisma/client";
import { adminRequestFromHeaders } from "@/lib/auth/admin-request-from-headers";
import { adminAuthError } from "@/lib/auth/admin-auth-errors";
import { adminRequestContext } from "@/lib/auth/admin-request-context";
import { decryptTotpSecret } from "@/lib/auth/admin-totp-crypto";
import { withLocale, type Locale } from "@/lib/i18n";
import type { AuthUserDto } from "@/features/auth/auth.service";
import { adminAuthAuditRepository } from "@/features/admin/auth/admin-auth-audit.repository";
import { adminUserRepository, type AdminUser } from "@/features/admin/auth/admin-user.repository";
import { adminSessionRepository } from "@/features/admin/auth/admin-session.repository";
import {
  clearAdminSessionCookie,
  readAdminSessionToken,
  revokeAdminSessionToken,
  setAdminSessionCookie
} from "@/features/admin/auth/admin-session-server";
import { assertAuthSecuritySecret, isProductionRuntime } from "@/lib/auth/admin-security-config";
import { assertAdminCoreSecretsProductionReady } from "@/lib/auth/admin-secrets-guard";
import { notifyAdminLoginSuccess } from "@/features/admin/auth/admin-security-alert.service";
import { verifyAndConsumeAdminTotp } from "@/features/admin/auth/admin-totp-replay.service";
import { deriveDeviceLabel } from "@/features/admin/auth/admin-session-management.service";
import { recordMasterStepUp } from "@/features/admin/auth/admin-step-up.service";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

const LOCK_15_MIN_MS = 15 * 60 * 1000;
const LOCK_1_HOUR_MS = 60 * 60 * 1000;
const IP_FAILURE_LOCK_WINDOW_MS = 15 * 60 * 1000;

function publicLoginFailure(
  locale: Locale,
  detail?: "securityMisconfigured" | "totpDecryptFailed"
) {
  if (!isProductionRuntime() && detail) {
    return adminAuthError(locale, detail);
  }
  return adminAuthError(locale, "loginFailed");
}

function resolveAdminNextPath(nextPath: string, locale: Locale) {
  if (nextPath.startsWith("/admin")) {
    return withLocale(nextPath, locale);
  }
  return withLocale("/admin", locale);
}

function readPermissions(raw: unknown) {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

export async function completeAdminLogin(input: {
  profile: AdminUser;
  email: string;
  ctx: ReturnType<typeof adminRequestContext>;
  locale: Locale;
  nextPath: string;
  deviceLabel?: string;
  loginMethod?: "totp" | "passkey";
}) {
  await adminSessionRepository.revokeAllForProfile(input.profile.id);
  const session = await adminSessionRepository.createSession({
    adminUserId: input.profile.id,
    ipHash: input.ctx.ipHash,
    userAgentHash: input.ctx.userAgentHash,
    deviceLabel: input.deviceLabel ?? deriveDeviceLabel(
      new Request("https://studioos.local", {
        headers: { "user-agent": input.ctx.userAgent }
      })
    )
  });

  await setAdminSessionCookie(session.token);
  void adminUserRepository.recordSuccessfulLogin(input.profile.id);

  const permissions = readPermissions(input.profile.permissions);
  const lastLoginIpHash =
    typeof permissions.lastLoginIpHash === "string" ? permissions.lastLoginIpHash : null;
  const isNewIp = Boolean(lastLoginIpHash && lastLoginIpHash !== input.ctx.ipHash);

  void prisma.adminUser.update({
    where: { id: input.profile.id },
    data: {
      permissions: {
        ...permissions,
        lastLoginIpHash: input.ctx.ipHash
      }
    }
  });

  void notifyAdminLoginSuccess({
    email: input.email,
    ipHash: input.ctx.ipHash,
    userAgentHash: input.ctx.userAgentHash,
    isNewIp,
    metadata: { method: input.loginMethod ?? "totp" }
  });

  return {
    ok: true as const,
    redirectTo: resolveAdminNextPath(input.nextPath, input.locale),
    sessionToken: session.token
  };
}

export async function loginAdminWithTotp(input: {
  request: Request;
  email: string;
  code: string;
  lang: Locale;
  nextPath?: string;
}) {
  const ctx = adminRequestContext(input.request);
  const email = input.email.trim().toLowerCase();
  const code = input.code.trim();
  const locale = input.lang;
  const nextPath = input.nextPath?.trim() ?? "";

  void adminAuthAuditRepository.write({
    event: "admin_login_attempt",
    success: true,
    email,
    ipHash: ctx.ipHash,
    userAgentHash: ctx.userAgentHash
  });

  try {
    assertAdminCoreSecretsProductionReady();
    assertAuthSecuritySecret();
  } catch {
    return { ok: false as const, error: publicLoginFailure(locale, "securityMisconfigured") };
  }

  if (!hasDatabaseUrl()) {
    void adminAuthAuditRepository.write({
      event: "admin_login_failed",
      success: false,
      email,
      ipHash: ctx.ipHash,
      userAgentHash: ctx.userAgentHash,
      failureReason: "database_unavailable"
    });
    return { ok: false as const, error: publicLoginFailure(locale) };
  }

  const profile = await adminUserRepository.findLoginCandidateByEmail(email);
  if (!profile) {
    void adminAuthAuditRepository.write({
      event: "admin_login_failed",
      success: false,
      email,
      ipHash: ctx.ipHash,
      userAgentHash: ctx.userAgentHash,
      failureReason: "not_whitelisted"
    });
    return { ok: false as const, error: publicLoginFailure(locale) };
  }

  if (profile.status !== "ACTIVE" || !profile.totpEnabled || !profile.totpSecretEnc) {
    void adminAuthAuditRepository.write({
      event: "admin_login_failed",
      success: false,
      email,
      adminUserId: profile.id,
      ipHash: ctx.ipHash,
      userAgentHash: ctx.userAgentHash,
      failureReason: "pending_setup"
    });
    return { ok: false as const, error: publicLoginFailure(locale) };
  }

  if (!profile.isMaster && profile.lockedUntil && profile.lockedUntil > new Date()) {
    void adminAuthAuditRepository.write({
      event: "admin_login_failed",
      success: false,
      email,
      adminUserId: profile.id,
      ipHash: ctx.ipHash,
      userAgentHash: ctx.userAgentHash,
      failureReason: "locked"
    });
    return { ok: false as const, error: adminAuthError(locale, "rateLimited") };
  }

  let totpValid = false;
  try {
    const secret = decryptTotpSecret(profile.totpSecretEnc);
    totpValid = await verifyAndConsumeAdminTotp({
      adminUserId: profile.id,
      secret,
      code,
      purpose: "login"
    });
  } catch {
    void adminAuthAuditRepository.write({
      event: "admin_login_failed",
      success: false,
      email,
      adminUserId: profile.id,
      ipHash: ctx.ipHash,
      userAgentHash: ctx.userAgentHash,
      failureReason: "totp_decrypt_failed"
    });
    return { ok: false as const, error: publicLoginFailure(locale, "totpDecryptFailed") };
  }

  if (!totpValid) {
    void adminAuthAuditRepository.write({
      event: "admin_totp_failed",
      success: false,
      email,
      adminUserId: profile.id,
      ipHash: ctx.ipHash,
      userAgentHash: ctx.userAgentHash,
      failureReason: "invalid_totp"
    });

    if (profile.isMaster) {
      return { ok: false as const, error: publicLoginFailure(locale) };
    }

    const ipFailures = await adminAuthAuditRepository.countRecentFailuresForUser({
      adminUserId: profile.id,
      ipHash: ctx.ipHash,
      since: new Date(Date.now() - IP_FAILURE_LOCK_WINDOW_MS)
    });
    const failedAttempts = ipFailures;
    let lockedUntil: Date | null = null;
    let status: AdminAccountStatus = profile.status;

    if (failedAttempts >= 10) {
      lockedUntil = new Date(Date.now() + LOCK_1_HOUR_MS);
      status = "LOCKED";
      void adminAuthAuditRepository.write({
        event: "admin_locked",
        success: false,
        email,
        adminUserId: profile.id,
        ipHash: ctx.ipHash,
        userAgentHash: ctx.userAgentHash,
        failureReason: "totp_failed_10",
        metadata: { failedAttempts, ipScoped: true }
      });
    } else if (failedAttempts >= 5) {
      lockedUntil = new Date(Date.now() + LOCK_15_MIN_MS);
    }

    if (lockedUntil) {
      void adminUserRepository.recordFailedLogin(profile.id, failedAttempts, lockedUntil, status);
    }

    return {
      ok: false as const,
      error:
        failedAttempts >= 5 ? adminAuthError(locale, "rateLimited") : publicLoginFailure(locale)
    };
  }

  return completeAdminLogin({ profile, email, ctx, locale, nextPath });
}

function adminUserToSessionDto(admin: AdminUser): AuthUserDto {
  return {
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    role: "ADMIN",
    languageCode: "en"
  };
}

export async function logoutAdminSession(input: { request: Request; emailHint?: string }) {
  const ctx = adminRequestContext(input.request);
  const token = await readAdminSessionToken();
  await revokeAdminSessionToken(token);
  await clearAdminSessionCookie();

  void adminAuthAuditRepository.write({
    event: "admin_logout",
    success: true,
    email: input.emailHint,
    ipHash: ctx.ipHash,
    userAgentHash: ctx.userAgentHash
  });
}

export const validateAdminSession = cache(async function validateAdminSession(request?: Request) {
  const token = await readAdminSessionToken();
  if (!token) return null;

  const ctx = request
    ? adminRequestContext(request)
    : adminRequestContext(await adminRequestFromHeaders("/admin"));

  const profile = await adminSessionRepository.findValidSession({
    token,
    ipHash: ctx.ipHash,
    userAgentHash: ctx.userAgentHash
  });

  if (!profile || profile.status !== "ACTIVE" || !profile.totpEnabled) {
    if (token) {
      await revokeAdminSessionToken(token);
      await clearAdminSessionCookie();
      if (request) {
        const auditCtx = adminRequestContext(request);
        await adminAuthAuditRepository.write({
          event: "admin_session_expired",
          success: false,
          ipHash: auditCtx.ipHash,
          userAgentHash: auditCtx.userAgentHash,
          failureReason: "invalid_session"
        });
      }
    }
    return null;
  }

  return profile;
});

export async function getAdminSessionProfile(request?: Request) {
  return validateAdminSession(request);
}

export async function verifyAdminStepUpTotp(input: {
  request: Request;
  totpCode: string;
}): Promise<{ ok: true; profile: AdminUser } | { ok: false; error: "no_session" | "invalid_totp" }> {
  const profile = await validateAdminSession(input.request);
  if (!profile) return { ok: false, error: "no_session" };

  const code = input.totpCode.trim();
  if (!code || !profile.totpSecretEnc) return { ok: false, error: "invalid_totp" };

  try {
    const secret = decryptTotpSecret(profile.totpSecretEnc);
    const valid = await verifyAndConsumeAdminTotp({
      adminUserId: profile.id,
      secret,
      code,
      purpose: "step_up"
    });
    if (!valid) return { ok: false, error: "invalid_totp" };
  } catch {
    return { ok: false, error: "invalid_totp" };
  }

  return { ok: true, profile };
}

export async function verifyMasterStepUpTotp(input: {
  request: Request;
  totpCode: string | null;
  skipTotp?: boolean;
}): Promise<
  | { ok: true; profile: AdminUser & { isMaster: true } }
  | { ok: false; error: "no_session" | "not_master" | "invalid_totp" }
> {
  const profile = await validateAdminSession(input.request);
  if (!profile) {
    return { ok: false, error: "no_session" };
  }
  if (!profile.isMaster) {
    return { ok: false, error: "not_master" };
  }

  if (!input.skipTotp) {
    const code = input.totpCode?.trim() ?? "";
    if (!code || !profile.totpSecretEnc) {
      return { ok: false, error: "invalid_totp" };
    }
    try {
      const secret = decryptTotpSecret(profile.totpSecretEnc);
      const valid = await verifyAndConsumeAdminTotp({
        adminUserId: profile.id,
        secret,
        code,
        purpose: "step_up"
      });
      if (!valid) {
        return { ok: false, error: "invalid_totp" };
      }
    } catch {
      return { ok: false, error: "invalid_totp" };
    }

    const sessionToken = (await readAdminSessionToken()) ?? "";
    if (sessionToken) {
      await recordMasterStepUp(profile.id, sessionToken);
    }
  }

  return { ok: true, profile: profile as AdminUser & { isMaster: true } };
}

export async function getAdminSessionUser(request?: Request): Promise<AuthUserDto | null> {
  const profile = await validateAdminSession(request);
  if (!profile) return null;
  return adminUserToSessionDto(profile);
}

export async function requireAdminSessionUser(request?: Request): Promise<AuthUserDto> {
  const user = await getAdminSessionUser(request);
  if (!user) {
    throw new Error("ADMIN_SESSION_REQUIRED");
  }
  return user;
}
