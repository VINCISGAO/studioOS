"use client";

import { useMutation } from "@tanstack/react-query";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import type { GenerationKind } from "@/components/canvas/generation-panel";
import type { GenerationJobEvent, VincisCanvasNode } from "@/lib/canvas/types";
import { formatValidationMessage } from "@/lib/canvas/format-validation-message";
import { computeGenerationCredits } from "@/lib/canvas/generation-credits";
import { primeGenerationSuccessSound } from "@/lib/canvas/generation-success-sound";
import {
  patchNodeGenerationMetadata,
  readNodeGenerationContext,
  type CanvasGenerationMode
} from "@/lib/canvas/node-generation-context";
import { readCanvasViewport, readViewportRect, spawnNodeAvoidingOverlap } from "@/lib/canvas/viewport-anchor";

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string };
};

type UploadedAsset = {
  id: string;
  nodeType: "image" | "video" | "music";
  fileName: string;
  mimeType: string;
  url: string;
};

import { MUSIC_NODE_LOADING_CARD } from "@/lib/canvas/music-node-design";
import { VIDEO_NODE_LOADING_CARD } from "@/lib/canvas/video-node-design";
import {
  canRegenerateMusicNode,
  resolveMusicRegeneratePrompt,
  spawnMusicRegenerateLoadingNode
} from "@/lib/canvas/music-regenerate";

const LOADING_CARD = { width: 320, height: 220 };

function loadingCardForGenerationType(generationType?: "IMAGE" | "VIDEO" | "MUSIC") {
  if (generationType === "MUSIC") return MUSIC_NODE_LOADING_CARD;
  if (generationType === "VIDEO") return VIDEO_NODE_LOADING_CARD;
  return LOADING_CARD;
}

function spawnLoadingNode(
  id: string,
  title: string,
  prompt: string,
  generationType?: "IMAGE" | "VIDEO" | "MUSIC"
): VincisCanvasNode {
  const state = useCanvasStore.getState();
  const rect = readViewportRect(null);
  const card = loadingCardForGenerationType(generationType);
  const isMusic = generationType === "MUSIC";
  return {
    id,
    type: isMusic ? "music" : "loading",
    position: spawnNodeAvoidingOverlap(readCanvasViewport(state.viewport), rect, card, state.nodes),
    width: card.width,
    height: card.height,
    data: { title, prompt, status: "loading", progress: 8, generationType }
  };
}

function nodeKindFromType(type: VincisCanvasNode["type"]): GenerationKind {
  if (type === "video") return "video";
  if (type === "music") return "music";
  return "image";
}

function defaultModeForKind(kind: GenerationKind): CanvasGenerationMode {
  if (kind === "video") return "TEXT_TO_VIDEO";
  if (kind === "music") return "TEXT_TO_MUSIC";
  return "TEXT_TO_IMAGE";
}

function nodeReference(node: VincisCanvasNode) {
  if (!node.data.assetId) return null;
  return {
    assetId: node.data.assetId,
    url: node.data.url,
    fileName: node.data.fileName,
    mimeType: node.data.mimeType,
    nodeId: node.id
  };
}

function estimateGenerationCredits(
  kind: GenerationKind,
  model: string,
  parameters: Record<string, string | number | boolean>
) {
  const type = kind === "image" ? "IMAGE" : kind === "video" ? "VIDEO" : "MUSIC";
  return computeGenerationCredits({ type, model, parameters });
}

function reserveCreditsOptimistically(
  kind: GenerationKind,
  model: string,
  parameters: Record<string, string | number | boolean>,
  onCreditsReserved?: (amount: number) => void
) {
  const estimatedCredits = estimateGenerationCredits(kind, model, parameters);
  if (estimatedCredits > 0) {
    onCreditsReserved?.(estimatedCredits);
  }
}

