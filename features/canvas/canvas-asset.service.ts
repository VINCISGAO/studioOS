import { randomUUID } from "node:crypto";
import type { AuthUserDto } from "@/features/auth/auth.service";
import { activityService } from "@/features/campaign/activity.service";
import { canvasRepository } from "@/features/canvas/canvas.repository";
import { canvasService } from "@/features/canvas/canvas.service";
import {
  buildGeneratedAssetMetadata,
  buildLibraryUploadMetadata,
  buildReferenceUploadMetadata,
  CANVAS_LIBRARY_ASSET_KIND,
  LEGACY_CANVAS_ASSET_KIND,
  parseCanvasAssetMetadata,
  type SeedanceReviewStatus
} from "@/lib/canvas/canvas-asset-metadata";
import {
  CANVAS_LIBRARY_ASSET_TYPE,
  type CanvasAssetLibraryKind,
  type CanvasLibraryAssetType
} from "@/lib/canvas/canvas-library-kind";
import { reviewSeedanceLibraryAsset } from "@/lib/canvas/seedance-asset-review.server";
import { appError } from "@/lib/core/errors";
import { asInputJson } from "@/lib/core/prisma-json";
import {
  detectImageMimeFromMagicBytes,
  looksLikeSupportedVideo
} from "@/lib/studioos/upload-magic-bytes";
import { getObject, putObject } from "@/lib/studioos/object-storage";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

type AcceptedUpload = {
  mimeType: string;
  extension: string;
  assetType: "REFERENCE_IMAGE" | "REFERENCE_VIDEO" | "MUSIC";
  nodeType: "image" | "video" | "music";
  maxBytes: number;
};

type StoredAsset = {
  id: string;
  fileName: string;
  mimeType: string;
  fileKey: string;
  projectId: string;
  campaignId: string | null;
  metadataJson: unknown;
};

type UploadTarget = "library" | "reference";

function ascii(buffer: Buffer, start: number, end: number) {
  return buffer.subarray(start, end).toString("ascii");
}

function detectAudio(buffer: Buffer, declaredMime: string): AcceptedUpload | null {
  if (
    ascii(buffer, 0, 3) === "ID3" ||
    (buffer[0] === 0xff && [0xe2, 0xe3, 0xea, 0xeb, 0xf2, 0xf3, 0xfa, 0xfb].includes(buffer[1] ?? 0))
  ) {
    return {
      mimeType: "audio/mpeg",
      extension: "mp3",
      assetType: "MUSIC",
      nodeType: "music",
      maxBytes: MAX_AUDIO_BYTES
    };
  }
  if (ascii(buffer, 0, 4) === "RIFF" && ascii(buffer, 8, 12) === "WAVE") {
    return {
      mimeType: "audio/wav",
      extension: "wav",
      assetType: "MUSIC",
      nodeType: "music",
      maxBytes: MAX_AUDIO_BYTES
    };
  }
  if (declaredMime === "audio/mp4" && ascii(buffer, 4, 8) === "ftyp") {
    return {
      mimeType: "audio/mp4",
      extension: "m4a",
      assetType: "MUSIC",
      nodeType: "music",
      maxBytes: MAX_AUDIO_BYTES
    };
  }
  return null;
}

function detectUpload(buffer: Buffer, file: File): AcceptedUpload | null {
  const imageMime = detectImageMimeFromMagicBytes(buffer);
  if (imageMime) {
    const extension =
      imageMime === "image/png"
        ? "png"
        : imageMime === "image/webp"
          ? "webp"
          : imageMime === "image/gif"
            ? "gif"
            : "jpg";
    return {
      mimeType: imageMime,
      extension,
      assetType: "REFERENCE_IMAGE",
      nodeType: "image",
      maxBytes: MAX_IMAGE_BYTES
    };
  }

  const declared = file.type.toLowerCase();
  const extension = file.name.toLowerCase().split(".").pop();
  if (
    (extension === "mp4" || extension === "mov" || extension === "webm") &&
    looksLikeSupportedVideo(buffer, extension)
  ) {
    return {
      mimeType:
        extension === "webm" ? "video/webm" : extension === "mov" ? "video/quicktime" : "video/mp4",
      extension,
      assetType: "REFERENCE_VIDEO",
      nodeType: "video",
      maxBytes: MAX_VIDEO_BYTES
    };
  }
  return detectAudio(buffer, declared);
}

function safeDisplayName(value: string) {
  return value.replace(/[\u0000-\u001f\u007f/\\]/g, "_").slice(0, 180) || "canvas-asset";
}

