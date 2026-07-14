import type { ReactNode } from "react";
import { MarketingDocsLucienHost } from "@/components/marketing/docs/marketing-docs-lucien-host";
import { MarketingDocsMobileHeader } from "@/components/marketing/docs/marketing-docs-mobile-header";
import { MarketingDocsSidebar } from "@/components/marketing/docs/marketing-docs-sidebar";
import type { MarketingDocsNavKey } from "@/lib/marketing/marketing-docs-nav";
import type { Locale } from "@/lib/i18n";

export function MarketingDocsShell({
  locale,
  active,
  children
}: {
  locale: Locale;
  active: MarketingDocsNavKey;
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
