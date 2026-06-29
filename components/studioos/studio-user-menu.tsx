"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ChevronDown, LogOut, UserRound } from "lucide-react";

const copy = {
  en: {
    profile: "Studio profile",
    signOut: "Sign out"
  },
  zh: {
    profile: "编辑资料",
    signOut: "退出登录"
  }
};

export function StudioUserMenu({
  locale,
  initials,
  name,
  profileHref = "/studio/profile",
  roleLabel,
  profileMenuLabel
}: {
  locale: Locale;
  initials: string;
  name?: string;
  profileHref?: string;
  roleLabel?: string;
  profileMenuLabel?: string;
}) {
  const t = copy[locale];
  const profileLabel = profileMenuLabel ?? t.profile;
  const subtitle = roleLabel ?? "Studio";
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onPointerDown);
      return () => document.removeEventListener("mousedown", onPointerDown);
    }
  }, [open]);

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-2 transition hover:bg-zinc-50",
          open && "border-zinc-300 bg-zinc-50"
        )}
        onClick={() => setOpen((value) => !value)}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
          {initials.slice(0, 2)}
        </div>
        <ChevronDown className={cn("h-4 w-4 text-zinc-400 transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
        >
          {name ? (
            <div className="border-b border-zinc-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-zinc-900">{name}</p>
              <p className="text-xs text-zinc-500">{subtitle}</p>
            </div>
          ) : null}
          <div className="p-1">
            <Link
              href={withLocale(profileHref, locale)}
              role="menuitem"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
              onClick={() => setOpen(false)}
            >
              <UserRound className="h-4 w-4 text-zinc-400" />
              {profileLabel}
            </Link>
            <form action={signOutAction}>
              <input type="hidden" name="lang" value={locale} />
              <Button
                type="submit"
                role="menuitem"
                variant="ghost"
                className="h-auto w-full justify-start gap-2 rounded-lg px-3 py-2.5 text-sm font-normal text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
              >
                <LogOut className="h-4 w-4 text-zinc-400" />
                {t.signOut}
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
