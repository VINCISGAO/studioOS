import { adminStudioRepository } from "@/features/admin/studio/admin-studio.repository";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { getCreatorDepositOverlay } from "@/lib/studioos/deposit-service";
import { CREATOR_DEPOSIT_USD } from "@/lib/studioos/deposit-copy";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { resolveLegacyCreatorIdForProfile } from "@/features/matching/invitation-creator-bridge";

export type AdminStudioListItem = {
  id: string;
  displayName: string;
  email: string | null;
  country: string | null;
  specialties: string[];
  depositAmount: number;
  depositStatus: string;
};

export class AdminStudioService {
  async list(user: AuthUser): Promise<AdminStudioListItem[]> {
    PermissionService.assert(user, "admin.campaign.manage");
    if (!hasDatabaseUrl()) return [];

    const rows = await adminStudioRepository.listStudios();
    const items: AdminStudioListItem[] = [];

    for (const row of rows) {
      const legacyId = await resolveLegacyCreatorIdForProfile(row);
      const overlay = legacyId ? await getCreatorDepositOverlay(legacyId) : null;
      const dna = row.creatorDnaJson as { specialties?: string[] } | null;

      items.push({
        id: row.id,
        displayName: row.displayName,
        email: row.user.email,
        country: row.country ?? row.studio?.country ?? row.user.country ?? null,
        specialties: Array.isArray(dna?.specialties) ? dna.specialties : [],
        depositAmount: overlay?.deposit_amount ?? CREATOR_DEPOSIT_USD,
        depositStatus: overlay?.deposit_status ?? "unpaid"
      });
    }

    return items;
  }
}

export const adminStudioService = new AdminStudioService();
