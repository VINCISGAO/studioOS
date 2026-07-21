import { NextResponse } from "next/server";
import { canvasAssetService } from "@/features/canvas/canvas-asset.service";
import { handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";
import {
  createSignedObjectDownloadUrl,
  getObject
} from "@/lib/studioos/object-storage";

type Params = { params: Promise<{ assetId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    const { assetId } = await params;
    const asset = await canvasAssetService.requireAsset(assetId, user);
    const signedUrl = await createSignedObjectDownloadUrl({
      key: asset.fileKey,
      fileName: asset.fileName,
      expiresIn: 60
    });
    if (signedUrl) return NextResponse.redirect(signedUrl);

    const bytes = await getObject(asset.fileKey);
    if (!bytes) throw appError("NOT_FOUND", "Canvas asset file not found");
    const safeName = asset.fileName.replace(/[\r\n"\\/]/g, "_");
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Length": String(bytes.length),
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
