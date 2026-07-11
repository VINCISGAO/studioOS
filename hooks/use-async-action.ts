"use client";

import { useCallback, useState } from "react";
import type { ActionResult, AsyncFeedbackMessage } from "@/lib/ui/async-feedback";
import { feedbackFromResult } from "@/lib/ui/async-feedback";

export function useAsyncAction(input?: {
  okMessage?: string;
  errorMessage?: string;
  flashMs?: number;
}) {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<AsyncFeedbackMessage | null>(null);

  const run = useCallback(
    async (task: () => Promise<ActionResult | void>) => {
      setPending(true);
      setFeedback(null);
      try {
        const result = await task();
        const next = feedbackFromResult(
          result,
          input?.okMessage ?? "Saved.",
          input?.errorMessage ?? "Something went wrong. Try again."
        );
        if (next) {
          setFeedback(next);
          if (input?.flashMs !== 0) {
            window.setTimeout(() => setFeedback(null), input?.flashMs ?? 3200);
          }
        }
        return result;
      } catch {
        const message = input?.errorMessage ?? "Something went wrong. Try again.";
        setFeedback({ tone: "error", message });
        if (input?.flashMs !== 0) {
          window.setTimeout(() => setFeedback(null), input?.flashMs ?? 3200);
        }
        return { ok: false as const, error: message };
      } finally {
        setPending(false);
      }
    },
    [input?.errorMessage, input?.flashMs, input?.okMessage]
  );

  const clearFeedback = useCallback(() => setFeedback(null), []);

  return { pending, feedback, run, clearFeedback, setFeedback };
}
