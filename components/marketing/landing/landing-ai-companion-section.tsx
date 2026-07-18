import { LandingAiCompanionVideoSlot } from "@/components/marketing/landing/landing-ai-companion-video-slot";
import { landingText } from "@/lib/marketing/landing-copy";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { asMarketingLocale } from "@/lib/marketing/i18n/resolve-marketing-copy";

/** Dark companion video band — sits between cost stats and how-it-works. */
export function LandingAiCompanionSection({
  copyLocale = "en",
  companionVideoSrc = ""
}: {
  copyLocale?: Locale | MarketingLocale;
  companionVideoSrc?: string;
}) {
  const t = landingText("aiCompanion", copyLocale);
  const marketingLocale = asMarketingLocale(String(copyLocale));

  return (
    <LandingAiCompanionVideoSlot
      locale={marketingLocale}
      videoSrc={companionVideoSrc}
      placeholderLabel={t.videoPlaceholder}
      sectionTitle={t.title}
      tone="dark"
    />
  );
}
