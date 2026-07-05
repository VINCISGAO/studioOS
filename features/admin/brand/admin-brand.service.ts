import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

export type AdminBrandListItem = {
  id: string;
  userId: string;
  companyName: string;
  email: string;
  industry: string | null;
  status: string;
  campaignCount: number;
  createdAt: string;
  lastLoginAt: string | null;
};

export class AdminBrandService {
  async list(user: AuthUser): Promise<AdminBrandListItem[]> {
    PermissionService.assert(user, "admin.user.manage");
    if (!hasDatabaseUrl()) return [];

    const rows = await prisma.brandProfile.findMany({
      where: { user: { deletedAt: null } },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            createdAt: true,
            lastLoginAt: true,
            _count: { select: { brandCampaigns: true } }
          }
        }
      }
    });

    return rows.map((row) => ({
      id: row.id,
      userId: row.user.id,
      companyName: row.companyName,
      email: row.user.email,
      industry: row.industry,
      status: row.user.status,
      campaignCount: row.user._count.brandCampaigns,
      createdAt: row.createdAt.toISOString(),
      lastLoginAt: row.user.lastLoginAt?.toISOString() ?? null
    }));
  }
}

export const adminBrandService = new AdminBrandService();
