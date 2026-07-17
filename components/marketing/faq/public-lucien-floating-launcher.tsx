"use client";

import { LucienAvatar } from "@/components/ai-copilot/lucien-avatar";
import { useMarketingDocsLucien } from "@/components/marketing/docs/marketing-docs-lucien-context";
import { useFloatingLauncherDrag } from "@/hooks/use-floating-launcher-drag";
import { publicLucienCopy } from "@/lib/marketing/faq-copy";
import { cn } from "@/lib/utils";
import type { MarketingLocale } from "@/lib/i18n";
import { isChineseMarketingLocale } from "@/lib/marketing/i18n/resolve-marketing-copy";

export function PublicLucienFloatingLauncher({
  locale,
  hidden = false
}: {
  locale: MarketingLocale;
  hidden?: boolean;
}) {
  const { openLucien } = useMarketingDocsLucien();
  const t = publicLucienCopy(locale);
  const { buttonRef, launcherStyle, isLauncherDragging, startLauncherDrag, handleLauncherClick } =
    useFloatingLauncherDrag({ onTap: openLucien });

  if (hidden) return null;

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleLauncherClick}
      onPointerDown={startLauncherDrag}
      onDragStart={(event) => event.preventDefault()}
      style={launcherStyle}
      aria-label={t.inputPlaceholder}
      title={isChineseMarketingLocale(locale) ? "问问卢西恩" : "Ask Lucien"}
      className={cn(
        "fixed z-[200] flex h-12 w-12 touch-none select-none items-center justify-center rounded-full",
        "bg-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] ring-1 ring-violet-100/90",
        isLauncherDragging
          ? "cursor-grabbing transition-none"
          : "cursor-grab transition hover:scale-105 hover:shadow-[0_16px_32px_rgba(124,58,237,0.22)]"
      )}
    >
      <LucienAvatar
        size="md"
        alt={isChineseMarketingLocale(locale) ? "卢西恩" : "Lucien"}
        className="pointer-events-none shadow-none ring-0"
      />
    </button>
  );
}
