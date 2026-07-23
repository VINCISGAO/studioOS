"use client";

import { useEffect, useRef } from "react";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import type { GenerationJobEvent } from "@/lib/canvas/types";

function isJobEvent(value: unknown): value is GenerationJobEvent {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.status === "string";
}

function isTerminalFailure(status: GenerationJobEvent["status"]) {
  return status === "FAILED" || status === "CANCELLED";
}

export function useGenerationEvents(
  projectId: string,
  options?: {
    onTerminalFailure?: (event: GenerationJobEvent) => void;
  }
) {
  const applyJobEvent = useCanvasStore((state) => state.applyJobEvent);
  const handledFailuresRef = useRef(new Set<string>());
  const onTerminalFailureRef = useRef(options?.onTerminalFailure);

  useEffect(() => {
    onTerminalFailureRef.current = options?.onTerminalFailure;
  }, [options?.onTerminalFailure]);

  useEffect(() => {
    handledFailuresRef.current.clear();
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;

    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let closed = false;

    const connect = () => {
      if (closed) return;
      source?.close();
      source = new EventSource(
        `/api/events/generation?projectId=${encodeURIComponent(projectId)}`
      );

      const onJobs = (event: MessageEvent<string>) => {
        try {
          const payload: unknown = JSON.parse(event.data);
          if (!Array.isArray(payload)) return;

          for (const item of payload.filter(isJobEvent)) {
            applyJobEvent(item);

            if (!isTerminalFailure(item.status)) continue;
            if (handledFailuresRef.current.has(item.id)) continue;
            handledFailuresRef.current.add(item.id);
            onTerminalFailureRef.current?.(item);
          }
        } catch {
          // Ignore malformed SSE payloads.
        }
      };

      source.addEventListener("jobs", onJobs as EventListener);
      source.onerror = () => {
        source?.close();
        if (!closed) {
          reconnectTimer = setTimeout(connect, 1200);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      source?.close();
    };
  }, [applyJobEvent, projectId]);
}
