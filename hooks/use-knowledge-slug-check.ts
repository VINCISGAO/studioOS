"use client";

import { useEffect, useState } from "react";

export function useKnowledgeSlugCheck(input: {
  slug: string;
  excludeArticleId?: string;
  enabled?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!input.enabled || !input.slug.trim()) {
      setStatus("idle");
      setMessage(null);
      return;
    }

    setStatus("checking");
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ slug: input.slug });
      if (input.excludeArticleId) params.set("exclude_id", input.excludeArticleId);
      void fetch(`/api/admin/knowledge/check-slug?${params.toString()}`, { cache: "no-store" })
        .then(async (response) => {
          const body = (await response.json()) as {
            data?: { available?: boolean; reason?: string | null };
          };
          const available = body.data?.available;
          const reason = body.data?.reason ?? null;
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
          setStatus("idle");
          setMessage(null);
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [input.slug, input.excludeArticleId, input.enabled]);

  return { status, message, isBlocking: status === "taken" || status === "invalid" };
}
