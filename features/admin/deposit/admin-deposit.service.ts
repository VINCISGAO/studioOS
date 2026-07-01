import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { adminStudioRepository } from "@/features/admin/studio/admin-studio.repository";
import { resolveLegacyCreatorIdForProfile } from "@/features/matching/invitation-creator-bridge";
import { listAdminDepositRows } from "@/lib/studioos/deposit-service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

export type AdminDepositListItem = {
  id: string;
  creatorProfileId: string | null;
  creatorName: string;
  creatorEmail: string | null;
  amount: number;
  status: string;
  reason: string | null;
  refundableAfter: string | null;
};

export class AdminDepositService {
  async list(user: AuthUser): Promise<AdminDepositListItem[]> {
    PermissionService.assert(user, "admin.wallet.manage");
    if (!hasDatabaseUrl()) return [];

    const [rows, creators] = await Promise.all([
      listAdminDepositRows(),
      adminStudioRepository.listStudios()
    ]);

    const profileByLegacyId = new Map<string, (typeof creators)[number]>();
    for (const creator of creators) {
      const legacyId = await resolveLegacyCreatorIdForProfile(creator);
      if (legacyId) profileByLegacyId.set(legacyId, creator);
    }

    return rows.map((row) => {
      const profile =
        profileByLegacyId.get(row.legacyCreatorId) ??
        creators.find((item) => item.id === row.creatorProfileId) ??
        null;

      return {
        id: row.id,
        creatorProfileId: profile?.id ?? row.creatorProfileId,
        creatorName: profile?.displayName ?? row.legacyCreatorId,
        creatorEmail: profile?.user.email ?? null,
        amount: row.amount,
        status: row.status,
        reason: row.reason,
        refundableAfter: row.refundableAfter
      };
    });
  }

  async getSummary(user: AuthUser) {
    const items = await this.list(user);
    return {
      totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
      refundRequestedCount: items.filter((item) => item.status === "refund_requested").length,
      studioCount: new Set(items.map((item) => item.creatorProfileId ?? item.creatorName)).size
    };
  }
}

export const adminDepositService = new AdminDepositService();
