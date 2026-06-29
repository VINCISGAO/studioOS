import { versionUploadService } from "@/features/video/version-upload.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ campaignId: string; uploadId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { uploadId } = await params;
    const result = await versionUploadService.completeUpload(uploadId, { id: user.id, role: user.role });
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
