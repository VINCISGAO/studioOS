"use client";

import { useEffect, useState } from "react";
import type { GenerationKind } from "@/lib/canvas/generation-ui";

type QuoteState = {
  credits: number;
  loading: boolean;
  error: string | null;
};

export function useGenerationCreditQuote(input: {
  kind: GenerationKind;
  model: string;
  parameters: Record<string, string | number | boolean>;
  enabled?: boolean;
}) {
  const [state, setState] = useState<QuoteState>({
    credits: 0,
    loading: false,
    error: null
  });

  useEffect(() => {
    if (input.enabled === false) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setState((current) => ({ ...current, loading: true, error: null }));
      void fetch("/api/v1/credits/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          type: input.kind.toUpperCase(),
          model: input.model,
          parameters: input.parameters
        })
      })
        .then(async (response) => {
          const payload = (await response.json()) as {
            success?: boolean;
            data?: { quote?: { credits?: number } };
            error?: { message?: string };
          };
          if (!response.ok || !payload.success || !payload.data?.quote?.credits) {
            throw new Error(payload.error?.message ?? "Quote failed");
          }
          setState({
            credits: payload.data.quote.credits,
            loading: false,
            error: null
          });
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          setState((current) => ({
            credits: current.credits,
            loading: false,
            error: error instanceof Error ? error.message : "Quote failed"
          }));
        });
    }, 80);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [input.enabled, input.kind, input.model, JSON.stringify(input.parameters)]);

  return state;
}
