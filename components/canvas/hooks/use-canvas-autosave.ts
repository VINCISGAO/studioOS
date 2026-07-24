"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useCanvasStore } from "@/components/canvas/canvas-store";

type AutosaveResponse = {
  success: boolean;
  data?: { version: number; updatedAt: string };
  error?: { message?: string };
};

export function useCanvasAutosave() {
  const projectId = useCanvasStore((state) => state.projectId);
  const revision = useCanvasStore((state) => state.revision);
  const setSaveState = useCanvasStore((state) => state.setSaveState);
  const lastSavedRevision = useRef(0);

  const mutation = useMutation({
    mutationFn: async (_revision: number) => {
      const {
        projectId: currentProjectId,
        nodes,
        edges,
        viewport,
        canvasBackgroundColor
      } = useCanvasStore.getState();

      const response = await fetch("/api/canvas/autosave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: currentProjectId,
          nodes: nodes.map((node) => ({
            id: node.id,
            type: node.type,
            position: node.position,
            width: node.width ?? node.measured?.width,
            height: node.height ?? node.measured?.height,
            parentId: node.parentId,
            zIndex: node.zIndex,
            data: node.data
          })),
          edges: edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            data: edge.data
          })),
          viewport: {
            ...viewport,
            backgroundColor: canvasBackgroundColor
          }
        })
      });
      const payload = (await response.json()) as AutosaveResponse;
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Canvas autosave failed");
      }
      return payload.data;
    },
    onMutate: () => setSaveState("saving"),
    onSuccess: (_data, savedRevision) => {
      lastSavedRevision.current = Math.max(lastSavedRevision.current, savedRevision);
      setSaveState("saved");
    },
    onError: () => setSaveState("error")
  });

  useEffect(() => {
    if (!projectId || revision === 0 || revision <= lastSavedRevision.current) return;
    const timer = window.setTimeout(() => mutation.mutate(revision), 1000);
    return () => window.clearTimeout(timer);
  }, [projectId, revision, mutation]);
}
