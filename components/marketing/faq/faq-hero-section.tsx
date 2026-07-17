import { MarketingDocsHero } from "@/components/marketing/docs/marketing-docs-hero";
import { faqText } from "@/lib/marketing/faq-copy";
import type { MarketingLocale } from "@/lib/i18n";

export function FaqHeroSection({ locale }: { locale: MarketingLocale }) {
  const t = faqText(locale);
  return <MarketingDocsHero eyebrow={t.hero.eyebrow} title={t.hero.title} subtitle={t.hero.subtitle} />;
}
