import { canvasAssetService } from "@/features/canvas/canvas-asset.service";
import { handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";
import { getObject } from "@/lib/studioos/object-storage";

type Params = { params: Promise<{ assetId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    const { assetId } = await params;
    const asset = await canvasAssetService.requireAsset(assetId, user);
    const bytes = await getObject(asset.fileKey);
    if (!bytes) throw appError("NOT_FOUND", "Canvas asset file not found");

    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400"
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
