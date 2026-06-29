import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import type { Locale } from "@/lib/i18n";

export async function MarketingShell({
  children,
  locale = "en",
  showFooter = true
}: {
  children: React.ReactNode;
  locale?: Locale;
  showFooter?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <MarketingHeader locale={locale} />
      {children}
      {showFooter ? <MarketingFooter locale={locale} /> : null}
    </div>
  );
}
