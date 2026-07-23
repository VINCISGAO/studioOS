"use client";

import { useCallback, useState } from "react";
import type { CanvasPromptEnhanceField } from "@/lib/canvas/prompt-enhance";
import type { Locale } from "@/lib/i18n";

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string };
};

const copy = {
  zh: {
    empty: "请先输入风格描述，再进行优化。",
    failed: "优化失败，请稍后重试。"
  },
  en: {
    empty: "Enter a style description before enhancing.",
    failed: "Enhancement failed. Please try again."
  }
} as const;

export function useCanvasPromptEnhance(projectId: string, locale: Locale) {
  const t = copy[locale];
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enhance = useCallback(
    async (field: CanvasPromptEnhanceField, text: string) => {
      const source = text.trim();
      if (!source) {
        setError(t.empty);
        return null;
      }

      setEnhancing(true);
      setError(null);

      try {
        const response = await fetch("/api/canvas/generation/enhance-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            field,
            text: source,
            languageCode: locale === "zh" ? "zh" : "en"
          })
        });

        const payload = (await response.json()) as ApiEnvelope<{ text: string }>;
        if (!response.ok || !payload.success || !payload.data?.text) {
          throw new Error(payload.error?.message ?? t.failed);
        }

        return payload.data.text;
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : t.failed);
        return null;
      } finally {
        setEnhancing(false);
      }
    },
    [locale, projectId, t.empty, t.failed]
  );

  return { enhance, enhancing, error, clearError: () => setError(null) };
}
