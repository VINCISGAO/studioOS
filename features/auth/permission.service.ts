/**
 * RBAC permission checks — Vol 07 Auth & Permission Engine
 * Pages and API routes must call PermissionService, never inline role checks.
 */
import { appError } from "@/lib/core/errors";

export type Permission =
  | "campaign.create"
  | "campaign.read"
  | "campaign.update"
  | "campaign.delete"
  | "campaign.approve"
  | "review.read"
  | "review.comment"
  | "review.annotation"
  | "review.approve"
  | "review.revision"
  | "asset.upload"
  | "asset.download"
  | "payment.read"
  | "payment.release"
  | "wallet.read"
  | "wallet.withdraw"
  | "creator.accept"
  | "creator.reject"
  | "admin.user.manage"
  | "admin.campaign.manage"
  | "admin.membership.manage"
  | "admin.overview.read"
  | "admin.dispute.manage"
  | "admin.audit.read"
  | "admin.feature_flag.manage"
  | "admin.payment.manage"
  | "admin.settlement.manage"
  | "admin.wallet.manage"
  | "admin.ledger.read"
  | "admin.notification.read"
  | "membership.read"
  | "membership.upgrade";

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  BRAND: [
    "campaign.create",
    "campaign.read",
    "campaign.update",
    "campaign.approve",
    "review.read",
    "review.comment",
    "review.annotation",
    "review.approve",
    "review.revision",
    "asset.upload",
    "payment.read"
  ],
  CREATOR: [
    "campaign.read",
    "review.read",
    "asset.upload",
    "creator.accept",
    "creator.reject",
    "wallet.read",
    "wallet.withdraw",
    "membership.read",
    "membership.upgrade"
  ],
  ADMIN: [
    "campaign.create",
    "campaign.read",
    "campaign.update",
    "campaign.delete",
    "campaign.approve",
    "review.read",
    "review.comment",
    "review.annotation",
    "review.approve",
    "review.revision",
    "asset.upload",
    "asset.download",
    "payment.read",
    "payment.release",
    "wallet.read",
    "wallet.withdraw",
    "admin.user.manage",
    "admin.campaign.manage",
    "admin.membership.manage",
    "admin.overview.read",
    "admin.dispute.manage",
    "admin.audit.read",
    "admin.feature_flag.manage",
    "admin.payment.manage",
    "admin.settlement.manage",
    "admin.wallet.manage",
    "admin.ledger.read",
    "admin.notification.read",
    "membership.read",
    "membership.upgrade"
  ],
  SUPPORT: [
    "campaign.read",
    "review.read",
    "payment.read",
    "admin.audit.read",
    "admin.dispute.manage",
    "admin.ledger.read",
    "admin.notification.read"
  ]
};

export type AuthUser = {
  id: string;
  role: string;
};

export class PermissionService {
  static can(user: AuthUser, permission: Permission): boolean {
    const perms = ROLE_PERMISSIONS[user.role.toUpperCase()] ?? [];
    return perms.includes(permission);
  }

  static assert(user: AuthUser, permission: Permission): void {
    if (!this.can(user, permission)) {
      throw appError("FORBIDDEN", `Missing permission: ${permission}`);
    }
  }

  /** Object-level: brand can only access own campaigns */
  static canAccessCampaign(user: AuthUser, campaign: { brandId: string; creatorId?: string | null }): boolean {
    if (user.role.toUpperCase() === "ADMIN") return true;
    if (user.role.toUpperCase() === "BRAND" && campaign.brandId === user.id) return true;
    if (user.role.toUpperCase() === "CREATOR" && campaign.creatorId === user.id) return true;
    return false;
  }

  /** Export RBAC matrix for admin docs and verification */
  static exportMatrix(): { role: string; permissions: Permission[] }[] {
    return Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => ({
      role,
      permissions: [...permissions]
    }));
  }
}
