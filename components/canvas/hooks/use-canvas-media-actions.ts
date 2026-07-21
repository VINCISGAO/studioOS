"use client";

import { useMutation } from "@tanstack/react-query";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import type { GenerationKind } from "@/components/canvas/generation-panel";
import type { GenerationJobEvent, VincisCanvasNode } from "@/lib/canvas/types";

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

function nodePosition() {
  const viewport = useCanvasStore.getState().viewport;
  return {
    x: (window.innerWidth * 0.48 - viewport.x) / viewport.zoom,
    y: (window.innerHeight * 0.42 - viewport.y) / viewport.zoom
  };
}

function loadingNode(
  id: string,
  title: string,
  prompt: string,
  generationType?: "IMAGE" | "VIDEO" | "MUSIC"
): VincisCanvasNode {
  return {
    id,
    type: "loading",
    position: nodePosition(),
    width: 320,
    height: 220,
    data: { title, prompt, status: "loading", progress: 8, generationType }
  };
}

export function useCanvasMediaActions(projectId: string) {
  const addNode = useCanvasStore((state) => state.addNode);
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
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
      parameters: Record<string, string | number | boolean>;
      reference?: {
        url?: string;
        assetId?: string;
        fileName?: string;
        mimeType?: string;
        nodeId?: string;
      } | null;
    }) => {
      const body: Record<string, unknown> = {
        projectId,
        nodeId: input.nodeId,
        prompt: input.prompt,
        model: input.model,
        idempotencyKey: crypto.randomUUID(),
        ...input.parameters
      };
      if (input.reference?.assetId) body.referenceAssetId = input.reference.assetId;
      if (input.reference?.url) body.referenceUrl = input.reference.url;
      if (input.reference?.nodeId) body.referenceNodeId = input.reference.nodeId;

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
      updateNodeData(variables.nodeId, { jobId: job.id, progress: job.progress });
    },
    onError: (error, variables) => {
      updateNodeData(variables.nodeId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Generation request failed"
      });
    }
  });

  function upload(file: File) {
    const nodeId = `node_${crypto.randomUUID()}`;
    addNode(loadingNode(nodeId, "正在上传素材", file.name));
    uploadMutation.mutate({ file, nodeId });
  }

  function generate(
    kind: GenerationKind,
    input: {
      prompt: string;
      model?: string;
      parameters?: Record<string, string | number | boolean>;
      reference?: {
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

    if (input.targetNodeId) {
      updateNodeData(nodeId, {
        title,
        prompt: input.prompt,
        status: "loading",
        progress: 8,
        generationType
      });
    } else {
      addNode(loadingNode(nodeId, title, input.prompt, generationType));
    }

    generationMutation.mutate({
      kind,
      nodeId,
      prompt: input.prompt,
      model: input.model ?? "vincis-mock-v1",
      parameters:
        input.parameters ??
        (kind === "image"
          ? { aspectRatio: "1:1", resolution: "1024", outputs: 1 }
          : kind === "video"
            ? { aspectRatio: "auto", duration: 5, quality: "720p", audio: true, webSearch: false }
            : { duration: 30, instrumental: true }),
      reference: input.reference ?? null
    });
  }

  function regenerate(nodeId: string) {
    const node = useCanvasStore.getState().nodes.find((item) => item.id === nodeId);
    if (!node?.data.prompt) return;
    const kind =
      node.type === "video" ? "video" : node.type === "music" ? "music" : "image";
    generate(kind, { prompt: node.data.prompt });
  }

  return {
    upload,
    generate,
    regenerate,
    generationPending: generationMutation.isPending
  };
}
