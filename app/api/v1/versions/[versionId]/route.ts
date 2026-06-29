import { reviewService } from "@/features/review/review.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ versionId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { versionId } = await params;
    const version = await reviewService.getVersion(versionId, { id: user.id, role: user.role });
    return apiSuccess(version);
  } catch (error) {
    return handleRouteError(error);
  }
}
