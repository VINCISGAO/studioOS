"use client";

import { useEffect, useRef } from "react";

export type KnowledgeAutosaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export function useKnowledgeEditorAutosaveSafe(input: {
  enabled: boolean;
  delayMs?: number;
  snapshot: string;
  dirty: boolean;
  onSave: () => Promise<void>;
  onStateChange?: (state: KnowledgeAutosaveState) => void;
}) {
  const { enabled, delayMs = 2000, snapshot, dirty, onSave, onStateChange } = input;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);
  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  const abortRef = useRef(0);

  useEffect(() => {
    if (!enabled || !dirty) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    onStateChange?.("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (savingRef.current) {
        pendingRef.current = true;
        return;
      }
      const runId = abortRef.current + 1;
      abortRef.current = runId;
      savingRef.current = true;
      onStateChange?.("saving");
      void onSave()
        .then(() => {
          if (abortRef.current !== runId) return;
          onStateChange?.("saved");
        })
        .catch(() => {
          if (abortRef.current !== runId) return;
          onStateChange?.("error");
        })
        .finally(() => {
          if (abortRef.current !== runId) return;
          savingRef.current = false;
          if (pendingRef.current) {
            pendingRef.current = false;
            onStateChange?.("dirty");
          }
        });
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [delayMs, dirty, enabled, onSave, onStateChange, snapshot]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}
