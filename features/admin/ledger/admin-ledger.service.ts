import { adminLedgerRepository } from "@/features/admin/ledger/admin-ledger.repository";
import type { AdminLedgerFilters } from "@/features/admin/ledger/admin-ledger.repository";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

export type AdminLedgerEntryView = {
  id: string;
  userId: string;
  userEmail: string | null;
  campaignId: string | null;
  campaignTitle: string | null;
  entryType: string;
  direction: string;
  amount: number;
  assetCode: string;
  description: string | null;
  referenceId: string | null;
  createdAt: string;
};

export class AdminLedgerService {
  async list(user: AuthUser, filters: AdminLedgerFilters) {
    PermissionService.assert(user, "admin.ledger.read");
    if (!hasDatabaseUrl()) return { items: [], total: 0 };

    const { rows, total } = await adminLedgerRepository.list(filters);
    const items: AdminLedgerEntryView[] = rows.map((row) => ({
      id: row.id,
      userId: row.walletAccount.userId,
      userEmail: row.walletAccount.user.email,
      campaignId: row.campaignId,
      campaignTitle: row.campaign?.title ?? null,
      entryType: row.entryType,
      direction: row.direction,
      amount: Number(row.amount),
      assetCode: row.assetCode,
      description: row.description,
      referenceId: row.referenceId,
      createdAt: row.createdAt.toISOString()
    }));

    return { items, total };
  }

  toCsv(items: AdminLedgerEntryView[]) {
    const header = ["id", "userId", "userEmail", "campaignId", "entryType", "direction", "amount", "assetCode", "description", "referenceId", "createdAt"];
    const lines = items.map((row) =>
      [
        row.id,
        row.userId,
        row.userEmail ?? "",
        row.campaignId ?? "",
        row.entryType,
        row.direction,
        row.amount,
        row.assetCode,
        `"${(row.description ?? "").replace(/"/g, '""')}"`,
        row.referenceId ?? "",
        row.createdAt
      ].join(",")
    );
    return [header.join(","), ...lines].join("\n");
  }
}

export const adminLedgerService = new AdminLedgerService();
