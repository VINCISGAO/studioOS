"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import {
  SUPPORTED_LANGUAGE_SEEDS,
  normalizeLanguageCode,
  type SupportedLanguageCode
} from "@/features/i18n/language.constants";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

const loginLanguages = SUPPORTED_LANGUAGE_SEEDS.filter((item) => item.isEnabled);

function localeToLanguageCode(locale: Locale): SupportedLanguageCode {
  return locale === "zh" ? "zh-CN" : "en";
}

function LoginLanguageSwitcherInner({ locale, compact }: { locale: Locale; compact?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const current = normalizeLanguageCode(searchParams.get("lang") ?? localeToLanguageCode(locale));

  const switchTo = useCallback(
    (next: SupportedLanguageCode) => {
      if (next === current) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("lang", next);
      const query = params.toString();
      setOpen(false);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      router.refresh();
    },
    [current, pathname, router, searchParams]
  );

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const currentLanguage = loginLanguages.find((item) => item.code === current) ?? loginLanguages[0]!;

  return (
    <div
      ref={menuRef}
      className={cn(
        "relative text-sm font-medium",
        compact ? "text-white" : "text-zinc-950"
      )}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-2xl border px-3.5 text-sm font-semibold shadow-sm transition sm:h-11 sm:px-4 sm:text-base",
          compact
            ? "border-white/15 bg-black/20 text-white backdrop-blur-sm hover:bg-black/30"
            : "border-zinc-200/80 bg-white text-zinc-950 hover:bg-zinc-50"
        )}
      >
        <Globe2 className="h-4 w-4 sm:h-5 sm:w-5" />
        <span>{currentLanguage.nativeName}</span>
        <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute left-0 top-full z-50 mt-3 w-[260px] overflow-hidden rounded-2xl border p-2 shadow-xl",
            compact ? "border-white/10 bg-zinc-950/95 text-white" : "border-zinc-200 bg-white text-zinc-950"
          )}
        >
          {loginLanguages.map((item) => (
            <button
              key={item.code}
              type="button"
              role="menuitemradio"
              aria-checked={current === item.code}
              onClick={() => switchTo(item.code)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-[15px] transition",
                current === item.code
                  ? compact
                    ? "bg-white/10"
                    : "bg-zinc-100"
                  : compact
                    ? "hover:bg-white/5"
                    : "hover:bg-zinc-50"
              )}
            >
              <span>{item.nativeName}</span>
              {current === item.code ? <Check className="h-4 w-4" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LoginLanguageSwitcher({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-zinc-200/80 bg-white px-4 py-2 text-sm font-semibold shadow-sm">
          <span>{locale === "zh" ? "简体中文" : "English"}</span>
        </div>
      }
    >
      <LoginLanguageSwitcherInner locale={locale} compact={compact} />
    </Suspense>
  );
}
