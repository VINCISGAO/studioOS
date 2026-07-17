"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { marketingSiteNavItems, marketingSiteNavHref } from "@/lib/marketing/marketing-site-nav";
import type { MarketingDocsNavKey } from "@/lib/marketing/marketing-docs-nav";
import type { MarketingLocale } from "@/lib/i18n";

type MarketingDocsMobileNavProps = {
  locale: MarketingLocale;
  active: MarketingDocsNavKey;
};

export function MarketingDocsMobileNav({ locale, active }: MarketingDocsMobileNavProps) {
  const navItems = marketingSiteNavItems(locale);
  const [open, setOpen] = useState(false);

  function linkClassName(isActive: boolean) {
    return isActive
      ? "block rounded-lg px-3 py-2 text-sm font-medium text-violet-700"
      : "block rounded-lg px-3 py-2 text-sm text-zinc-600";
  }

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
                href={marketingSiteNavHref(item.key, locale)}
                className={linkClassName(active === item.key)}
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
