"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import {
  SUPPORTED_LANGUAGE_SEEDS,
  normalizeLanguageCode,
  type SupportedLanguageCode
} from "@/features/i18n/language.constants";
import { cn } from "@/lib/utils";
import type { LanguageCode, Locale } from "@/lib/i18n";

type LanguageSwitcherProps = {
  locale: Locale | LanguageCode;
  tone?: "light" | "dark";
  variant?: "default" | "icon";
  menuPlacement?: "bottom" | "top";
  /** @deprecated Read from the current URL on the client instead. */
  pathname?: string;
  /** @deprecated Read from the current URL on the client instead. */
  search?: string;
};

const publicLanguages = SUPPORTED_LANGUAGE_SEEDS.filter((item) => item.isEnabled);

function localeToLanguageCode(locale: Locale | LanguageCode): SupportedLanguageCode {
  if (locale !== "zh") return normalizeLanguageCode(locale);
  return locale === "zh" ? "zh-CN" : "en";
}

function activeLanguageCode(searchParams: URLSearchParams, fallback: Locale | LanguageCode): SupportedLanguageCode {
  const lang = searchParams.get("lang");
  return normalizeLanguageCode(lang ?? localeToLanguageCode(fallback));
}

function LanguageSwitcherInner({
  locale,
  tone = "light",
  variant = "default",
  menuPlacement = "bottom"
}: {
  locale: Locale | LanguageCode;
  tone?: "light" | "dark";
  variant?: "default" | "icon";
  menuPlacement?: "bottom" | "top";
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = activeLanguageCode(searchParams, locale);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const switchTo = useCallback(
    (next: SupportedLanguageCode) => {
      if (next === current) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("lang", next);
      const query = params.toString();
      setOpen(false);
      const target = query ? `${pathname}?${query}` : pathname;
      window.location.assign(target);
    },
    [current, pathname, searchParams]
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

  const isDark = tone === "dark";
  const isIcon = variant === "icon";
  const currentLanguage =
    publicLanguages.find((item) => item.code === current) ?? publicLanguages[0]!;

  return (
    <div
      ref={menuRef}
      className={cn(
        "relative text-sm font-medium",
        isDark ? "text-white" : "text-zinc-950"
      )}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={currentLanguage.nativeName}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "transition",
          isIcon
            ? cn(
                "flex h-11 w-11 items-center justify-center rounded-full border shadow-sm",
                isDark
                  ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
                  : "border-zinc-200 bg-white text-zinc-700 hover:text-zinc-950"
              )
            : cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold shadow-sm sm:h-10 sm:gap-2 sm:px-3.5",
                isDark
                  ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
                  : "border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50"
              )
        )}
      >
        <Globe2 className="h-4 w-4" strokeWidth={1.8} />
        {isIcon ? null : (
          <>
            <span>{currentLanguage.nativeName}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />
          </>
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute left-0 z-50 w-[260px] overflow-hidden rounded-2xl border p-2 shadow-xl",
            menuPlacement === "top" ? "bottom-full mb-3" : "top-full mt-3",
            isDark ? "border-white/10 bg-zinc-950/95 text-white" : "border-zinc-200 bg-white text-zinc-950"
          )}
        >
          {publicLanguages.map((item) => (
            <button
              key={item.code}
              type="button"
              role="menuitemradio"
              aria-checked={current === item.code}
              onClick={() => switchTo(item.code)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-[15px] transition",
                current === item.code
                  ? isDark
                    ? "bg-white/10"
                    : "bg-zinc-100"
                  : isDark
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

export function LanguageSwitcher({
  tone = "light",
  variant = "default",
  menuPlacement = "bottom",
  ...props
}: LanguageSwitcherProps) {
  return (
    <Suspense
      fallback={
        <LanguageSwitcherFallback locale={props.locale} tone={tone} variant={variant} />
      }
    >
      <LanguageSwitcherInner
        locale={props.locale}
        tone={tone}
        variant={variant}
        menuPlacement={menuPlacement}
      />
    </Suspense>
  );
}

export function LanguageSwitcherFallback({
  locale,
  tone = "light",
  variant = "default"
}: {
  locale: Locale | LanguageCode;
  tone?: "light" | "dark";
  variant?: "default" | "icon";
}) {
  const isDark = tone === "dark";
  const isIcon = variant === "icon";
  const current = publicLanguages.find((item) => item.code === localeToLanguageCode(locale)) ?? publicLanguages[0]!;

  return (
    <div className="relative text-sm font-medium">
      <span
        className={cn(
          isIcon
            ? cn(
                "flex h-11 w-11 items-center justify-center rounded-full border shadow-sm",
                isDark ? "border-white/15 bg-white/10 text-white" : "border-zinc-200 bg-white text-zinc-700"
              )
            : cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold shadow-sm sm:h-10 sm:gap-2 sm:px-3.5",
                isDark ? "border-white/15 bg-white/10 text-white" : "border-zinc-200 bg-white text-zinc-950"
              )
        )}
      >
        <Globe2 className="h-4 w-4" strokeWidth={1.8} />
        {isIcon ? null : (
          <>
            {current.nativeName}
            <ChevronDown className="h-3.5 w-3.5" />
          </>
        )}
      </span>
    </div>
  );
}
