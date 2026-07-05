import "server-only";

import { createHash } from "node:crypto";
import type { AdminUser } from "@/features/admin/auth/admin-user.repository";
import { verifyAndConsumeAdminTotp } from "@/features/admin/auth/admin-totp-replay.service";
import { decryptTotpSecret } from "@/lib/auth/admin-totp-crypto";
import { prisma } from "@/lib/core/database/prisma";
import { appError } from "@/lib/core/errors";

const PASSKEY_STEP_UP_TTL_MS = 10 * 60 * 1000;

function readPermissions(raw: unknown) {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function recordPasskeyStepUp(adminUserId: string, sessionToken: string) {
  const profile = await prisma.adminUser.findUnique({ where: { id: adminUserId } });
  if (!profile) return;

  const permissions = readPermissions(profile.permissions);
  await prisma.adminUser.update({
    where: { id: adminUserId },
    data: {
      permissions: {
        ...permissions,
        passkeyStepUpAt: new Date().toISOString(),
        passkeyStepUpSessionHash: hashSessionToken(sessionToken)
      }
    }
  });
}

export function hasValidPasskeyStepUp(profile: AdminUser, sessionToken: string | null) {
  if (!sessionToken) return false;

  const permissions = readPermissions(profile.permissions);
  const stepUpAt =
    typeof permissions.passkeyStepUpAt === "string" ? permissions.passkeyStepUpAt : null;
  const stepUpSessionHash =
    typeof permissions.passkeyStepUpSessionHash === "string"
      ? permissions.passkeyStepUpSessionHash
      : null;

  if (!stepUpAt || !stepUpSessionHash) return false;
  if (Date.now() - new Date(stepUpAt).getTime() > PASSKEY_STEP_UP_TTL_MS) return false;
  return stepUpSessionHash === hashSessionToken(sessionToken);
}

export async function unlockPasskeyStepUp(input: {
  profile: AdminUser;
  sessionToken: string;
  totpCode: string;
}): Promise<{ ok: true } | { ok: false; error: "invalid_totp" }> {
  const code = input.totpCode.trim();
  if (!code || !input.profile.totpSecretEnc) {
    return { ok: false, error: "invalid_totp" };
  }

  let secret: string;
  try {
    secret = decryptTotpSecret(input.profile.totpSecretEnc);
  } catch {
    return { ok: false, error: "invalid_totp" };
  }

  const valid = await verifyAndConsumeAdminTotp({
    adminUserId: input.profile.id,
    secret,
    code,
    purpose: "step_up"
  });
  if (!valid) {
    return { ok: false, error: "invalid_totp" };
  }

  await recordPasskeyStepUp(input.profile.id, input.sessionToken);
  return { ok: true };
}

export function assertPasskeyStepUp(profile: AdminUser, sessionToken: string | null) {
  if (!hasValidPasskeyStepUp(profile, sessionToken)) {
    throw appError("FORBIDDEN", "Passkey step-up required");
  }
}
