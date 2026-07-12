"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { adminChrome } from "@/lib/studioos/admin-copy";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { cn } from "@/lib/utils";
import { PortalAccountAvatar } from "@/components/studioos/portal-account-avatar";
import { adminSignOutAction } from "@/app/actions";
import { ChevronDown, LogOut, Settings } from "lucide-react";

const copy = {
  en: { settings: "Security settings", signOut: "Sign out" },
  zh: { settings: "安全设置", signOut: "退出登录" }
} as const;

function SignOutButton({ locale, label }: { locale: Locale; label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      disabled={pending}
      className="h-auto w-full justify-start gap-2 rounded-lg px-3 py-2.5 text-sm font-normal text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
    >
      <LogOut className="h-4 w-4 text-zinc-400" />
      {label}
    </Button>
  );
}

export function AdminPortalAccountMenu({
  locale,
  initials,
  name,
  email
}: {
  locale: Locale;
  initials: string;
  name: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const chrome = adminChrome(locale);
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
            <p className="truncate text-xs text-zinc-500">{email}</p>
            <p className="mt-1 text-xs text-violet-600">{chrome.roleSuperAdmin}</p>
          </div>
          <div className="p-1">
            <a
              href={withLocale(adminPortalRoutes.settings, locale)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
              onClick={() => setOpen(false)}
            >
              <Settings className="h-4 w-4 text-zinc-400" />
              {t.settings}
            </a>
            <form action={adminSignOutAction}>
              <input type="hidden" name="lang" value={locale} />
              <SignOutButton locale={locale} label={t.signOut} />
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
          "flex w-full items-center gap-3 rounded-xl bg-violet-50/70 px-3 py-3 text-left transition hover:bg-violet-50",
          open && "bg-violet-50"
        )}
      >
        <PortalAccountAvatar initials={initials} accent="violet" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900">{name}</p>
          <p className="truncate text-xs text-violet-700">{chrome.roleAdmin}</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-zinc-400 transition", open && "rotate-180")} />
      </button>
    </div>
  );
}
