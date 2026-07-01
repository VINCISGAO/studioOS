import { adminOrderRepository, ADMIN_ORDER_STATUSES } from "@/features/admin/order/admin-order.repository";
import { adminStudioRepository } from "@/features/admin/studio/admin-studio.repository";
import { resolveLegacyCreatorIdForProfile } from "@/features/matching/invitation-creator-bridge";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";

export type AdminOrderCreatorOption = {
  id: string;
  legacyCreatorId: string;
  name: string;
  country: string | null;
  email: string | null;
};

export class AdminOrderService {
  orderStatuses = ADMIN_ORDER_STATUSES;

  async getDetail(user: AuthUser, orderId: string) {
    PermissionService.assert(user, "admin.payment.manage");
    const detail = await adminOrderRepository.getOrderDetail(orderId);
    if (!detail) throw appError("NOT_FOUND", "Order not found");
    return detail;
  }

  async listCreatorsForAssignment(user: AuthUser): Promise<AdminOrderCreatorOption[]> {
    PermissionService.assert(user, "admin.payment.manage");
    const rows = await adminStudioRepository.listStudios();
    const items: AdminOrderCreatorOption[] = [];

    for (const row of rows) {
      const legacyCreatorId = await resolveLegacyCreatorIdForProfile(row);
      if (!legacyCreatorId) continue;
      items.push({
        id: row.id,
        legacyCreatorId,
        name: row.displayName,
        country: row.country,
        email: row.user.email
      });
    }

    return items;
  }
}

export const adminOrderService = new AdminOrderService();
