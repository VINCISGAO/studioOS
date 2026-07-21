import { z } from "zod";
import { canvasAssetService } from "@/features/canvas/canvas-asset.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

const projectIdSchema = z.string().uuid();

const deleteSchema = z.object({
  projectId: z.string().uuid(),
  assetIds: z.array(z.string().uuid()).min(1).max(48)
});

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const projectId = projectIdSchema.parse(new URL(request.url).searchParams.get("projectId"));
    const assets = await canvasAssetService.listProjectAssets(projectId, user);
    return apiSuccess(assets);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const formData = await request.formData();
    const projectId = projectIdSchema.parse(formData.get("projectId"));
    const file = formData.get("file");
    if (!(file instanceof File)) throw appError("VALIDATION_ERROR", "file is required");
    const targetRaw = formData.get("target");
    const target = targetRaw === "library" ? "library" : "reference";
    const localeRaw = formData.get("locale");
    const locale = localeRaw === "en" ? "en" : "zh";

    const asset = await canvasAssetService.upload(projectId, file, user, { target, locale });
    return apiSuccess(asset, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireApiUser(request);
    const input = deleteSchema.parse(await request.json());
    const data = await canvasAssetService.deleteLibraryAssets(input.projectId, input.assetIds, user);
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
