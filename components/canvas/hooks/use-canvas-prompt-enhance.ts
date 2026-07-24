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
    emptyStyle: "请先输入风格描述，再进行优化。",
    failed: "优化失败，请稍后重试。",
    inspireFailed: "AI 灵感生成失败，请稍后重试。"
  },
  en: {
    emptyStyle: "Enter a style description before enhancing.",
    failed: "Enhancement failed. Please try again.",
    inspireFailed: "AI inspiration failed. Please try again."
  }
} as const;

export function useCanvasPromptEnhance(projectId: string, locale: Locale) {
  const t = copy[locale];
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enhance = useCallback(
    async (field: CanvasPromptEnhanceField, text: string) => {
      const source = text.trim();
      if (field === "music_style" && !source) {
        setError(t.emptyStyle);
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
        const failedMessage = field === "video_prompt" ? t.inspireFailed : t.failed;
        if (!response.ok || !payload.success || !payload.data?.text) {
          throw new Error(payload.error?.message ?? failedMessage);
        }

        return payload.data.text;
      } catch (requestError) {
        const failedMessage =
          field === "video_prompt" ? t.inspireFailed : t.failed;
        setError(requestError instanceof Error ? requestError.message : failedMessage);
        return null;
      } finally {
        setEnhancing(false);
      }
    },
    [locale, projectId, t.emptyStyle, t.failed, t.inspireFailed]
  );

  return { enhance, enhancing, error, clearError: () => setError(null) };
}
