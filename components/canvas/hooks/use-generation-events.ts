"use client";

import { useEffect } from "react";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import type { GenerationJobEvent } from "@/lib/canvas/types";

function isJobEvent(value: unknown): value is GenerationJobEvent {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.status === "string";
}

export function useGenerationEvents(projectId: string) {
  const applyJobEvent = useCanvasStore((state) => state.applyJobEvent);

  useEffect(() => {
    if (!projectId) return;
    const source = new EventSource(
      `/api/events/generation?projectId=${encodeURIComponent(projectId)}`
    );

    const onJobs = (event: MessageEvent<string>) => {
      try {
        const payload: unknown = JSON.parse(event.data);
        if (Array.isArray(payload)) {
          payload.filter(isJobEvent).forEach(applyJobEvent);
        }
      } catch {
        // A malformed event is ignored; EventSource will continue receiving updates.
      }
    };

    source.addEventListener("jobs", onJobs as EventListener);
    return () => {
      source.removeEventListener("jobs", onJobs as EventListener);
      source.close();
    };
  }, [applyJobEvent, projectId]);
}
