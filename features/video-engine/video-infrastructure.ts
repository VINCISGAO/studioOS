import { isSeedanceVideoModel } from "@/lib/canvas/seedance-client";
import { hasSeedance } from "@/lib/core/config/ai";
import { isObjectStorageConfigured } from "@/lib/core/config/video";
import { appError } from "@/lib/core/errors";
import { canPersistLocalDataStore } from "@/lib/runtime-flags";

function videoJobUsesReferenceMedia(parameters: Record<string, unknown>) {
  return Boolean(
    parameters.referenceAssetId ||
      parameters.referenceUrl ||
      parameters.lastFrameReferenceAssetId ||
      parameters.lastFrameReferenceUrl ||
      parameters.libraryReferenceAssetIds
  );
}

export function assertVideoReferenceInfrastructure(parameters: Record<string, unknown>) {
  if (!videoJobUsesReferenceMedia(parameters)) return;
  if (!isObjectStorageConfigured()) {
    throw appError(
      "VALIDATION_ERROR",
      "使用参考素材生成视频需要配置 R2 对象存储，Seedance 才能拉取 HTTPS 素材地址。"
    );
  }
}

export function assertVideoGenerationInfrastructure(modelId: string) {
  if (!isSeedanceVideoModel(modelId)) return;
  if (!hasSeedance()) {
    throw appError(
      "SYSTEM_ERROR",
      "SEEDANCE_API_KEY is not configured. Add it to .env.local (dev) or Vercel environment variables and redeploy."
    );
  }
  if (!isObjectStorageConfigured() && !canPersistLocalDataStore()) {
    throw appError(
      "SYSTEM_ERROR",
      "Object storage (R2) is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY, and R2_BUCKET in production."
    );
  }
}
