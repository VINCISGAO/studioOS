import { adminRepository } from "@/features/admin/admin.repository";
import { adminRefundService } from "@/features/admin/refund/admin-refund.service";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

export class AdminSupportService {
  async getOverview(user: AuthUser) {
    PermissionService.assert(user, "admin.dispute.manage");
    if (!hasDatabaseUrl()) {
      return { openDisputes: 0, openRefunds: 0, openItems: 0 };
    }

    const [openDisputes, refunds] = await Promise.all([
      adminRepository.countOpenDisputes(),
      adminRefundService.list(user)
    ]);

    const openRefunds = refunds.filter((item) => item.status === "under_review").length;
    return {
      openDisputes,
      openRefunds,
      openItems: openDisputes + openRefunds
    };
  }
}

export const adminSupportService = new AdminSupportService();
