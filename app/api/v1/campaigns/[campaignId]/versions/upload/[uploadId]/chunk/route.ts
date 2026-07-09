import { versionUploadService } from "@/features/video/version-upload.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

type Params = { params: Promise<{ campaignId: string; uploadId: string }> };
const MAX_UPLOAD_CHUNK_BYTES = 5 * 1024 * 1024;

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { uploadId } = await params;
    const url = new URL(request.url);
    const chunkIndex = Number(url.searchParams.get("index") ?? "0");
    if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
      return handleRouteError(appError("VALIDATION_ERROR", "Invalid chunk index"));
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_CHUNK_BYTES) {
      return handleRouteError(appError("VALIDATION_ERROR", "Upload chunk exceeds 5 MB limit"));
    }

    const buffer = Buffer.from(await request.arrayBuffer());
    if (buffer.length > MAX_UPLOAD_CHUNK_BYTES) {
      return handleRouteError(appError("VALIDATION_ERROR", "Upload chunk exceeds 5 MB limit"));
    }
    const result = await versionUploadService.uploadChunk(uploadId, chunkIndex, buffer, {
      id: user.id,
      role: user.role
    });
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
