import { versionProcessingService } from "@/features/video/version-processing.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ versionId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { versionId } = await params;
    const status = await versionProcessingService.getProcessingStatus(versionId, {
      id: user.id,
      role: user.role
    });
    return apiSuccess(status);
  } catch (error) {
    return handleRouteError(error);
  }
}
