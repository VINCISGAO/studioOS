import "server-only";

import type { AuthUserDto } from "@/features/auth/auth.service";
import { canvasAssetService } from "@/features/canvas/canvas-asset.service";
import { canvasRepository } from "@/features/canvas/canvas.repository";
import { parseCanvasPreviewAssetId } from "@/lib/canvas/canvas-preview-asset-id";

type ResolvedReference = {
  assetId?: string;
  url?: string;
  nodeId?: string;
  mimeType?: string;
};

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNodeData(raw: unknown): {
  assetId?: string;
  url?: string;
  mimeType?: string;
  fileName?: string;
} {
  if (!raw || typeof raw !== "object") return {};
  const record = raw as Record<string, unknown>;
  return {
    assetId: readString(record.assetId),
    url: readString(record.url),
    mimeType: readString(record.mimeType),
    fileName: readString(record.fileName) ?? readString(record.title)
  };
}

async function resolveCanvasNodeReference(
  projectId: string,
  nodeId: string
): Promise<ResolvedReference> {
  const canvas = await canvasRepository.findCanvas(projectId);
  const node = canvas?.nodes.find((entry) => entry.id === nodeId);
  if (!node) return { nodeId };

  const data = readNodeData(node.data);
  return {
    nodeId,
    assetId: data.assetId ?? parseCanvasPreviewAssetId(data.url),
    url: data.url,
    mimeType: data.mimeType
  };
}

async function resolveReferenceFields(
  user: AuthUserDto,
  projectId: string,
  fields: ResolvedReference
): Promise<ResolvedReference> {
  let assetId = fields.assetId;
  let url = fields.url;
  let nodeId = fields.nodeId;
  let mimeType = fields.mimeType;

  if (!assetId && nodeId) {
    const fromNode = await resolveCanvasNodeReference(projectId, nodeId);
    assetId = fromNode.assetId ?? assetId;
    url = fromNode.url ?? url;
    mimeType = fromNode.mimeType ?? mimeType;
  }

  if (!assetId && url) {
    assetId = parseCanvasPreviewAssetId(url);
  }

  if (assetId) {
    const asset = await canvasAssetService.requireAsset(assetId, user);
    if (!mimeType) {
      mimeType = asset.mimeType;
    }
  }

  return { assetId, url, nodeId, mimeType };
}

function applyResolvedReference(
  parameters: Record<string, unknown>,
  prefix: "" | "lastFrameReference",
  resolved: ResolvedReference
) {
  const assetKey = prefix ? `${prefix}AssetId` : "referenceAssetId";
  const urlKey = prefix ? `${prefix}Url` : "referenceUrl";
  const nodeKey = prefix ? `${prefix}NodeId` : "referenceNodeId";
  const mimeKey = prefix ? `${prefix}MimeType` : "referenceMimeType";

  if (resolved.assetId) parameters[assetKey] = resolved.assetId;
  if (resolved.url) parameters[urlKey] = resolved.url;
  if (resolved.nodeId) parameters[nodeKey] = resolved.nodeId;
  if (resolved.mimeType) parameters[mimeKey] = resolved.mimeType;
}

export async function normalizeGenerationReferenceParameters(
  user: AuthUserDto,
  projectId: string,
  parameters: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const next = { ...parameters };

  const primary = await resolveReferenceFields(user, projectId, {
    assetId: readString(parameters.referenceAssetId),
    url: readString(parameters.referenceUrl),
    nodeId: readString(parameters.referenceNodeId),
    mimeType: readString(parameters.referenceMimeType)
  });
  applyResolvedReference(next, "", primary);

  const lastFrame = await resolveReferenceFields(user, projectId, {
    assetId: readString(parameters.lastFrameReferenceAssetId),
    url: readString(parameters.lastFrameReferenceUrl),
    nodeId: readString(parameters.lastFrameReferenceNodeId),
    mimeType: readString(parameters.lastFrameReferenceMimeType)
  });
  applyResolvedReference(next, "lastFrameReference", lastFrame);

  const libraryIds = (readString(parameters.libraryReferenceAssetIds) ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!readString(next.referenceAssetId) && libraryIds[0]) {
    const promoted = await resolveReferenceFields(user, projectId, { assetId: libraryIds[0] });
    applyResolvedReference(next, "", promoted);
  }

  return next;
}

export const canvasGenerationReferenceService = {
  normalizeGenerationReferenceParameters
};
