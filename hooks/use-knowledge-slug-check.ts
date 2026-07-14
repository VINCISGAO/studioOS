"use client";

import { useCallback, useEffect, useState } from "react";

type SlugCheckStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function useKnowledgeSlugCheck(input: {
  slug: string;
  excludeArticleId?: string;
  enabled?: boolean;
}) {
  const [status, setStatus] = useState<SlugCheckStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [existingArticleId, setExistingArticleId] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!input.enabled || !input.slug.trim()) {
      setStatus("idle");
      setMessage(null);
      setExistingArticleId(null);
      return;
    }

    const controller = new AbortController();
    setStatus("checking");

    const timer = setTimeout(() => {
      const params = new URLSearchParams({ slug: input.slug });
      if (input.excludeArticleId) params.set("exclude_id", input.excludeArticleId);

      void fetch(`/api/admin/knowledge/check-slug?${params.toString()}`, {
        cache: "no-store",
        signal: controller.signal
      })
        .then(async (response) => {
          const body = (await response.json()) as {
            data?: {
              available?: boolean;
              reason?: string | null;
              existing_article_id?: string | null;
            };
          };
          const available = body.data?.available;
          const reason = body.data?.reason ?? null;
          const articleId = body.data?.existing_article_id ?? null;
          setExistingArticleId(articleId);

          if (available) {
            setStatus("available");
            setMessage(null);
            return;
          }
          if (reason?.includes("lowercase") || reason?.includes("Slug must")) {
            setStatus("invalid");
          } else {
            setStatus("taken");
          }
          setMessage(reason);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setStatus("idle");
          setMessage(null);
          setExistingArticleId(null);
        });
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [input.slug, input.excludeArticleId, input.enabled, revision]);

  return {
    status,
    message,
    existingArticleId,
    refresh,
    isBlocking: status === "taken" || status === "invalid"
  };
}