function assertLibraryKindMatch(accepted: AcceptedUpload, libraryKind: CanvasAssetLibraryKind) {
  const expected = CANVAS_LIBRARY_ASSET_TYPE[libraryKind];
  if (accepted.assetType !== expected) {
    const labels: Record<CanvasAssetLibraryKind, string> = {
      image: "image",
      video: "video",
      audio: "audio"
    };
    throw appError(
      "VALIDATION_ERROR",
      `This library only accepts ${labels[libraryKind]} files`
    );
  }
}

function libraryAssetTypeForKind(kind: CanvasAssetLibraryKind): CanvasLibraryAssetType {
  return CANVAS_LIBRARY_ASSET_TYPE[kind];
}

function serializeLibraryAsset(asset: {
  id: string;
  fileName: string;
  mimeType: string;
  assetType: string;
  previewUrl: string | null;
  metadataJson: unknown;
}) {
  const meta = parseCanvasAssetMetadata(asset.metadataJson);
  return {
    id: asset.id,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    assetType: asset.assetType,
    url: asset.previewUrl ?? `/api/canvas/assets/${asset.id}/preview`,
    reviewStatus: meta.seedanceReview?.status ?? ("APPROVED" as SeedanceReviewStatus),
    reviewReasons: meta.seedanceReview?.reasons ?? [],
    selectable: (meta.seedanceReview?.status ?? "APPROVED") === "APPROVED"
  };
}

