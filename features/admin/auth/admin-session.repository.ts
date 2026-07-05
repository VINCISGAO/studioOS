import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { ADMIN_SESSION_MAX_AGE_SEC } from "@/lib/auth-config";
import { isStrictAdminSessionBinding } from "@/lib/auth/admin-security-config";
import type { AdminUser } from "@/features/admin/auth/admin-user.repository";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export class AdminSessionRepository {
  async createSession(input: {
    adminUserId: string;
    ipHash: string;
    userAgentHash: string;
    deviceLabel?: string;
  }) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE_SEC * 1000);
    const now = new Date();

    await prisma.adminSession.create({
      data: {
        adminUserId: input.adminUserId,
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
  }): Promise<AdminUser | null> {
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
        adminUser: true
      }
    });

    if (!row?.adminUser || row.adminUser.deletedAt) {
      return null;
    }

    return row.adminUser;
  }

  async revokeByToken(token: string) {
    await prisma.adminSession.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  async revokeAllForUser(adminUserId: string) {
    await prisma.adminSession.updateMany({
      where: { adminUserId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  /** @deprecated use revokeAllForUser */
  async revokeAllForProfile(adminUserId: string) {
    return this.revokeAllForUser(adminUserId);
  }
}

export const adminSessionRepository = new AdminSessionRepository();
