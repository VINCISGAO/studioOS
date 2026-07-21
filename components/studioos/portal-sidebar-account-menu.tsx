"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { PortalAccountAvatar } from "@/components/studioos/portal-account-avatar";
import { ChevronDown, LogOut, UserRound } from "lucide-react";

const copy = {
  en: {
    profile: "Edit profile",
    signOut: "Sign out"
  },
  zh: {
    profile: "编辑主页",
    signOut: "退出登录"
  }
};

export function PortalSidebarAccountMenu({
  locale,
  initials,
  avatarUrl,
  name,
  roleLabel,
  profileHref,
  accent = "zinc",
  imageFit = "photo"
}: {
  locale: Locale;
  initials: string;
  avatarUrl?: string;
  name: string;
  roleLabel: string;
  profileHref: string;
  accent?: "zinc" | "violet" | "indigo";
  imageFit?: "photo" | "mark";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = copy[locale];

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onPointerDown);
      return () => document.removeEventListener("mousedown", onPointerDown);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {open ? (
        <div className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-zinc-900">{name}</p>
            <p className="text-xs text-zinc-500">{roleLabel}</p>
          </div>
          <div className="p-1">
            <Link
              href={withLocale(profileHref, locale)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
              onClick={() => setOpen(false)}
            >
              <UserRound className="h-4 w-4 text-zinc-400" />
              {t.profile}
            </Link>
            <form action="/auth/sign-out" method="post">
              <input type="hidden" name="lang" value={locale} />
              <Button
                type="submit"
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

      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl bg-zinc-50 px-3 py-3 text-left transition hover:bg-zinc-100",
          open && "bg-zinc-100"
        )}
      >
        <PortalAccountAvatar initials={initials} avatarUrl={avatarUrl} accent={accent} imageFit={imageFit} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900">{name}</p>
          <p className="truncate text-xs text-zinc-500">{roleLabel}</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-zinc-400 transition", open && "rotate-180")} />
      </button>
    </div>
  );
}
