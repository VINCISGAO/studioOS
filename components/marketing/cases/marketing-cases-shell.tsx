"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { MarketingDocsLucienHost } from "@/components/marketing/docs/marketing-docs-lucien-host";
import { marketingHomeHref } from "@/lib/marketing/localized-href";
import type { Locale } from "@/lib/i18n";

export function MarketingCasesShell({
  locale,
  backLabel,
  children
}: {
  locale: Locale;
  backLabel: string;
  children: React.ReactNode;
}) {
  return (
    <MarketingDocsLucienHost key={locale} locale={locale}>
      <div className="min-h-screen bg-[linear-gradient(180deg,#FAFAFA_0%,#F5F5F5_100%)]">
        <header className="border-b border-zinc-200/80 bg-white">
          <div className="marketing-content-shell flex min-h-[4.25rem] items-center justify-between gap-3 px-3 py-3 sm:min-h-16">
            <Link href={marketingHomeHref.home(locale)} className="flex min-w-0 items-center text-zinc-950">
              <BrandLogoLockup
                contrastOn="light"
                markClassName="h-6 w-6 rounded-md sm:h-9 sm:w-9 sm:rounded-xl"
                wordmarkClassName="h-[13px] w-[81px] sm:h-[21px] sm:w-[134px]"
                priority
              />
            </Link>
            <Link
              href={marketingHomeHref.home(locale)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 sm:h-10 sm:gap-2 sm:px-4"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span>{backLabel}</span>
            </Link>
          </div>
        </header>

        <main className="marketing-content-shell w-full py-8 sm:py-10 lg:py-8">{children}</main>
      </div>
    </MarketingDocsLucienHost>
  );
}
