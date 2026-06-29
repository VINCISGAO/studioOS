import { relationshipDnaService } from "@/features/memory/relationship-dna.service";
import { memoryRepository } from "@/features/memory/memory.repository";
import { PermissionService } from "@/features/auth/permission.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

type Params = { params: Promise<{ brandId: string; creatorId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    PermissionService.assert(user, "campaign.read");
    const { brandId, creatorId } = await params;

    const snapshot = await relationshipDnaService.buildSnapshot(brandId, creatorId);
    const relationships =
      user.id === brandId || user.role === "ADMIN"
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
