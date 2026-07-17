import { MarketingDocsShell } from "@/components/marketing/docs/marketing-docs-shell";
import {
  ProcessHeroSection,
  ProcessHighlightsSection,
  ProcessStepsSection
} from "@/components/marketing/process/process-sections";
import type { MarketingLocale } from "@/lib/i18n";

export function ProcessPage({ locale }: { locale: MarketingLocale }) {
  return (
    <MarketingDocsShell locale={locale} active="process">
      <ProcessHeroSection locale={locale} />
      <ProcessHighlightsSection locale={locale} />
      <ProcessStepsSection locale={locale} />
    </MarketingDocsShell>
  );
}
