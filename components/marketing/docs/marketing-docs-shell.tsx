import Link from "next/link";
import { Home } from "lucide-react";
import { BrandLogoLockup } from "@/components/brand-logo-mark";
import { MarketingDocsLucienHost } from "@/components/marketing/docs/marketing-docs-lucien-host";
import { MarketingDocsMobileNav } from "@/components/marketing/docs/marketing-docs-mobile-nav";
import { MarketingDocsSidebar } from "@/components/marketing/docs/marketing-docs-sidebar";
import { marketingDocsNavText, type MarketingDocsNavKey } from "@/lib/marketing/marketing-docs-nav";
import { marketingHomeHref } from "@/lib/marketing/localized-href";
import type { Locale } from "@/lib/i18n";

export function MarketingDocsShell({
  locale,
  active,
  children
}: {
  locale: Locale;
  active: MarketingDocsNavKey;
  children: React.ReactNode;
}) {
  const nav = marketingDocsNavText(locale);

  return (
    <MarketingDocsLucienHost locale={locale}>
      <div className="min-h-screen bg-[#f6f6f3]">
        <div className="flex w-full">
          <MarketingDocsSidebar locale={locale} active={active} />

          <div className="min-w-0 flex-1">
            <header className="flex items-center gap-3 border-b border-zinc-200/80 bg-white px-4 py-4 md:hidden">
              <Link href={marketingHomeHref.home(locale)} className="flex min-w-0 shrink-0 items-center text-zinc-950">
                <BrandLogoLockup
                  contrastOn="light"
                  markClassName="h-6 w-6 rounded-md sm:h-9 sm:w-9 sm:rounded-xl"
                  wordmarkClassName="h-[13px] w-[81px] sm:h-[21px] sm:w-[134px]"
                  priority
                />
              </Link>
              <div className="ml-auto flex items-center gap-2">
                <Link
                  href={marketingHomeHref.home(locale)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
                  aria-label={nav.backHome}
                  title={nav.backHome}
                >
                  <Home className="h-4 w-4" strokeWidth={1.75} />
                </Link>
                <MarketingDocsMobileNav locale={locale} active={active} />
              </div>
            </header>

            <main className="w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-8 xl:px-10">{children}</main>
          </div>
        </div>
      </div>
    </MarketingDocsLucienHost>
  );
}
