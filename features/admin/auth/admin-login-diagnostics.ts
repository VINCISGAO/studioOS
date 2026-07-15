import "server-only";

import { decryptTotpSecret } from "@/lib/auth/admin-totp-crypto";
import { adminUserRepository } from "@/features/admin/auth/admin-user.repository";
import { assertAuthSecuritySecret, isProductionRuntime } from "@/lib/auth/admin-security-config";
import { resolveDatabaseHostForDiagnostics } from "@/lib/core/database/database-url-diagnostics";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

export type AdminLoginDevDiagnostics = {
  databaseHost: string;
  totalAdminUsers: number;
  activeTotpAdminUsers: number;
  authSecretOk: boolean;
  emailHint?: {
    userFound: boolean;
    totpDecryptOk: boolean;
    status?: string;
    lockedUntil?: string | null;
  };
};

/** Dev-only panel data for /admin/login — never shown in production runtime. */
export async function getAdminLoginDevDiagnostics(
  email?: string
): Promise<AdminLoginDevDiagnostics | null> {
  if (isProductionRuntime()) return null;

  const setup = await adminUserRepository.getLoginSetupStatus();

  let totalAdminUsers = 0;
  let activeTotpAdminUsers = 0;
  if (hasDatabaseUrl()) {
    try {
      totalAdminUsers = await prisma.adminUser.count({ where: { deletedAt: null } });
      activeTotpAdminUsers = await prisma.adminUser.count({
        where: { deletedAt: null, status: "ACTIVE", totpEnabled: true }
      });
    } catch {
      totalAdminUsers = -1;
      activeTotpAdminUsers = -1;
    }
  }

  let authSecretOk = false;
  try {
    assertAuthSecuritySecret();
    authSecretOk = true;
  } catch {
    authSecretOk = false;
  }

  const base: AdminLoginDevDiagnostics = {
    databaseHost: resolveDatabaseHostForDiagnostics(),
    totalAdminUsers,
    activeTotpAdminUsers,
    authSecretOk
  };

  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return base;

  const profile = await adminUserRepository.findLoginCandidateByEmail(normalizedEmail);
  if (!profile) {
    return { ...base, emailHint: { userFound: false, totpDecryptOk: false } };
  }

  let totpDecryptOk = false;
  if (profile.totpSecretEnc) {
    try {
      decryptTotpSecret(profile.totpSecretEnc);
      totpDecryptOk = true;
    } catch {
      totpDecryptOk = false;
    }
  }

  return {
    ...base,
    emailHint: {
      userFound: true,
      totpDecryptOk,
      status: profile.status,
      lockedUntil: profile.lockedUntil?.toISOString() ?? null
    }
  };
}
