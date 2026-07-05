import "server-only";

import { adminAuthAuditRepository } from "@/features/admin/auth/admin-auth-audit.repository";
import { adminUserRepository } from "@/features/admin/auth/admin-user.repository";
import { validateAdminSession, verifyMasterStepUpTotp } from "@/features/admin/auth/admin-auth.service";
import { notifyAdminSetupLinkSent } from "@/features/admin/auth/admin-security-alert.service";
import {
  isAdminSetupEmailRequired,
  sendAdminSetupLinkEmail
} from "@/features/admin/auth/admin-setup-email.service";
import { hasValidMasterStepUp } from "@/features/admin/auth/admin-step-up.service";
import { readAdminSessionToken } from "@/features/admin/auth/admin-session-server";
import { adminRequestContext } from "@/lib/auth/admin-request-context";
import { createAdminSetupToken, hashSetupToken } from "@/lib/auth/admin-setup-token";
import { isProductionRuntime } from "@/lib/auth/admin-security-config";
import { prisma } from "@/lib/core/database/prisma";
import type { Locale } from "@/lib/i18n";

function copy(locale: Locale) {
  return locale === "zh"
    ? {
        masterOnly: "仅主账号可管理后台管理员。",
        invalidTotp: "Google 验证器代码无效，请重试。",
        emailTaken: "该邮箱已有可用管理员账号。",
        emailInvalid: "请输入有效邮箱。",
        selfEmail: "不能添加主账号自身。",
        emailSendFailed: "绑定邮件发送失败，请检查 RESEND 配置。"
      }
    : {
        masterOnly: "Only the master admin can manage admin accounts.",
        invalidTotp: "Invalid authenticator code. Try again.",
        emailTaken: "That email already has an active admin account.",
        emailInvalid: "Enter a valid email address.",
        selfEmail: "Cannot provision the master account again.",
        emailSendFailed: "Failed to send setup email. Check RESEND configuration."
      };
}

function buildSetupPath(token: string) {
  return `/admin/setup-totp?token=${encodeURIComponent(token)}`;
}

function mapAccounts(rows: Awaited<ReturnType<typeof adminUserRepository.listActiveAccounts>>) {
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    isMaster: row.isMaster,
    status: row.status,
    totpEnabled: row.totpEnabled,
    createdAt: row.createdAt.toISOString()
  }));
}

export async function listAdminAccountsForMaster(request: Request, totpCode?: string | null) {
  const sessionProfile = await validateAdminSession(request);
  if (!sessionProfile?.isMaster) {
    return { ok: false as const, error: "not_master" as const };
  }

  const sessionToken = await readAdminSessionToken();
  if (totpCode?.trim()) {
    const gate = await verifyMasterStepUpTotp({ request, totpCode });
    if (!gate.ok) {
      return gate.error === "invalid_totp"
        ? { ok: false as const, error: "invalid_totp" as const }
        : { ok: false as const, error: gate.error };
    }
  } else if (!hasValidMasterStepUp(sessionProfile, sessionToken)) {
    return { ok: false as const, error: "step_up_required" as const };
  }

  const rows = await adminUserRepository.listActiveAccounts();
  return { ok: true as const, accounts: mapAccounts(rows) };
}

export async function provisionAdminAccount(input: {
  request: Request;
  email: string;
  fullName: string;
  totpCode: string;
  locale: Locale;
  origin: string;
}) {
  const t = copy(input.locale);
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim() || email.split("@")[0] || "Admin";
  const ctx = adminRequestContext(input.request);

  if (!email.includes("@")) {
    return { ok: false as const, error: t.emailInvalid };
  }

  if (isAdminSetupEmailRequired() && !process.env.RESEND_API_KEY) {
    return { ok: false as const, error: t.emailSendFailed };
  }

  const gate = await verifyMasterStepUpTotp({ request: input.request, totpCode: input.totpCode });
  if (!gate.ok) {
    return gate.error === "invalid_totp"
      ? { ok: false as const, error: t.invalidTotp }
      : { ok: false as const, error: t.masterOnly };
  }

  if (email === gate.profile.email.toLowerCase()) {
    return { ok: false as const, error: t.selfEmail };
  }

  const existingAdmin = await prisma.adminUser.findUnique({ where: { email } });
  if (existingAdmin?.status === "ACTIVE" && existingAdmin.totpEnabled) {
    return { ok: false as const, error: t.emailTaken };
  }

  const adminUser = await prisma.adminUser.upsert({
    where: { email },
    create: {
      email,
      fullName,
      isMaster: false,
      status: "PENDING_TOTP",
      totpEnabled: false,
      totpSecretEnc: null,
      permissions: { provisionedBy: gate.profile.id }
    },
    update: {
      fullName,
      isMaster: false,
      status: "PENDING_TOTP",
      totpEnabled: false,
      totpSecretEnc: null,
      totpBoundAt: null,
      failedAttempts: 0,
      lockedUntil: null,
      deletedAt: null,
      permissions: { provisionedBy: gate.profile.id }
    }
  });

  const setupToken = createAdminSetupToken(adminUser.id);
  await prisma.adminUser.update({
    where: { id: adminUser.id },
    data: {
      permissions: {
        provisionedBy: gate.profile.id,
        setupTokenHash: hashSetupToken(setupToken)
      }
    }
  });

  const setupPath = buildSetupPath(setupToken);
  const setupUrl = `${input.origin.replace(/\/$/, "")}${setupPath}`;

  const emailResult = await sendAdminSetupLinkEmail({
    toEmail: email,
    setupUrl,
    locale: input.locale,
    masterEmail: gate.profile.email
  });

  if (!emailResult.ok && isProductionRuntime()) {
    return { ok: false as const, error: emailResult.error || t.emailSendFailed };
  }

  await adminAuthAuditRepository.write({
    event: "admin_sensitive_action",
    success: true,
    email: gate.profile.email,
    adminUserId: gate.profile.id,
    ipHash: ctx.ipHash,
    userAgentHash: ctx.userAgentHash,
    metadata: {
      action: "admin_user_provisioned",
      targetEmail: email,
      targetAdminUserId: adminUser.id,
      setupDelivery: emailResult.ok ? "email" : "manual"
    }
  });

  if (emailResult.ok) {
    void notifyAdminSetupLinkSent({
      targetEmail: email,
      masterEmail: gate.profile.email,
      ipHash: ctx.ipHash
    });
  }

  return {
    ok: true as const,
    account: {
      id: adminUser.id,
      email: adminUser.email,
      fullName: adminUser.fullName,
      isMaster: false,
      status: "PENDING_TOTP"
    },
    setupDelivery: emailResult.ok ? ("email" as const) : ("manual" as const),
    ...(emailResult.ok ? {} : { setupPath, setupUrl })
  };
}
