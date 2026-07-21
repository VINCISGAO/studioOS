"use client";

import { useState } from "react";
import { Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type FeedbackRating = "HELPFUL" | "NOT_HELPFUL";

type FeedbackState = {
  rating: FeedbackRating;
  createdAt?: string;
  reason?: string | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string };
};

const copy = {
  zh: {
    helpful: "这条回复有帮助",
    notHelpful: "这条回复没有帮助",
    saved: "已记录反馈"
  },
  en: {
    helpful: "This reply was helpful",
    notHelpful: "This reply was not helpful",
    saved: "Feedback saved"
  }
} as const;

export function CanvasChatFeedback({
  locale,
  projectId,
  messageId,
  feedback,
  onFeedback
}: {
  locale: Locale;
  projectId: string;
  messageId: string;
  feedback: FeedbackState | null | undefined;
  onFeedback: (messageId: string, feedback: FeedbackState) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const labels = copy[locale];

  async function submit(rating: FeedbackRating) {
    if (feedback || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/canvas/chat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          messageId,
          rating,
          languageCode: locale === "zh" ? "zh-CN" : "en"
        })
      });
      const payload = (await response.json()) as ApiEnvelope<{
        messageId: string;
        feedback: FeedbackState;
      }>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "Feedback request failed");
      }
      onFeedback(messageId, payload.data.feedback);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Feedback request failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 border-t border-zinc-100 pt-2">
      <div className="flex items-center gap-2 text-zinc-400">
        <button
          type="button"
          disabled={saving || Boolean(feedback)}
          onClick={() => void submit("HELPFUL")}
          className={cn(
            "rounded-full p-1 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50",
            feedback?.rating === "HELPFUL" && "bg-emerald-50 text-emerald-600"
          )}
          aria-label={labels.helpful}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={saving || Boolean(feedback)}
          onClick={() => void submit("NOT_HELPFUL")}
          className={cn(
            "rounded-full p-1 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50",
            feedback?.rating === "NOT_HELPFUL" && "bg-rose-50 text-rose-600"
          )}
          aria-label={labels.notHelpful}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" /> : null}
        {feedback ? <span className="text-[10px] text-zinc-400">{labels.saved}</span> : null}
      </div>
      {error ? <p className="mt-1 text-[10px] text-rose-600">{error}</p> : null}
    </div>
  );
}
