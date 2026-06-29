import { versionUploadService, initUploadSchema } from "@/features/video/version-upload.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ campaignId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const body = initUploadSchema.parse(await request.json());
    const result = await versionUploadService.initUpload(campaignId, { id: user.id, role: user.role }, body);
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
