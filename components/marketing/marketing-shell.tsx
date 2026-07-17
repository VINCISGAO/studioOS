import type { ReactNode } from "react";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { asMarketingLocale } from "@/lib/marketing/i18n/resolve-marketing-copy";

export async function MarketingShell({
  children,
  locale = "en",
  showFooter = true
}: {
  children: ReactNode;
  locale?: Locale | MarketingLocale;
  showFooter?: boolean;
}) {
  const marketingLocale = asMarketingLocale(locale);

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <MarketingHeader locale={marketingLocale} />
      {children}
      {showFooter ? <MarketingFooter locale={marketingLocale} /> : null}
    </div>
  );
}
