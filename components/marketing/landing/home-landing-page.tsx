import { CinematicHomePage } from "@/components/marketing/cinematic/cinematic-home-page";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import type { Locale, MarketingLocale } from "@/lib/i18n";

/** Cinematic marketing homepage — login lives at /login only. */
export function HomeLandingPage({
  locale,
  copyLocale = locale,
  portalHref,
  portalLabel,
  heroVideoSrc,
  featuredWorks,
  isLoggedIn = false
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  portalHref: string;
  portalLabel: string;
  heroVideoSrc: string;
  featuredWorks: MarketingShowcaseWorkDto[];
  isLoggedIn?: boolean;
}) {
  return (
    <CinematicHomePage
      locale={locale}
      copyLocale={copyLocale}
      portalHref={portalHref}
      portalLabel={portalLabel}
      heroVideoSrc={heroVideoSrc}
      featuredWorks={featuredWorks}
      isLoggedIn={isLoggedIn}
    />
  );
}
