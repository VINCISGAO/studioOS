import "server-only";

import type { AdminAccountStatus, AdminProfile, User } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { isPrismaMissingTableError } from "@/lib/core/prisma-errors";
import { isPrismaAdminRole } from "@/lib/auth/route-access";

export type AdminProfileWithUser = AdminProfile & { user: User };

export type AdminLoginSetupStatus = {
  schemaReady: boolean;
  totpConfigured: boolean;
};

export class AdminProfileRepository {
  async getLoginSetupStatus(): Promise<AdminLoginSetupStatus> {
    if (!hasDatabaseUrl()) {
      return { schemaReady: false, totpConfigured: false };
    }

    try {
      const count = await prisma.adminProfile.count({
        where: { status: "ACTIVE", totpEnabled: true }
      });
      return { schemaReady: true, totpConfigured: count > 0 };
    } catch (error) {
      if (isPrismaMissingTableError(error)) {
        return { schemaReady: false, totpConfigured: false };
      }
      throw error;
    }
  }

  async hasActiveTotpAdmin() {
    const status = await this.getLoginSetupStatus();
    return status.schemaReady && status.totpConfigured;
  }

  async findLoginCandidateByEmail(email: string): Promise<AdminProfileWithUser | null> {
    if (!hasDatabaseUrl()) return null;

    const normalized = email.trim().toLowerCase();
    try {
      const row = await prisma.adminProfile.findFirst({
        where: {
          user: {
            email: normalized,
            deletedAt: null,
            role: { in: ["ADMIN", "SUPPORT", "SYSTEM"] }
          }
        },
        include: { user: true }
      });

      if (!row || !isPrismaAdminRole(row.user.role)) {
        return null;
      }

      return row;
    } catch (error) {
      if (isPrismaMissingTableError(error)) {
        return null;
      }
      throw error;
    }
  }

  async isMasterLoginEmail(email: string): Promise<boolean> {
    if (!hasDatabaseUrl()) return false;

    const normalized = email.trim().toLowerCase();
    try {
      const row = await prisma.adminProfile.findFirst({
        where: {
          isMaster: true,
          user: { email: normalized, deletedAt: null }
        },
        select: { id: true }
      });
      return Boolean(row);
    } catch (error) {
      if (isPrismaMissingTableError(error)) return false;
      throw error;
    }
  }

  async recordFailedLogin(profileId: string, failedAttempts: number, lockedUntil: Date | null, status?: AdminAccountStatus) {
    await prisma.adminProfile.update({
      where: { id: profileId },
      data: {
        failedAttempts,
        lockedUntil,
        ...(status ? { status } : {})
      }
    });
  }

  async recordSuccessfulLogin(profileId: string) {
    await prisma.adminProfile.update({
      where: { id: profileId },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastVerifiedAt: new Date()
      }
    });
  }

  async bindTotpSecret(profileId: string, totpSecretEnc: string) {
    await prisma.adminProfile.update({
      where: { id: profileId },
      data: {
        totpSecretEnc,
        totpEnabled: true,
        totpBoundAt: new Date(),
        status: "ACTIVE"
      }
    });
  }

  async findByUserId(userId: string): Promise<AdminProfileWithUser | null> {
    if (!hasDatabaseUrl()) return null;
    return prisma.adminProfile.findUnique({
      where: { userId },
      include: { user: true }
    });
  }

  async findPendingSetupByEmail(email: string): Promise<AdminProfileWithUser | null> {
    if (!hasDatabaseUrl()) return null;
    const normalized = email.trim().toLowerCase();
    try {
      return prisma.adminProfile.findFirst({
        where: {
          status: "PENDING_TOTP",
          user: { email: normalized, deletedAt: null }
        },
        include: { user: true }
      });
    } catch (error) {
      if (isPrismaMissingTableError(error)) return null;
      throw error;
    }
  }

  async listActiveAccounts(): Promise<AdminProfileWithUser[]> {
    if (!hasDatabaseUrl()) return [];
    return prisma.adminProfile.findMany({
      where: { status: { in: ["ACTIVE", "PENDING_TOTP", "LOCKED"] } },
      include: { user: true },
      orderBy: [{ isMaster: "desc" }, { createdAt: "asc" }]
    });
  }

  async demoteNonMasterAccounts() {
    await prisma.adminProfile.updateMany({
      where: { isMaster: false },
      data: { status: "SUSPENDED", totpEnabled: false }
    });
  }
}

export const adminProfileRepository = new AdminProfileRepository();
