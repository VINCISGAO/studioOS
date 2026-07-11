"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { buildLocalizedHref } from "@/lib/marketing/localized-href";
import { marketingSiteNavItems } from "@/lib/marketing/marketing-site-nav";
import type { MarketingDocsNavKey } from "@/lib/marketing/marketing-docs-nav";
import type { Locale } from "@/lib/i18n";

type MarketingDocsMobileNavProps = {
  locale: Locale;
  active: MarketingDocsNavKey;
};

function buildNavItems(locale: Locale) {
  return marketingSiteNavItems(locale);
}

function cnNav(active: boolean) {
  return active
    ? "block rounded-lg px-3 py-2 text-sm font-medium text-violet-700"
    : "block rounded-lg px-3 py-2 text-sm text-zinc-600";
}

export function MarketingDocsMobileNav({ locale, active }: MarketingDocsMobileNavProps) {
  const navItems = buildNavItems(locale);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={buildLocalizedHref(item.path, locale)}
                className={cnNav(active === item.key)}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </>
      ) : null}
    </div>
  );
}
