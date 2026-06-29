import { versionUploadService } from "@/features/video/version-upload.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ campaignId: string; uploadId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { uploadId } = await params;
    const url = new URL(request.url);
    const chunkIndex = Number(url.searchParams.get("index") ?? "0");
    if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
      return handleRouteError(new Error("Invalid chunk index"));
    }

    const buffer = Buffer.from(await request.arrayBuffer());
    const result = await versionUploadService.uploadChunk(uploadId, chunkIndex, buffer, {
      id: user.id,
      role: user.role
    });
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
