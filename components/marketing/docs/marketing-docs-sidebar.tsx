"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { OpenMarketingLucienButton } from "@/components/marketing/docs/open-marketing-lucien-button";
import {
  marketingDocsNavText,
  type MarketingDocsNavKey
} from "@/lib/marketing/marketing-docs-nav";
import { MARKETING_SITE_NAV_ICONS } from "@/lib/marketing/marketing-site-nav-icons";
import { marketingSiteNavItems, marketingSiteNavHref } from "@/lib/marketing/marketing-site-nav";
import { marketingHomeHref } from "@/lib/marketing/localized-href";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

type MarketingDocsSidebarProps = {
  locale: Locale;
  active: MarketingDocsNavKey;
};

export function MarketingDocsSidebar({ locale, active }: MarketingDocsSidebarProps) {
  const t = marketingDocsNavText(locale);
  const links = marketingSiteNavItems(locale).map((item) => ({
    ...item,
    icon: MARKETING_SITE_NAV_ICONS[item.key]
  }));

  return (
    <aside className="hidden w-[248px] shrink-0 border-r border-zinc-200/80 bg-white md:sticky md:top-0 md:flex md:h-screen md:flex-col md:px-5 md:py-8">
      <Link href={marketingHomeHref.home(locale)} className="inline-flex items-center text-zinc-950">
        <BrandLogoLockup
          contrastOn="light"
          markClassName="h-7 w-7 rounded-lg"
          wordmarkClassName="h-[15px] w-[94px]"
        />
      </Link>

      <nav className="mt-10 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.key === active;
          return (
            <Link
              key={link.key}
              href={marketingSiteNavHref(link.key, locale)}
              className={cn(
                "flex items-start gap-3 rounded-xl px-3 py-2.5 transition",
                isActive
                  ? "border-l-2 border-violet-600 bg-violet-50 text-violet-900"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" strokeWidth={1.75} />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{link.label}</span>
                <span className="mt-0.5 block text-xs leading-5 text-zinc-500">{link.description}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-violet-100/80 bg-violet-50/60 p-4">
        <p className="text-sm font-semibold text-zinc-950">{t.aiHelpTitle}</p>
        <p className="mt-1 text-xs leading-5 text-zinc-600">{t.aiHelpBody}</p>
        <OpenMarketingLucienButton className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-full border border-violet-200 bg-white text-sm font-medium text-violet-700 transition hover:border-violet-300 hover:bg-violet-50">
          {t.aiHelpButton}
        </OpenMarketingLucienButton>
      </div>

      <div className="mt-8 border-t border-zinc-100 pt-6">
        <Link
          href={marketingHomeHref.home(locale)}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
        >
          <Home className="h-4 w-4" />
          {t.backHome}
        </Link>
      </div>
    </aside>
  );
}
