import { relationshipDnaService } from "@/features/memory/relationship-dna.service";
import { memoryRepository } from "@/features/memory/memory.repository";
import { PermissionService } from "@/features/auth/permission.service";
import { requireAdminSession } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

type Params = { params: Promise<{ brandId: string; creatorId: string }> };

async function hasIndependentAdminSession(request: Request) {
  try {
    await requireAdminSession(request);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request, { params }: Params) {
  try {
    const hasAdminSession = await hasIndependentAdminSession(request);
    const user = hasAdminSession ? null : await requireApiUser(request);
    const { brandId, creatorId } = await params;
    if (user) {
      PermissionService.assert(user, "campaign.read");
      if (user.id !== brandId && user.id !== creatorId) {
        throw appError("FORBIDDEN", "Cannot view this relationship");
      }
    }
    const canViewBrandRelationships = hasAdminSession || user?.id === brandId;

    const snapshot = await relationshipDnaService.buildSnapshot(brandId, creatorId);
    const relationships = canViewBrandRelationships
      ? await memoryRepository.listRelationshipsForBrand(brandId, 10)
      : [];

    return apiSuccess({
      relationshipDna: snapshot,
      topRelationships: relationships.map((r) => ({
        creatorId: r.creatorId,
        creatorName: r.creator.fullName,
        collaborationCount: r.collaborationCount,
        avgSatisfaction: r.avgSatisfaction != null ? Number(r.avgSatisfaction) : null,
        priorityScore: r.priorityScore
      }))
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
