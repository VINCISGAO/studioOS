import { randomUUID } from "node:crypto";
import { requireAdminMutationUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";
import { putObject } from "@/lib/studioos/object-storage";

export const runtime = "nodejs";

const MAX_BYTES = 300 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);

export async function POST(request: Request) {
  try {
    await requireAdminMutationUser(request);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw appError("VALIDATION_ERROR", "file is required");
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      throw appError("VALIDATION_ERROR", "Only MP4 / MOV / WebM videos are allowed");
    }
    if (file.size > MAX_BYTES) {
      throw appError("VALIDATION_ERROR", "Video must be 300MB or smaller");
    }

    const ext = file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4";
    const objectKey = `videos/marketing/showcase/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await putObject(objectKey, buffer, file.type);

    return apiSuccess({
      video_url: `/${objectKey}`,
      video_key: objectKey
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
