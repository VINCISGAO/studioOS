"use client";

import { useEffect, useRef } from "react";

export function useKnowledgeEditorAutosave(input: {
  enabled: boolean;
  delayMs?: number;
  snapshot: string;
  onSave: () => Promise<void>;
}) {
  const { enabled, delayMs = 2000, snapshot, onSave } = input;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (savingRef.current) return;
      savingRef.current = true;
      void onSave().finally(() => {
        savingRef.current = false;
      });
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, delayMs, snapshot, onSave]);
}
