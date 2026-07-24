"use client";

import { useEffect, useRef } from "react";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import { isTerminalGenerationJobStatus } from "@/lib/canvas/canvas-node-mutations";
import type { GenerationJobEvent } from "@/lib/canvas/types";

function isJobEvent(value: unknown): value is GenerationJobEvent {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.status === "string";
}

function isTerminalFailure(status: GenerationJobEvent["status"]) {
  return status === "FAILED" || status === "CANCELLED";
}

function terminalEventKey(event: GenerationJobEvent) {
  return `${event.id}:${event.status}`;
}

export function useGenerationEvents(
  projectId: string,
  options?: {
    onTerminalFailure?: (event: GenerationJobEvent) => void;
  }
) {
  const applyJobEvent = useCanvasStore((state) => state.applyJobEvent);
  const handledTerminalRef = useRef(new Set<string>());
  const handledFailuresRef = useRef(new Set<string>());
  const onTerminalFailureRef = useRef(options?.onTerminalFailure);

  useEffect(() => {
    onTerminalFailureRef.current = options?.onTerminalFailure;
  }, [options?.onTerminalFailure]);

  useEffect(() => {
    handledTerminalRef.current.clear();
    handledFailuresRef.current.clear();
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;

    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let watchTimer: ReturnType<typeof setInterval> | undefined;
    let closed = false;

    const scheduleReconnect = () => {
      if (closed) return;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 1200);
    };

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
            if (isTerminalGenerationJobStatus(item.status)) {
              const key = terminalEventKey(item);
              if (handledTerminalRef.current.has(key)) continue;
              handledTerminalRef.current.add(key);
            }

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
        scheduleReconnect();
      };
    };

    connect();
    watchTimer = setInterval(() => {
      if (closed) return;
      if (source?.readyState === EventSource.CLOSED) {
        scheduleReconnect();
      }
    }, 5000);

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (watchTimer) clearInterval(watchTimer);
      source?.close();
    };
  }, [applyJobEvent, projectId]);
}
