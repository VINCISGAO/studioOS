import { NextResponse } from "next/server";
import { decryptTotpSecret } from "@/lib/auth/admin-totp-crypto";
import { adminUserRepository } from "@/features/admin/auth/admin-user.repository";
import { assertAuthSecuritySecret, isProductionRuntime } from "@/lib/auth/admin-security-config";
import { resolveDatabaseHostForDiagnostics } from "@/lib/core/database/database-url-diagnostics";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

export const dynamic = "force-dynamic";

/** Read-only ops diagnostic — no secrets or codes returned. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase() ?? "";

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

  const base = {
    production: isProductionRuntime(),
    database: hasDatabaseUrl(),
    databaseHost: resolveDatabaseHostForDiagnostics(),
    schemaReady: setup.schemaReady,
    totpConfigured: setup.totpConfigured,
    totalAdminUsers,
    activeTotpAdminUsers,
    authSecretOk
  };

  if (!email) {
    return NextResponse.json(base);
  }

  const profile = await adminUserRepository.findLoginCandidateByEmail(email);
  if (!profile) {
    return NextResponse.json({
      ...base,
      email,
      userFound: false
    });
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

  return NextResponse.json({
    ...base,
    email,
    userFound: true,
    status: profile.status,
    totpEnabled: profile.totpEnabled,
    isMaster: profile.isMaster,
    totpDecryptOk,
    lockedUntil: profile.lockedUntil?.toISOString() ?? null,
    failedAttempts: profile.failedAttempts
  });
}
