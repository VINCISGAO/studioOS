import "server-only";
import type { AuthUserDto } from "@/features/auth/auth.service";
import { canvasAssetService } from "@/features/canvas/canvas-asset.service";
import { appError } from "@/lib/core/errors";
import { isObjectStorageConfigured } from "@/lib/core/config/video";
import { createSignedObjectReadUrl } from "@/lib/studioos/object-storage";

function isPublicHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function resolveSeedancePublicAssetUrl(input: {
  user: AuthUserDto;
  assetId?: string;
  referenceUrl?: string;
}) {
  const direct = input.referenceUrl?.trim();
  if (direct && isPublicHttpsUrl(direct)) {
    return direct;
  }

  const assetId = input.assetId?.trim();
  if (!assetId) return null;

  if (!isObjectStorageConfigured()) {
    throw appError(
      "SYSTEM_ERROR",
      "Reference media requires R2 object storage so Seedance can fetch a public HTTPS URL."
    );
  }

  const asset = await canvasAssetService.requireAsset(assetId, input.user);
  const signed = await createSignedObjectReadUrl({ key: asset.fileKey, expiresIn: 3600 });
  if (!signed) {
    throw appError("SYSTEM_ERROR", "Failed to create a public read URL for the reference asset.");
  }
  return signed;
}
