import "server-only";

import { randomBytes, createHash } from "node:crypto";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { isStrictAdminSessionBinding } from "@/lib/auth/admin-security-config";
import { ADMIN_SESSION_MAX_AGE_SEC } from "@/lib/auth-config";
import type { AdminProfileWithUser } from "@/features/admin/auth/admin-profile.repository";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export class AdminSessionRepository {
  async createSession(input: {
    adminProfileId: string;
    ipHash: string;
    userAgentHash: string;
    deviceLabel?: string;
  }) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE_SEC * 1000);
    const now = new Date();

    await prisma.adminSession.create({
      data: {
        adminProfileId: input.adminProfileId,
        tokenHash: hashToken(token),
        ipHash: input.ipHash,
        userAgentHash: input.userAgentHash,
        deviceLabel: input.deviceLabel ?? null,
        lastActiveAt: now,
        expiresAt
      }
    });

    return { token, expiresAt };
  }

  async findValidSession(input: {
    token: string;
    ipHash: string;
    userAgentHash: string;
  }): Promise<AdminProfileWithUser | null> {
    if (!hasDatabaseUrl()) return null;

    const strict = isStrictAdminSessionBinding();
    const row = await prisma.adminSession.findFirst({
      where: {
        tokenHash: hashToken(input.token),
        revokedAt: null,
        expiresAt: { gt: new Date() },
        ...(strict ? { ipHash: input.ipHash, userAgentHash: input.userAgentHash } : {})
      },
      include: {
        adminProfile: {
          include: { user: true }
        }
      }
    });

    if (!row?.adminProfile?.user || row.adminProfile.user.deletedAt) {
      return null;
    }

    return row.adminProfile;
  }

  async revokeByToken(token: string) {
    await prisma.adminSession.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  async revokeAllForProfile(adminProfileId: string) {
    await prisma.adminSession.updateMany({
      where: { adminProfileId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
}

export const adminSessionRepository = new AdminSessionRepository();
