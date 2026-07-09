import { CinematicHomePage } from "@/components/marketing/cinematic/cinematic-home-page";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import type { CreatorWork } from "@/lib/types";
import type { WorkEngagementSnapshot } from "@/lib/work-engagement-utils";

/** Cinematic marketing homepage — login lives at /login only. */
export function HomeLandingPage({
  locale,
  copyLocale = locale,
  portalHref,
  portalLabel,
  featuredWorks,
  engagement,
  isLoggedIn
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  portalHref: string;
  portalLabel: string;
  featuredWorks: CreatorWork[];
  engagement: Record<string, WorkEngagementSnapshot>;
  isLoggedIn: boolean;
}) {
  return (
    <CinematicHomePage
      locale={locale}
      copyLocale={copyLocale}
      portalHref={portalHref}
      portalLabel={portalLabel}
      featuredWorks={featuredWorks}
      engagement={engagement}
      isLoggedIn={isLoggedIn}
    />
  );
}
