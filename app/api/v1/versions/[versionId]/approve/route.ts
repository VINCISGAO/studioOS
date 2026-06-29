import { reviewDecisionService } from "@/features/review/review-decision.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ versionId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { versionId } = await params;
    const result = await reviewDecisionService.approveVersion(versionId, {
      id: user.id,
      role: user.role
    });
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
