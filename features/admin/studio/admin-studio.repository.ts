import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export class AdminStudioRepository {
  async listStudios() {
    if (!hasDatabaseUrl()) return [];

    return prisma.creatorProfile.findMany({
      orderBy: { displayName: "asc" },
      include: {
        user: { select: { id: true, email: true, fullName: true, country: true } },
        studio: { select: { studioName: true, companyName: true, country: true } }
      }
    });
  }

  async listCreatorsForAssignment() {
    if (!hasDatabaseUrl()) return [];

    return prisma.creatorProfile.findMany({
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        displayName: true,
        country: true,
        user: { select: { email: true } }
      }
    });
  }
}

export const adminStudioRepository = new AdminStudioRepository();
