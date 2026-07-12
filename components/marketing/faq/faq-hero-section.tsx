import { MarketingDocsHero } from "@/components/marketing/docs/marketing-docs-hero";
import { faqText } from "@/lib/marketing/faq-copy";
import type { Locale } from "@/lib/i18n";

export function FaqHeroSection({ locale }: { locale: Locale }) {
  const t = faqText(locale);
  return <MarketingDocsHero eyebrow={t.hero.eyebrow} title={t.hero.title} subtitle={t.hero.subtitle} />;
}
