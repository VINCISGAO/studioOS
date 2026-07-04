import "server-only";

import { randomBytes } from "node:crypto";
import { adminAuthAuditRepository } from "@/features/admin/auth/admin-auth-audit.repository";
import { adminRequestContext } from "@/lib/auth/admin-request-context";
import { buildAdminTotpOtpAuthUri } from "@/lib/auth/admin-totp";
import { encryptTotpSecret, decryptTotpSecret } from "@/lib/auth/admin-totp-crypto";
import { verifyAndConsumeAdminTotp } from "@/features/admin/auth/admin-totp-replay.service";
import { hashSetupToken, verifyAdminSetupToken } from "@/lib/auth/admin-setup-token";
import { prisma } from "@/lib/core/database/prisma";
import type { Prisma } from "@prisma/client";
import type { Locale } from "@/lib/i18n";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function toBase32(bytes: Buffer) {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
}

type AdminProfilePermissions = Record<string, unknown>;

function readPermissions(raw: unknown): AdminProfilePermissions {
  return raw && typeof raw === "object" ? (raw as AdminProfilePermissions) : {};
}

async function loadPendingProfile(token: string) {
  const parsed = verifyAdminSetupToken(token);
  if (!parsed) return null;

  const profile = await prisma.adminProfile.findUnique({
    where: { id: parsed.adminProfileId },
    include: { user: true }
  });

  if (!profile || profile.status !== "PENDING_TOTP" || profile.totpEnabled) return null;

  const permissions = readPermissions(profile.permissions);
  if (permissions.setupTokenHash !== hashSetupToken(token)) return null;

  return { profile, permissions };
}

async function claimSetupDeviceBinding(
  profileId: string,
  ctx: ReturnType<typeof adminRequestContext>
): Promise<
  | { ok: false; error: "invalid_or_expired" | "device_mismatch" }
  | { ok: true; permissions: AdminProfilePermissions }
> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ permissions: Prisma.JsonValue }>>`
      SELECT permissions FROM admin_profiles WHERE id = ${profileId} FOR UPDATE
    `;
    const row = rows[0];
    if (!row) return { ok: false as const, error: "invalid_or_expired" as const };

    const permissions = readPermissions(row.permissions);
    const bindIpHash = typeof permissions.setupBindIpHash === "string" ? permissions.setupBindIpHash : null;
    const bindUserAgentHash =
      typeof permissions.setupBindUserAgentHash === "string" ? permissions.setupBindUserAgentHash : null;

    if (bindIpHash && bindUserAgentHash) {
      if (bindIpHash !== ctx.ipHash || bindUserAgentHash !== ctx.userAgentHash) {
        return { ok: false as const, error: "device_mismatch" as const };
      }
      return { ok: true as const, permissions };
    }

    const nextPermissions = {
      ...permissions,
      setupBindIpHash: ctx.ipHash,
      setupBindUserAgentHash: ctx.userAgentHash
    };

    await tx.adminProfile.update({
      where: { id: profileId },
      data: { permissions: nextPermissions as Prisma.InputJsonValue }
    });

    return { ok: true as const, permissions: nextPermissions };
  });
}

export async function getAdminSetupTotpChallenge(token: string, request: Request) {
  const loaded = await loadPendingProfile(token);
  if (!loaded) return { ok: false as const, error: "invalid_or_expired" as const };

  const ctx = adminRequestContext(request);
  const { profile } = loaded;
  const claim = await claimSetupDeviceBinding(profile.id, ctx);
  if (!claim.ok) return claim;

  const boundPermissions = claim.permissions;
  const secretAlreadyIssued = Boolean(boundPermissions.setupSecretIssuedAt);

  if (secretAlreadyIssued) {
    return {
      ok: true as const,
      email: profile.user.email,
      secretAlreadyIssued: true as const
    };
  }

  let pendingSecretEnc =
    typeof boundPermissions.pendingSecretEnc === "string" ? boundPermissions.pendingSecretEnc : null;

  if (!pendingSecretEnc) {
    const secret = toBase32(randomBytes(20));
    pendingSecretEnc = encryptTotpSecret(secret);
  }

  const secret = decryptTotpSecret(pendingSecretEnc);
  const issuedAt = new Date().toISOString();

  await prisma.adminProfile.update({
    where: { id: profile.id },
    data: {
      permissions: {
        ...boundPermissions,
        pendingSecretEnc,
        setupSecretIssuedAt: issuedAt
      } as Prisma.InputJsonValue
    }
  });

  return {
    ok: true as const,
    email: profile.user.email,
    secretAlreadyIssued: false as const,
    otpauthUri: buildAdminTotpOtpAuthUri(profile.user.email, secret)
  };
}

export async function completeAdminSetupTotp(input: {
  request: Request;
  token: string;
  code: string;
  locale: Locale;
}) {
  const loaded = await loadPendingProfile(input.token);
  if (!loaded) {
    return { ok: false as const, error: "invalid_or_expired" as const };
  }

  const ctx = adminRequestContext(input.request);
  const { profile } = loaded;
  const claim = await claimSetupDeviceBinding(profile.id, ctx);
  if (!claim.ok) return claim;

  const boundPermissions = claim.permissions;
  const pendingSecretEnc =
    typeof boundPermissions.pendingSecretEnc === "string" ? boundPermissions.pendingSecretEnc : null;
  if (!pendingSecretEnc) {
    return { ok: false as const, error: "open_setup_page_first" as const };
  }

  let secret: string;
  try {
    secret = decryptTotpSecret(pendingSecretEnc);
  } catch {
    return { ok: false as const, error: "setup_state_invalid" as const };
  }

  const valid = await verifyAndConsumeAdminTotp({
    adminProfileId: profile.id,
    secret,
    code: input.code,
    purpose: "setup"
  });
  if (!valid) {
    void adminAuthAuditRepository.write({
      event: "admin_setup_totp_failed",
      success: false,
      email: profile.user.email,
      adminId: profile.user.id,
      adminProfileId: profile.id,
      ipHash: ctx.ipHash,
      userAgentHash: ctx.userAgentHash,
      failureReason: "invalid_totp"
    });
    return { ok: false as const, error: "invalid_totp" as const };
  }

  const {
    setupTokenHash: _a,
    pendingSecretEnc: _b,
    setupSecretIssuedAt: _c,
    setupBindIpHash: _d,
    setupBindUserAgentHash: _e,
    ...restPermissions
  } = boundPermissions;

  await prisma.adminProfile.update({
    where: { id: profile.id },
    data: {
      status: "ACTIVE",
      totpSecretEnc: pendingSecretEnc,
      totpEnabled: true,
      totpBoundAt: new Date(),
      permissions: restPermissions as Prisma.InputJsonValue
    }
  });

  await adminAuthAuditRepository.write({
    event: "admin_sensitive_action",
    success: true,
    email: profile.user.email,
    adminId: profile.user.id,
    adminProfileId: profile.id,
    ipHash: ctx.ipHash,
    userAgentHash: ctx.userAgentHash,
    metadata: { action: "admin_totp_bound" }
  });

  return { ok: true as const, email: profile.user.email };
}
