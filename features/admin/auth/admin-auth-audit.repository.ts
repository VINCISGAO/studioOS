import "server-only";

import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { hashAdminSensitive } from "@/lib/auth/admin-request-context";
import { asInputJson } from "@/lib/core/prisma-json";
import { isPrismaMissingTableError } from "@/lib/core/prisma-errors";
import { logger } from "@/lib/core/logger";

export type AdminAuthAuditEvent =
  | "admin_login_attempt"
  | "admin_login_success"
  | "admin_login_failed"
  | "admin_totp_failed"
  | "admin_login_rate_limited"
  | "admin_setup_totp_failed"
  | "admin_locked"
  | "admin_logout"
  | "admin_sensitive_action"
  | "admin_session_expired";

const LOGIN_ATTEMPT_EVENTS: AdminAuthAuditEvent[] = [
  "admin_login_attempt",
  "admin_login_failed",
  "admin_totp_failed",
  "admin_login_rate_limited"
];

const FAILED_LOGIN_EVENTS: AdminAuthAuditEvent[] = [
  "admin_login_failed",
  "admin_totp_failed",
  "admin_setup_totp_failed"
];

export class AdminAuthAuditRepository {
  async write(input: {
    event: AdminAuthAuditEvent;
    success: boolean;
    email?: string;
    adminUserId?: string;
    ipHash: string;
    userAgentHash: string;
    failureReason?: string;
    metadata?: Record<string, unknown>;
  }) {
    if (!hasDatabaseUrl()) return;

    try {
      await prisma.adminAuthAuditLog.create({
        data: {
          event: input.event,
          success: input.success,
          adminUserId: input.adminUserId,
          emailHash: hashAdminSensitive((input.email ?? "unknown").trim().toLowerCase()),
          ipHash: input.ipHash,
          userAgentHash: input.userAgentHash,
          failureReason: input.failureReason,
          metadata: asInputJson(input.metadata)
        }
      });
    } catch (error) {
      if (isPrismaMissingTableError(error)) {
        logger.warn("admin auth audit skipped — tables not migrated", {
          service: "admin-auth-audit",
          event: input.event
        });
        return;
      }
      throw error;
    }
  }

  async countRecentLoginAttempts(input: { ipHash?: string; email?: string; since: Date }) {
    if (!hasDatabaseUrl()) return 0;

    const emailHash = input.email ? hashAdminSensitive(input.email.trim().toLowerCase()) : undefined;

    try {
      return prisma.adminAuthAuditLog.count({
        where: {
          event: { in: LOGIN_ATTEMPT_EVENTS },
          createdAt: { gte: input.since },
          ...(input.ipHash ? { ipHash: input.ipHash } : {}),
          ...(emailHash ? { emailHash } : {})
        }
      });
    } catch (error) {
      if (isPrismaMissingTableError(error)) {
        return 0;
      }
      throw error;
    }
  }

  async countRecentFailedLogins(input: { ipHash?: string; email?: string; since: Date }) {
    if (!hasDatabaseUrl()) return 0;

    const emailHash = input.email ? hashAdminSensitive(input.email.trim().toLowerCase()) : undefined;

    try {
      return prisma.adminAuthAuditLog.count({
        where: {
          event: { in: FAILED_LOGIN_EVENTS },
          success: false,
          createdAt: { gte: input.since },
          ...(input.ipHash ? { ipHash: input.ipHash } : {}),
          ...(emailHash ? { emailHash } : {})
        }
      });
    } catch (error) {
      if (isPrismaMissingTableError(error)) {
        return 0;
      }
      throw error;
    }
  }

  async countRecentFailuresForUser(input: { adminUserId: string; ipHash: string; since: Date }) {
    if (!hasDatabaseUrl()) return 0;

    try {
      return prisma.adminAuthAuditLog.count({
        where: {
          adminUserId: input.adminUserId,
          ipHash: input.ipHash,
          event: { in: ["admin_totp_failed", "admin_login_failed"] },
          success: false,
          createdAt: { gte: input.since }
        }
      });
    } catch (error) {
      if (isPrismaMissingTableError(error)) {
        return 0;
      }
      throw error;
    }
  }

  /** @deprecated use countRecentFailuresForUser */
  async countRecentFailuresForProfile(input: { adminProfileId: string; ipHash: string; since: Date }) {
    return this.countRecentFailuresForUser({
      adminUserId: input.adminProfileId,
      ipHash: input.ipHash,
      since: input.since
    });
  }

  async countRecentSetupFailures(input: { ipHash: string; since: Date }) {
    if (!hasDatabaseUrl()) return 0;

    try {
      return prisma.adminAuthAuditLog.count({
        where: {
          event: "admin_setup_totp_failed",
          success: false,
          ipHash: input.ipHash,
          createdAt: { gte: input.since }
        }
      });
    } catch (error) {
      if (isPrismaMissingTableError(error)) return 0;
      throw error;
    }
  }
}

export const adminAuthAuditRepository = new AdminAuthAuditRepository();
