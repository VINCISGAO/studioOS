import { NextResponse } from "next/server";
import { decryptTotpSecret } from "@/lib/auth/admin-totp-crypto";
import { adminUserRepository } from "@/features/admin/auth/admin-user.repository";
import { assertAuthSecuritySecret, isProductionRuntime } from "@/lib/auth/admin-security-config";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

export const dynamic = "force-dynamic";

/** Read-only ops diagnostic — no secrets or codes returned. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase() ?? "";

  const setup = await adminUserRepository.getLoginSetupStatus();

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
    schemaReady: setup.schemaReady,
    totpConfigured: setup.totpConfigured,
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
