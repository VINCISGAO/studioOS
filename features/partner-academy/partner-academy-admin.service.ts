import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { prisma } from "@/lib/core/database/prisma";

function money(value: unknown) {
  return Number(value ?? 0);
}

export class PartnerAcademyAdminService {
  private assertAdminRead(actor: AuthUser) {
    PermissionService.assert(actor, "admin.overview.read");
  }

  async getPartnerDashboard(actor: AuthUser) {
    this.assertAdminRead(actor);
    const [partners, byStatus, byTier] = await Promise.all([
      prisma.partnerProgram.findMany({
        orderBy: [{ status: "asc" }, { attributedRevenue: "desc" }, { updatedAt: "desc" }],
        take: 50
      }),
      prisma.partnerProgram.groupBy({
        by: ["status"],
        _count: { _all: true },
        _sum: {
          attributedRevenue: true,
          pendingCommission: true,
          paidCommission: true
        }
      }),
      prisma.partnerProgram.groupBy({
        by: ["tier"],
        _count: { _all: true }
      })
    ]);

    const totals = partners.reduce(
      (acc, partner) => {
        acc.brands += partner.attributedBrands;
        acc.creators += partner.attributedCreators;
        acc.revenue += money(partner.attributedRevenue);
        acc.pending += money(partner.pendingCommission);
        acc.paid += money(partner.paidCommission);
        return acc;
      },
      { brands: 0, creators: 0, revenue: 0, pending: 0, paid: 0 }
    );

    return {
      totals,
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count._all,
        revenue: money(item._sum.attributedRevenue),
        pending: money(item._sum.pendingCommission),
        paid: money(item._sum.paidCommission)
      })),
      byTier: byTier.map((item) => ({ tier: item.tier, count: item._count._all })),
      partners
    };
  }

  async getAcademyDashboard(actor: AuthUser) {
    this.assertAdminRead(actor);
    const [courses, byAudience, byStatus] = await Promise.all([
      prisma.academyCourse.findMany({
        orderBy: [{ status: "asc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
        take: 50
      }),
      prisma.academyCourse.groupBy({
        by: ["audience"],
        _count: { _all: true },
        _sum: { completionCount: true }
      }),
      prisma.academyCourse.groupBy({
        by: ["status"],
        _count: { _all: true }
      })
    ]);

    const totals = courses.reduce(
      (acc, course) => {
        acc.lessons += course.lessonCount;
        acc.minutes += course.durationMinutes;
        acc.completions += course.completionCount;
        if (course.status === "PUBLISHED") acc.published += 1;
        return acc;
      },
      { lessons: 0, minutes: 0, completions: 0, published: 0 }
    );

    return {
      totals,
      byAudience: byAudience.map((item) => ({
        audience: item.audience,
        count: item._count._all,
        completions: item._sum.completionCount ?? 0
      })),
      byStatus: byStatus.map((item) => ({ status: item.status, count: item._count._all })),
      courses
    };
  }
}

export const partnerAcademyAdminService = new PartnerAcademyAdminService();
