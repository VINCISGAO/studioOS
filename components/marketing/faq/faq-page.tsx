import { MarketingDocsShell } from "@/components/marketing/docs/marketing-docs-shell";
import { FaqPageView } from "@/components/marketing/faq/faq-page-view";
import type { Locale } from "@/lib/i18n";

export function FaqPage({ locale }: { locale: Locale }) {
  return (
    <MarketingDocsShell locale={locale} active="faq">
      <FaqPageView locale={locale} />
    </MarketingDocsShell>
  );
}
