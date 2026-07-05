import "server-only";

import type { AdminAccountStatus, AdminUser } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { isPrismaMissingTableError } from "@/lib/core/prisma-errors";

export type { AdminUser };

export type AdminLoginSetupStatus = {
  schemaReady: boolean;
  totpConfigured: boolean;
};

export class AdminUserRepository {
  async getLoginSetupStatus(): Promise<AdminLoginSetupStatus> {
    if (!hasDatabaseUrl()) {
      return { schemaReady: false, totpConfigured: false };
    }

    try {
      const count = await prisma.adminUser.count({
        where: { status: "ACTIVE", totpEnabled: true, deletedAt: null }
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

  async findLoginCandidateByEmail(email: string): Promise<AdminUser | null> {
    if (!hasDatabaseUrl()) return null;

    const normalized = email.trim().toLowerCase();
    try {
      return prisma.adminUser.findFirst({
        where: { email: normalized, deletedAt: null }
      });
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
      const row = await prisma.adminUser.findFirst({
        where: { email: normalized, isMaster: true, deletedAt: null },
        select: { id: true }
      });
      return Boolean(row);
    } catch (error) {
      if (isPrismaMissingTableError(error)) return false;
      throw error;
    }
  }

  async recordFailedLogin(userId: string, failedAttempts: number, lockedUntil: Date | null, status?: AdminAccountStatus) {
    await prisma.adminUser.update({
      where: { id: userId },
      data: {
        failedAttempts,
        lockedUntil,
        ...(status ? { status } : {})
      }
    });
  }

  async recordSuccessfulLogin(userId: string) {
    await prisma.adminUser.update({
      where: { id: userId },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastVerifiedAt: new Date()
      }
    });
  }

  async bindTotpSecret(userId: string, totpSecretEnc: string) {
    await prisma.adminUser.update({
      where: { id: userId },
      data: {
        totpSecretEnc,
        totpEnabled: true,
        totpBoundAt: new Date(),
        status: "ACTIVE"
      }
    });
  }

  async findById(id: string): Promise<AdminUser | null> {
    if (!hasDatabaseUrl()) return null;
    return prisma.adminUser.findFirst({ where: { id, deletedAt: null } });
  }

  async findPendingSetupByEmail(email: string): Promise<AdminUser | null> {
    if (!hasDatabaseUrl()) return null;
    const normalized = email.trim().toLowerCase();
    try {
      return prisma.adminUser.findFirst({
        where: { email: normalized, status: "PENDING_TOTP", deletedAt: null }
      });
    } catch (error) {
      if (isPrismaMissingTableError(error)) return null;
      throw error;
    }
  }

  async listActiveAccounts(): Promise<AdminUser[]> {
    if (!hasDatabaseUrl()) return [];
    return prisma.adminUser.findMany({
      where: {
        deletedAt: null,
        status: { in: ["ACTIVE", "PENDING_TOTP", "LOCKED"] }
      },
      orderBy: [{ isMaster: "desc" }, { createdAt: "asc" }]
    });
  }

  async demoteNonMasterAccounts() {
    await prisma.adminUser.updateMany({
      where: { isMaster: false },
      data: { status: "SUSPENDED", totpEnabled: false }
    });
  }
}

export const adminUserRepository = new AdminUserRepository();

/** @deprecated Admin is not a User — use AdminUser */
export type AdminProfileWithUser = AdminUser;

/** @deprecated use adminUserRepository */
export const adminProfileRepository = adminUserRepository;
