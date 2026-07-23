import { z } from "zod";
import { canvasAssetService } from "@/features/canvas/canvas-asset.service";
import { parseCanvasAssetLibraryKind } from "@/lib/canvas/canvas-library-kind";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

const projectIdSchema = z.string().uuid();

const deleteSchema = z.object({
  projectId: z.string().uuid(),
  kind: z.enum(["image", "video", "audio"]).optional(),
  assetIds: z.array(z.string().uuid()).min(1).max(48)
});

function readUploadFiles(formData: FormData) {
  const files = formData
    .getAll("file")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length) return files;
  const single = formData.get("file");
  if (single instanceof File && single.size > 0) return [single];
  return [];
}

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const params = new URL(request.url).searchParams;
    const projectId = projectIdSchema.parse(params.get("projectId"));
    const kind = parseCanvasAssetLibraryKind(params.get("kind"));
    const assets = await canvasAssetService.listProjectAssets(projectId, user, { kind: kind ?? undefined });
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
    const files = readUploadFiles(formData);
    if (!files.length) throw appError("VALIDATION_ERROR", "file is required");
    const targetRaw = formData.get("target");
    const target = targetRaw === "library" ? "library" : "reference";
    const localeRaw = formData.get("locale");
    const locale = localeRaw === "en" ? "en" : "zh";
    const libraryKind = parseCanvasAssetLibraryKind(
      typeof formData.get("kind") === "string" ? String(formData.get("kind")) : null
    );

    if (target === "library" && !libraryKind) {
      throw appError("VALIDATION_ERROR", "kind is required for library uploads");
    }

    if (files.length === 1) {
      const asset = await canvasAssetService.upload(projectId, files[0], user, {
        target,
        locale,
        libraryKind: libraryKind ?? undefined
      });
      return apiSuccess(asset, 201);
    }

    if (target !== "library" || !libraryKind) {
      throw appError("VALIDATION_ERROR", "Batch upload is only supported for library uploads");
    }

    const assets = await canvasAssetService.uploadBatch(projectId, files, user, {
      target: "library",
      locale,
      libraryKind
    });
    return apiSuccess(assets, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireApiUser(request);
    const input = deleteSchema.parse(await request.json());
    const data = await canvasAssetService.deleteLibraryAssets(input.projectId, input.assetIds, user, {
      kind: input.kind
    });
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
