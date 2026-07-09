"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import {
  SUPPORTED_LANGUAGE_SEEDS,
  normalizeLanguageCode,
  type SupportedLanguageCode
} from "@/features/i18n/language.constants";
import { readStoredAppLanguage, setAppLanguage } from "@/lib/app-language-client";
import { isHomepageLangPath } from "@/lib/app-language.shared";
import { cn } from "@/lib/utils";
import type { LanguageCode, Locale } from "@/lib/i18n";

type LanguageSwitcherProps = {
  locale: Locale | LanguageCode;
  tone?: "light" | "dark";
  variant?: "default" | "icon";
  menuPlacement?: "bottom" | "top";
  navPill?: boolean;
};

const publicLanguages = SUPPORTED_LANGUAGE_SEEDS.filter((item) => item.isEnabled);

function localeToLanguageCode(locale: Locale | LanguageCode): SupportedLanguageCode {
  return locale === "zh" ? "zh-CN" : normalizeLanguageCode(locale);
}

function LanguageSwitcherInner({
  locale,
  tone = "light",
  variant = "default",
  menuPlacement = "bottom",
  navPill = false
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlLang = searchParams.get("lang");
  const fallbackCode = localeToLanguageCode(locale);
  const [storedLang, setStoredLang] = useState<SupportedLanguageCode | null>(null);

  useEffect(() => {
    setStoredLang(readStoredAppLanguage());
  }, []);

  const current = normalizeLanguageCode(urlLang ?? storedLang ?? fallbackCode);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const switchTo = useCallback(
    (next: SupportedLanguageCode) => {
      if (next === current) return;
      setAppLanguage(next);
      setOpen(false);
      if (isHomepageLangPath(pathname)) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lang", next);
        const query = params.toString();
        window.location.assign(query ? `${pathname}?${query}` : pathname);
        return;
      }
      window.location.assign(`/?lang=${next}`);
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
                "inline-flex h-9 items-center gap-1.5 border px-3 text-sm font-semibold shadow-sm sm:h-10 sm:gap-2 sm:px-3.5",
                navPill ? "rounded-full" : "rounded-xl",
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
  navPill = false,
  ...props
}: LanguageSwitcherProps) {
  return (
    <Suspense
      fallback={
        <LanguageSwitcherFallback locale={props.locale} tone={tone} variant={variant} navPill={navPill} />
      }
    >
      <LanguageSwitcherInner
        locale={props.locale}
        tone={tone}
        variant={variant}
        menuPlacement={menuPlacement}
        navPill={navPill}
      />
    </Suspense>
  );
}

export function LanguageSwitcherFallback({
  locale,
  tone = "light",
  variant = "default",
  navPill = false
}: {
  locale: Locale | LanguageCode;
  tone?: "light" | "dark";
  variant?: "default" | "icon";
  navPill?: boolean;
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
                "inline-flex h-9 items-center gap-1.5 border px-3 text-sm font-semibold shadow-sm sm:h-10 sm:gap-2 sm:px-3.5",
                navPill ? "rounded-full" : "rounded-xl",
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
