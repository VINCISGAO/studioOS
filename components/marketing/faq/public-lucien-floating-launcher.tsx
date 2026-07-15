"use client";

import { LucienAvatar } from "@/components/ai-copilot/lucien-avatar";
import { useMarketingDocsLucien } from "@/components/marketing/docs/marketing-docs-lucien-context";
import { publicLucienCopy } from "@/lib/marketing/faq-copy";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

export function PublicLucienFloatingLauncher({
  locale,
  hidden = false
}: {
  locale: Locale;
  hidden?: boolean;
}) {
  const { openLucien } = useMarketingDocsLucien();
  const t = publicLucienCopy(locale);

  if (hidden) return null;

  return (
    <button
      type="button"
      onClick={openLucien}
      aria-label={t.inputPlaceholder}
      title={locale === "zh" ? "问问卢西恩" : "Ask Lucien"}
      className={cn(
        "fixed bottom-6 right-5 z-[200] flex h-12 w-12 items-center justify-center rounded-full",
        "bg-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] ring-1 ring-violet-100/90",
        "transition hover:scale-105 hover:shadow-[0_16px_32px_rgba(124,58,237,0.22)]",
        "sm:bottom-8 sm:right-8"
      )}
    >
      <LucienAvatar
        size="md"
        alt={locale === "zh" ? "卢西恩" : "Lucien"}
        className="pointer-events-none shadow-none ring-0"
      />
    </button>
  );
}
