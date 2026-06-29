"use client";

import { Suspense, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

type LanguageSwitcherProps = {
  locale: Locale;
  tone?: "light" | "dark";
  /** @deprecated Read from the current URL on the client instead. */
  pathname?: string;
  /** @deprecated Read from the current URL on the client instead. */
  search?: string;
};

function activeLocale(searchParams: URLSearchParams, fallback: Locale): Locale {
  const lang = searchParams.get("lang");
  return lang === "zh" || lang === "en" ? lang : fallback;
}

function LanguageSwitcherInner({ locale, tone = "light" }: { locale: Locale; tone?: "light" | "dark" }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const current = activeLocale(searchParams, locale);

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

  const isDark = tone === "dark";

  return (
    <div
      className={cn(
        "flex h-9 items-center gap-1 rounded-md border p-1 text-xs font-medium backdrop-blur",
        isDark ? "border-white/15 bg-white/5 shadow-none" : "border bg-white/80 shadow-sm"
      )}
    >
      <Globe2 className={cn("ml-1 h-3.5 w-3.5", isDark ? "text-zinc-400" : "text-muted-foreground")} />
      {(["en", "zh"] as const).map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={current === item}
          onClick={() => switchTo(item)}
          className={cn(
            "rounded px-2.5 py-1.5 transition-colors",
            current === item
              ? isDark
                ? "bg-white text-zinc-950 shadow-sm"
                : "bg-primary text-primary-foreground shadow-sm"
              : isDark
                ? "text-zinc-400 hover:text-white"
                : "text-muted-foreground hover:text-foreground"
          )}
        >
          {item === "en" ? "EN" : "中文"}
        </button>
      ))}
    </div>
  );
}

export function LanguageSwitcher({ tone = "light", ...props }: LanguageSwitcherProps) {
  return (
    <Suspense fallback={<LanguageSwitcherFallback locale={props.locale} tone={tone} />}>
      <LanguageSwitcherInner locale={props.locale} tone={tone} />
    </Suspense>
  );
}

export function LanguageSwitcherFallback({
  locale,
  tone = "light"
}: {
  locale: Locale;
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";

  return (
    <div
      className={cn(
        "flex h-9 items-center gap-1 rounded-md border p-1 text-xs font-medium backdrop-blur",
        isDark ? "border-white/15 bg-white/5 shadow-none" : "border bg-white/80 shadow-sm"
      )}
    >
      <Globe2 className={cn("ml-1 h-3.5 w-3.5", isDark ? "text-zinc-400" : "text-muted-foreground")} />
      {(["en", "zh"] as const).map((item) => (
        <span
          key={item}
          className={cn(
            "rounded px-2.5 py-1.5",
            locale === item
              ? isDark
                ? "bg-white text-zinc-950 shadow-sm"
                : "bg-primary text-primary-foreground shadow-sm"
              : isDark
                ? "text-zinc-400"
                : "text-muted-foreground"
          )}
        >
          {item === "en" ? "EN" : "中文"}
        </span>
      ))}
    </div>
  );
}