export function useCanvasMediaActions(
  projectId: string,
  options?: {
    onCreditsReserved?: (amount: number) => void;
    onCreditsSync?: () => void;
  }
) {
  const addNode = useCanvasStore((state) => state.addNode);
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const patchNodeData = useCanvasStore((state) => state.patchNodeData);
  const setNodeTypeAndData = useCanvasStore((state) => state.setNodeTypeAndData);

  const uploadMutation = useMutation({
    mutationFn: async ({ file }: { file: File; nodeId: string }) => {
      const formData = new FormData();
      formData.set("projectId", projectId);
      formData.set("file", file);
      formData.set("target", "reference");
      const response = await fetch("/api/canvas/assets", { method: "POST", body: formData });
      const payload = (await response.json()) as ApiEnvelope<UploadedAsset>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "Upload failed");
      }
      return payload.data;
    },
    onSuccess: (asset, variables) => {
      setNodeTypeAndData(variables.nodeId, "upload", {
        title: asset.fileName,
        status: "ready",
        progress: 100,
        url: asset.url,
        assetId: asset.id,
        fileName: asset.fileName,
        mimeType: asset.mimeType
      });
    },
    onError: (error, variables) => {
      updateNodeData(variables.nodeId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Upload failed"
      });
    }
  });

  const generationMutation = useMutation({
    mutationFn: async (input: {
      kind: GenerationKind;
      nodeId: string;
      prompt: string;
      model: string;
      mode: CanvasGenerationMode;
      parameters: Record<string, string | number | boolean>;
      reference?: {
        url?: string;
        assetId?: string;
        fileName?: string;
        mimeType?: string;
        nodeId?: string;
      } | null;
      lastFrameReference?: {
        url?: string;
        assetId?: string;
        fileName?: string;
        mimeType?: string;
        nodeId?: string;
      } | null;
    }) => {
      primeGenerationSuccessSound();

      const body: Record<string, unknown> = {
        projectId,
        nodeId: input.nodeId,
        prompt: input.prompt,
        model: input.model,
        idempotencyKey: crypto.randomUUID(),
        mode: input.mode,
        ...input.parameters
      };
      if (input.reference?.assetId) body.referenceAssetId = input.reference.assetId;
      if (input.reference?.url) body.referenceUrl = input.reference.url;
      if (input.reference?.nodeId) body.referenceNodeId = input.reference.nodeId;
      if (input.reference?.mimeType) body.referenceMimeType = input.reference.mimeType;
      if (input.lastFrameReference?.assetId) {
        body.lastFrameReferenceAssetId = input.lastFrameReference.assetId;
      }
      if (input.lastFrameReference?.url) body.lastFrameReferenceUrl = input.lastFrameReference.url;
      if (input.lastFrameReference?.nodeId) {
        body.lastFrameReferenceNodeId = input.lastFrameReference.nodeId;
      }
      if (input.lastFrameReference?.mimeType) {
        body.lastFrameReferenceMimeType = input.lastFrameReference.mimeType;
      }

      const response = await fetch(`/api/generation/${input.kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = (await response.json()) as ApiEnvelope<GenerationJobEvent>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "Generation request failed");
      }
      return payload.data;
    },
    onSuccess: (job, variables) => {
      patchNodeData(
        variables.nodeId,
        patchNodeGenerationMetadata(
          {
            ...(useCanvasStore.getState().nodes.find((node) => node.id === variables.nodeId)?.data ??
              {}),
            title:
              useCanvasStore.getState().nodes.find((node) => node.id === variables.nodeId)?.data
                .title ?? "Generation",
            status: "loading"
          },
          {
            model: variables.model,
            parameters: variables.parameters,
            mode: variables.mode
          }
        )
      );
      patchNodeData(variables.nodeId, { jobId: job.id, progress: job.progress });
      if (typeof job.chargedCredits === "number" && job.chargedCredits > 0) {
        patchNodeData(variables.nodeId, { chargedCredits: job.chargedCredits });
      }
      options?.onCreditsSync?.();
    },
    onError: (error, variables) => {
      const raw = error instanceof Error ? error.message : "Generation request failed";
      updateNodeData(variables.nodeId, {
        status: "failed",
        error: formatValidationMessage(raw)
      });
      options?.onCreditsSync?.();
    }
  });

  function upload(file: File) {
    const nodeId = `node_${crypto.randomUUID()}`;
    addNode(spawnLoadingNode(nodeId, "正在上传素材", file.name));
    uploadMutation.mutate({ file, nodeId });
  }

  function generate(
    kind: GenerationKind,
    input: {
      prompt: string;
      model?: string;
      mode?: CanvasGenerationMode;
      parameters?: Record<string, string | number | boolean>;
      reference?: {
        url?: string;
        assetId?: string;
        fileName?: string;
        mimeType?: string;
        nodeId?: string;
      } | null;
      lastFrameReference?: {
        url?: string;
        assetId?: string;
        fileName?: string;
        mimeType?: string;
        nodeId?: string;
      } | null;
      targetNodeId?: string;
    }
  ) {
    const generationType = kind === "image" ? "IMAGE" : kind === "video" ? "VIDEO" : "MUSIC";
    const title = kind === "image" ? "图片生成" : kind === "video" ? "视频生成" : "音乐生成";
    const nodeId = input.targetNodeId ?? `node_${crypto.randomUUID()}`;
    const mode = input.mode ?? defaultModeForKind(kind);
    const parameters =
      input.parameters ??
      (kind === "image"
        ? { aspectRatio: "1:1", resolution: "1024", outputs: 1, quality: "high" }
        : kind === "video"
          ? { aspectRatio: "auto", duration: 5, quality: "720p", audio: true, webSearch: false }
          : { instrumental: false });

    if (input.targetNodeId) {
      const card =
        kind === "music" ? MUSIC_NODE_LOADING_CARD : loadingCardForGenerationType(generationType);
      if (kind === "music") {
        updateNodeData(nodeId, {
          title,
          prompt: input.prompt,
          status: "loading",
          progress: 8,
          generationType
        });
      } else {
        setNodeTypeAndData(nodeId, "loading", {
          title,
          prompt: input.prompt,
          status: "loading",
          progress: 8,
          generationType
        });
      }
      useCanvasStore.setState((state) => ({
        nodes: state.nodes.map((node) =>
          node.id === nodeId ? { ...node, width: card.width, height: card.height } : node
        )
      }));
    } else {
      addNode(spawnLoadingNode(nodeId, title, input.prompt, generationType));
    }

    reserveCreditsOptimistically(
      kind,
      input.model ?? "vincis-mock-v1",
      parameters,
      options?.onCreditsReserved
    );

    generationMutation.mutate({
      kind,
      nodeId,
      prompt: input.prompt,
      model: input.model ?? "vincis-mock-v1",
      mode,
      parameters,
      reference: input.reference ?? null,
      lastFrameReference: input.lastFrameReference ?? null
    });
  }

  function requireNode(nodeId: string) {
    return useCanvasStore.getState().nodes.find((item) => item.id === nodeId) ?? null;
  }

  function regenerate(nodeId: string) {
    const node = requireNode(nodeId);
    if (!node) return;

    if (node.type === "music") {
      if (!canRegenerateMusicNode(node.data)) return;
      const prompt = resolveMusicRegeneratePrompt(node);
      const ctx = readNodeGenerationContext(node);
      const newNode = spawnMusicRegenerateLoadingNode(node, prompt);
      addNode(newNode);
      reserveCreditsOptimistically("music", ctx.model, ctx.parameters, options?.onCreditsReserved);
      generationMutation.mutate({
        kind: "music",
        nodeId: newNode.id,
        prompt,
        model: ctx.model,
        mode: "REGENERATE",
        parameters: ctx.parameters,
        reference: null
      });
      return;
    }

    if (!node.data.prompt) return;
    const ctx = readNodeGenerationContext(node);
    generate(nodeKindFromType(node.type), {
      prompt: ctx.prompt,
      model: ctx.model,
      mode: "REGENERATE",
      parameters: ctx.parameters,
      reference: nodeReference(node),
      targetNodeId: nodeId
    });
  }

  function upscale(nodeId: string) {
    const node = requireNode(nodeId);
    if (!node || !node.data.assetId || node.type !== "image") return;
    const ctx = readNodeGenerationContext(node);
    generate("image", {
      prompt: ctx.prompt || "Upscale image",
      model: ctx.model,
      mode: "UPSCALE",
      parameters: {
        ...ctx.parameters,
        quality: "high",
        resolution: "2048"
      },
      reference: nodeReference(node),
      targetNodeId: nodeId
    });
  }

  function removeBackground(nodeId: string) {
    const node = requireNode(nodeId);
    if (!node || node.type !== "image" || !node.data.assetId) return;
    const ctx = readNodeGenerationContext(node);
    generate("image", {
      prompt: ctx.prompt || "Remove background",
      model: ctx.model,
      mode: "REMOVE_BACKGROUND",
      parameters: ctx.parameters,
      reference: nodeReference(node),
      targetNodeId: nodeId
    });
  }

  return {
    upload,
    generate,
    regenerate,
    upscale,
    removeBackground,
    generationPending: generationMutation.isPending
  };
}
