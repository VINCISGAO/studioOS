"use client";

import { useEffect, useRef } from "react";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import { isTerminalGenerationJobStatus } from "@/lib/canvas/canvas-node-mutations";
import { MUSIC_NODE_LOADING_CARD } from "@/lib/canvas/music-node-design";
import { VIDEO_NODE_LOADING_CARD } from "@/lib/canvas/video-node-design";
import type { GenerationJobEvent, VincisCanvasNode } from "@/lib/canvas/types";
import { readViewportRect, spawnNodeAtViewportCenter } from "@/lib/canvas/viewport-anchor";

type ApiEnvelope = {
  success: boolean;
  data?: GenerationJobEvent[];
  error?: { message?: string };
};

const IMAGE_LOADING_CARD = { width: 320, height: 220 };

function loadingCardForJob(type: GenerationJobEvent["type"]) {
  if (type === "MUSIC") return MUSIC_NODE_LOADING_CARD;
  if (type === "VIDEO") return VIDEO_NODE_LOADING_CARD;
  return IMAGE_LOADING_CARD;
}

function isJobEvent(value: unknown): value is GenerationJobEvent {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.status === "string";
}

function buildMissingLoadingNode(job: GenerationJobEvent): VincisCanvasNode | null {
  if (!job.nodeId || isTerminalGenerationJobStatus(job.status)) return null;
  const state = useCanvasStore.getState();
  const card = loadingCardForJob(job.type);
  const viewport = state.viewport;
  const position = spawnNodeAtViewportCenter(viewport, readViewportRect(null), card);
  const isMusic = job.type === "MUSIC";

  return {
    id: job.nodeId,
    type: isMusic ? "music" : "loading",
    position,
    width: card.width,
    height: card.height,
    data: {
      title: job.type === "VIDEO" ? "视频生成中" : job.type === "MUSIC" ? "音乐生成中" : "图片生成中",
      prompt: "",
      status: "loading",
      progress: job.progress,
      generationType: job.type,
      jobId: job.id
    }
  };
}

export function useCanvasJobReconcile(projectId: string) {
  const applyJobEvent = useCanvasStore((state) => state.applyJobEvent);
  const addNode = useCanvasStore((state) => state.addNode);
  const reconciledProjectRef = useRef<string | null>(null);

  useEffect(() => {
    if (!projectId || reconciledProjectRef.current === projectId) return;
    reconciledProjectRef.current = projectId;

    let cancelled = false;

    const reconcile = async () => {
      try {
        const response = await fetch(
          `/api/canvas/${encodeURIComponent(projectId)}/generation-jobs`,
          { cache: "no-store" }
        );
        const payload = (await response.json()) as ApiEnvelope;
        if (cancelled || !response.ok || !payload.success || !Array.isArray(payload.data)) {
          return;
        }

        for (const item of payload.data.filter(isJobEvent)) {
          if (cancelled) return;
          const state = useCanvasStore.getState();
          const hasNode = item.nodeId
            ? state.nodes.some((node) => node.id === item.nodeId)
            : false;
          if (item.nodeId && !hasNode) {
            const restored = buildMissingLoadingNode(item);
            if (restored) addNode(restored);
          }
          applyJobEvent(item);
        }
      } catch {
        // Reconcile is best-effort; SSE continues afterward.
      }
    };

    void reconcile();

    return () => {
      cancelled = true;
    };
  }, [addNode, applyJobEvent, projectId]);
}
