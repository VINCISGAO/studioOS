"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MarketingDocsLucienHost } from "@/components/marketing/docs/marketing-docs-lucien-host";
import { MarketingDocsMobileHeader } from "@/components/marketing/docs/marketing-docs-mobile-header";
import { MarketingDocsSidebar } from "@/components/marketing/docs/marketing-docs-sidebar";
import { MarketingDocsContentLoading } from "@/components/marketing/docs/marketing-docs-content-loading";
import { useMarketingPageLocale } from "@/hooks/use-marketing-page-locale";
import { resolveMarketingDocsActive } from "@/lib/marketing/resolve-marketing-docs-active";
import type { Locale } from "@/lib/i18n";

function MarketingDocsLayoutFrame({
  locale,
  active,
  children
}: {
  locale: Locale;
  active: ReturnType<typeof resolveMarketingDocsActive>;
  children: ReactNode;
}) {
  return (
    <MarketingDocsLucienHost locale={locale}>
      <div className="min-h-screen bg-[#f6f6f3]">
        <div className="flex w-full">
          <MarketingDocsSidebar locale={locale} active={active} />

          <div className="min-w-0 flex-1">
            <MarketingDocsMobileHeader locale={locale} active={active} />
            <main className="w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-8 xl:px-10">{children}</main>
          </div>
        </div>
      </div>
    </MarketingDocsLucienHost>
  );
}

function MarketingDocsLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const locale = useMarketingPageLocale();
  const active = resolveMarketingDocsActive(pathname);

  return (
    <MarketingDocsLayoutFrame locale={locale} active={active}>
      {children}
    </MarketingDocsLayoutFrame>
  );
}

/** Persistent docs chrome — sidebar stays mounted across client navigations. */
export function MarketingDocsLayoutShell({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <MarketingDocsLayoutFrame locale="zh" active="about">
          <MarketingDocsContentLoading />
        </MarketingDocsLayoutFrame>
      }
    >
      <MarketingDocsLayoutInner>{children}</MarketingDocsLayoutInner>
    </Suspense>
  );
}
