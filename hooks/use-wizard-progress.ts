"use client";

import { useEffect, useState } from "react";
import type { WizardDraftState } from "@/lib/campaign/wizard-steps";

export function useWizardProgress(projectId: string | undefined, enabled = true) {
  const [draft, setDraft] = useState<WizardDraftState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!projectId || !enabled) return;

    const source = new EventSource(`/api/projects/${encodeURIComponent(projectId)}/wizard/stream`);

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type: string;
          draft?: WizardDraftState;
        };
        if (payload.type === "connected") {
          setConnected(true);
        }
        if (payload.type === "WizardProgress" && payload.draft) {
          setDraft(payload.draft);
        }
      } catch {
        // ignore malformed events
      }
    };

    source.onerror = () => {
      setConnected(false);
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, [projectId, enabled]);

  return { draft, connected };
}