export class CanvasAssetService {
  async upload(
    projectId: string,
    file: File,
    user: AuthUserDto,
    options?: { target?: UploadTarget; locale?: "zh" | "en"; libraryKind?: CanvasAssetLibraryKind }
  ) {
    const target = options?.target ?? "reference";
    const project = await canvasService.assertAccess(projectId, user);
    if (!file.size) throw appError("VALIDATION_ERROR", "File is empty");
    if (file.size > MAX_VIDEO_BYTES) {
      throw appError("VALIDATION_ERROR", "File exceeds the 200MB upload limit");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const accepted = detectUpload(buffer, file);
    if (!accepted) {
      throw appError(
        "VALIDATION_ERROR",
        "Only verified JPEG, PNG, WebP, GIF, MP4, MOV, WebM, MP3, WAV and M4A files are allowed"
      );
    }
    if (file.size > accepted.maxBytes) {
      throw appError("VALIDATION_ERROR", `File exceeds the ${accepted.maxBytes / 1024 / 1024}MB limit`);
    }
    if (target === "library") {
      if (!options?.libraryKind) {
        throw appError("VALIDATION_ERROR", "libraryKind is required for library uploads");
      }
      assertLibraryKindMatch(accepted, options.libraryKind);
    }

    let metadataJson: Record<string, unknown>;
    if (target === "library") {
      const review = await reviewSeedanceLibraryAsset({
        buffer,
        mimeType: accepted.mimeType,
        assetType: accepted.assetType,
        locale: options?.locale
      });
      metadataJson = buildLibraryUploadMetadata(review);
    } else {
      metadataJson = buildReferenceUploadMetadata("creator_upload");
    }

    const objectName = `${randomUUID()}.${accepted.extension}`;
    const storagePrefix = project.campaignId
      ? `campaigns/${project.campaignId}/canvas`
      : `creative-projects/${project.id}/canvas`;
    const fileKey = `${storagePrefix}/${objectName}`;
    const stored = await putObject(fileKey, buffer, accepted.mimeType);

    const asset = project.campaignId
      ? await canvasRepository.createCampaignAsset({
          campaignId: project.campaignId,
          uploadedBy: user.id,
          assetType: accepted.assetType,
          fileName: safeDisplayName(file.name),
          fileKey: stored.key,
          storageProvider: stored.backend,
          mimeType: accepted.mimeType,
          fileSize: file.size,
          metadataJson: asInputJson(metadataJson) ?? {}
        })
      : await canvasRepository.createProjectAsset({
          creativeProjectId: project.id,
          uploadedBy: user.id,
          assetType: accepted.assetType,
          fileName: safeDisplayName(file.name),
          fileKey: stored.key,
          storageProvider: stored.backend,
          mimeType: accepted.mimeType,
          fileSize: file.size,
          metadataJson: asInputJson(metadataJson) ?? {}
        });

    if (project.campaignId) {
      await activityService.write(
        project.campaignId,
        target === "library" ? "canvas.library_asset_uploaded" : "canvas.asset_uploaded",
        { userId: user.id, email: user.email, role: "creator" },
        {
          asset_id: asset.id,
          mime_type: accepted.mimeType,
          size_bytes: file.size,
          review_status: parseCanvasAssetMetadata(metadataJson).seedanceReview?.status ?? null
        }
      );
    }

    const serialized = serializeLibraryAsset({
      id: asset.id,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      assetType: accepted.assetType,
      previewUrl: null,
      metadataJson
    });

    return {
      id: asset.id,
      nodeType: accepted.nodeType,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      url: serialized.url,
      inLibrary: target === "library",
      reviewStatus: serialized.reviewStatus,
      reviewReasons: serialized.reviewReasons,
      selectable: serialized.selectable
    };
  }

  async saveGeneratedBuffer(
    projectId: string,
    user: AuthUserDto,
    input: {
      buffer: Buffer;
      mimeType: string;
      fileName: string;
      metadata: Record<string, unknown>;
    }
  ) {
    const project = await canvasService.assertAccess(projectId, user);
    if (!input.buffer.length) throw appError("VALIDATION_ERROR", "Generated image is empty");
    if (input.buffer.length > MAX_IMAGE_BYTES) {
      throw appError("VALIDATION_ERROR", "Generated image exceeds the 20MB limit");
    }

    const extension =
      input.mimeType === "image/png"
        ? "png"
        : input.mimeType === "image/webp"
          ? "webp"
          : input.mimeType === "image/gif"
            ? "gif"
            : "jpg";
    const objectName = `${randomUUID()}.${extension}`;
    const storagePrefix = project.campaignId
      ? `campaigns/${project.campaignId}/canvas`
      : `creative-projects/${project.id}/canvas`;
    const fileKey = `${storagePrefix}/${objectName}`;
    const stored = await putObject(fileKey, input.buffer, input.mimeType);
    const metadataJson = buildGeneratedAssetMetadata(input.metadata);

    const asset = project.campaignId
      ? await canvasRepository.createCampaignAsset({
          campaignId: project.campaignId,
          uploadedBy: user.id,
          assetType: "REFERENCE_IMAGE",
          fileName: safeDisplayName(input.fileName),
          fileKey: stored.key,
          storageProvider: stored.backend,
          mimeType: input.mimeType,
          fileSize: input.buffer.length,
          metadataJson: asInputJson(metadataJson) ?? {}
        })
      : await canvasRepository.createProjectAsset({
          creativeProjectId: project.id,
          uploadedBy: user.id,
          assetType: "REFERENCE_IMAGE",
          fileName: safeDisplayName(input.fileName),
          fileKey: stored.key,
          storageProvider: stored.backend,
          mimeType: input.mimeType,
          fileSize: input.buffer.length,
          metadataJson: asInputJson(metadataJson) ?? {}
        });

    if (project.campaignId) {
      await activityService.write(
        project.campaignId,
        "canvas.chat_image_generated",
        { userId: user.id, email: user.email, role: "creator" },
        { asset_id: asset.id, mime_type: input.mimeType, size_bytes: input.buffer.length }
      );
    }

    return {
      id: asset.id,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      url: `/api/canvas/assets/${asset.id}/preview`
    };
  }

  async saveGeneratedVideoBuffer(
    projectId: string,
    user: AuthUserDto,
    input: {
      buffer: Buffer;
      mimeType: string;
      fileName: string;
      metadata: Record<string, unknown>;
    }
  ) {
    const project = await canvasService.assertAccess(projectId, user);
    if (!input.buffer.length) throw appError("VALIDATION_ERROR", "Generated video is empty");
    if (input.buffer.length > MAX_VIDEO_BYTES) {
      throw appError("VALIDATION_ERROR", "Generated video exceeds the 200MB limit");
    }

    const extension =
      input.mimeType === "video/webm"
        ? "webm"
        : input.mimeType === "video/quicktime"
          ? "mov"
          : "mp4";
    const objectName = `${randomUUID()}.${extension}`;
    const storagePrefix = project.campaignId
      ? `campaigns/${project.campaignId}/canvas`
      : `creative-projects/${project.id}/canvas`;
    const fileKey = `${storagePrefix}/${objectName}`;
    const stored = await putObject(fileKey, input.buffer, input.mimeType);
    const metadataJson = buildGeneratedAssetMetadata(input.metadata);

    const asset = project.campaignId
      ? await canvasRepository.createCampaignAsset({
          campaignId: project.campaignId,
          uploadedBy: user.id,
          assetType: "REFERENCE_VIDEO",
          fileName: safeDisplayName(input.fileName),
          fileKey: stored.key,
          storageProvider: stored.backend,
          mimeType: input.mimeType,
          fileSize: input.buffer.length,
          metadataJson: asInputJson(metadataJson) ?? {}
        })
      : await canvasRepository.createProjectAsset({
          creativeProjectId: project.id,
          uploadedBy: user.id,
          assetType: "REFERENCE_VIDEO",
          fileName: safeDisplayName(input.fileName),
          fileKey: stored.key,
          storageProvider: stored.backend,
          mimeType: input.mimeType,
          fileSize: input.buffer.length,
          metadataJson: asInputJson(metadataJson) ?? {}
        });

    if (project.campaignId) {
      await activityService.write(
        project.campaignId,
        "canvas.video_generated",
        { userId: user.id, email: user.email, role: "creator" },
        { asset_id: asset.id, mime_type: input.mimeType, size_bytes: input.buffer.length }
      );
    }

    return {
      id: asset.id,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      url: `/api/canvas/assets/${asset.id}/preview`
    };
  }

  async saveGeneratedAudioBuffer(
    projectId: string,
    user: AuthUserDto,
    input: {
      buffer: Buffer;
      mimeType: string;
      fileName: string;
      metadata: Record<string, unknown>;
    }
  ) {
    const project = await canvasService.assertAccess(projectId, user);
    if (!input.buffer.length) throw appError("VALIDATION_ERROR", "Generated audio is empty");
    if (input.buffer.length > MAX_AUDIO_BYTES) {
      throw appError("VALIDATION_ERROR", "Generated audio exceeds the 50MB limit");
    }

    const extension =
      input.mimeType === "audio/wav"
        ? "wav"
        : input.mimeType === "audio/mp4"
          ? "m4a"
          : "mp3";
    const objectName = `${randomUUID()}.${extension}`;
    const storagePrefix = project.campaignId
      ? `campaigns/${project.campaignId}/canvas`
      : `creative-projects/${project.id}/canvas`;
    const fileKey = `${storagePrefix}/${objectName}`;
    const stored = await putObject(fileKey, input.buffer, input.mimeType);
    const metadataJson = buildGeneratedAssetMetadata(input.metadata);

    const asset = project.campaignId
      ? await canvasRepository.createCampaignAsset({
          campaignId: project.campaignId,
          uploadedBy: user.id,
          assetType: "MUSIC",
          fileName: safeDisplayName(input.fileName),
          fileKey: stored.key,
          storageProvider: stored.backend,
          mimeType: input.mimeType,
          fileSize: input.buffer.length,
          metadataJson: asInputJson(metadataJson) ?? {}
        })
      : await canvasRepository.createProjectAsset({
          creativeProjectId: project.id,
          uploadedBy: user.id,
          assetType: "MUSIC",
          fileName: safeDisplayName(input.fileName),
          fileKey: stored.key,
          storageProvider: stored.backend,
          mimeType: input.mimeType,
          fileSize: input.buffer.length,
          metadataJson: asInputJson(metadataJson) ?? {}
        });

    if (project.campaignId) {
      await activityService.write(
        project.campaignId,
        "canvas.music_generated",
        { userId: user.id, email: user.email, role: "creator" },
        { asset_id: asset.id, mime_type: input.mimeType, size_bytes: input.buffer.length }
      );
    }

    return {
      id: asset.id,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      url: `/api/canvas/assets/${asset.id}/preview`
    };
  }

  async uploadBatch(
    projectId: string,
    files: File[],
    user: AuthUserDto,
    options: { target: "library"; locale?: "zh" | "en"; libraryKind: CanvasAssetLibraryKind }
  ) {
    if (!files.length) throw appError("VALIDATION_ERROR", "At least one file is required");
    if (files.length > 24) throw appError("VALIDATION_ERROR", "You can upload up to 24 files at once");

    const uploaded = [];
    for (const file of files) {
      uploaded.push(
        await this.upload(projectId, file, user, {
          target: options.target,
          locale: options.locale,
          libraryKind: options.libraryKind
        })
      );
    }
    return uploaded;
  }

  async listProjectAssets(
    projectId: string,
    user: AuthUserDto,
    options?: { kind?: CanvasAssetLibraryKind }
  ) {
    const project = await canvasService.assertAccess(projectId, user);
    const assetType = options?.kind ? libraryAssetTypeForKind(options.kind) : null;
    const rows = project.campaignId
      ? assetType
        ? await canvasRepository.listCampaignLibraryAssets(project.campaignId, assetType)
        : await canvasRepository.listCampaignAssets(project.campaignId)
      : assetType
        ? await canvasRepository.listProjectLibraryAssets(projectId, assetType)
        : await canvasRepository.listProjectAssets(projectId);

    if (assetType) {
      return rows.map((asset) => serializeLibraryAsset(asset));
    }

    return rows
      .filter((asset) => {
        const meta = parseCanvasAssetMetadata(asset.metadataJson);
        if (meta.kind === CANVAS_LIBRARY_ASSET_KIND) return true;
        return meta.kind === LEGACY_CANVAS_ASSET_KIND && meta.source === "creator_upload";
      })
      .map((asset) => serializeLibraryAsset(asset));
  }

  async deleteLibraryAssets(
    projectId: string,
    assetIds: string[],
    user: AuthUserDto,
    options?: { kind?: CanvasAssetLibraryKind }
  ) {
    const project = await canvasService.assertAccess(projectId, user);
    if (!assetIds.length) throw appError("VALIDATION_ERROR", "assetIds is required");

    const uniqueIds = [...new Set(assetIds)];
    const assetType = options?.kind ? libraryAssetTypeForKind(options.kind) : null;

    let deletable: string[];
    if (assetType) {
      const rows = project.campaignId
        ? await canvasRepository.findCampaignLibraryAssetIds(project.campaignId, uniqueIds, assetType)
        : await canvasRepository.findProjectLibraryAssetIds(project.id, uniqueIds, assetType);
      deletable = rows.map((row) => row.id);
    } else {
      const rows = project.campaignId
        ? await canvasRepository.listCampaignAssets(project.campaignId)
        : await canvasRepository.listProjectAssets(projectId);
      const libraryIds = new Set(
        rows
          .filter((row) => {
            const meta = parseCanvasAssetMetadata(row.metadataJson);
            if (meta.kind === CANVAS_LIBRARY_ASSET_KIND) return true;
            return meta.kind === LEGACY_CANVAS_ASSET_KIND && meta.source === "creator_upload";
          })
          .map((row) => row.id)
      );
      deletable = uniqueIds.filter((id) => libraryIds.has(id));
    }

    if (!deletable.length) {
      throw appError("NOT_FOUND", "No deletable library assets found");
    }

    const result = project.campaignId
      ? await canvasRepository.softDeleteCampaignAssets(project.campaignId, deletable)
      : await canvasRepository.softDeleteProjectAssets(project.id, deletable);

    if (project.campaignId) {
      await activityService.write(
        project.campaignId,
        "canvas.library_assets_deleted",
        { userId: user.id, email: user.email, role: "creator" },
        { asset_ids: deletable, count: result.count }
      );
    }

    return { deleted: result.count, assetIds: deletable };
  }

  assertSeedanceSelectableAsset(asset: Pick<StoredAsset, "metadataJson">) {
    const meta = parseCanvasAssetMetadata(asset.metadataJson);
    const status = meta.seedanceReview?.status;
    if (status && status !== "APPROVED") {
      throw appError(
        "VALIDATION_ERROR",
        status === "REJECTED"
          ? "This asset was rejected and cannot be used for generation"
          : "This asset is still under review and cannot be used for generation yet"
      );
    }
  }

  async requireAsset(assetId: string, user: AuthUserDto): Promise<StoredAsset> {
    const campaignAsset = await canvasRepository.findAssetById(assetId);
    if (campaignAsset) {
      await canvasService.assertAccess(campaignAsset.campaignId, user);
      return {
        id: campaignAsset.id,
        fileName: campaignAsset.fileName,
        mimeType: campaignAsset.mimeType,
        fileKey: campaignAsset.fileKey,
        projectId: campaignAsset.campaignId,
        campaignId: campaignAsset.campaignId,
        metadataJson: campaignAsset.metadataJson
      };
    }

    const projectAsset = await canvasRepository.findProjectAssetById(assetId);
    if (!projectAsset) throw appError("NOT_FOUND", "Canvas asset not found");
    await canvasService.assertAccess(projectAsset.creativeProjectId, user);
    return {
      id: projectAsset.id,
      fileName: projectAsset.fileName,
      mimeType: projectAsset.mimeType,
      fileKey: projectAsset.fileKey,
      projectId: projectAsset.creativeProjectId,
      campaignId: null,
      metadataJson: projectAsset.metadataJson
    };
  }

  async loadBuffer(assetId: string, user: AuthUserDto) {
    const asset = await this.requireAsset(assetId, user);
    const buffer = await getObject(asset.fileKey);
    if (!buffer) throw appError("NOT_FOUND", "Canvas asset file not found");
    return {
      id: asset.id,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      buffer
    };
  }
}

export const canvasAssetService = new CanvasAssetService();
