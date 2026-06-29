"use client";

import { Suspense, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

function LoginLanguageSwitcherInner({ locale, compact }: { locale: Locale; compact?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const current =
    searchParams.get("lang") === "zh" || searchParams.get("lang") === "en"
      ? (searchParams.get("lang") as Locale)
      : locale;

  const switchTo = useCallback(
    (next: Locale) => {
      if (next === current) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("lang", next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      router.refresh();
    },
    [current, pathname, router, searchParams]
  );

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-lg border p-0.5 text-[11px] font-medium shadow-sm sm:gap-1 sm:p-1 sm:text-xs",
        compact ? "border-white/15 bg-black/20 backdrop-blur-sm" : "border-zinc-200/80 bg-white"
      )}
    >
      {(["en", "zh"] as const).map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={current === item}
          onClick={() => switchTo(item)}
          className={cn(
            "rounded-md px-2 py-1 transition-colors sm:px-3 sm:py-1.5",
            current === item
              ? compact
                ? "bg-white/95 text-zinc-900"
                : "bg-zinc-900 text-white"
              : compact
                ? "text-zinc-300 hover:text-white"
                : "text-zinc-500 hover:text-zinc-800"
          )}
        >
          {item === "en" ? "EN" : "中文"}
        </button>
      ))}
    </div>
  );
}

export function LoginLanguageSwitcher({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  return (
    <Suspense
      fallback={
        <div className="rounded-lg border border-zinc-200/80 bg-white p-1 text-xs font-medium shadow-sm">
          <span className="rounded-md bg-zinc-900 px-3 py-1.5 text-white">{locale === "zh" ? "中文" : "EN"}</span>
        </div>
      }
    >
      <LoginLanguageSwitcherInner locale={locale} compact={compact} />
    </Suspense>
  );
}
