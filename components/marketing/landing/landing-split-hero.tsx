import { LandingAuthPanel } from "@/components/marketing/landing/landing-auth-panel";
import { LandingCosmicScene } from "@/components/marketing/landing/landing-cosmic-scene";
import type { Locale } from "@/lib/i18n";

export function LandingSplitHero({
  locale,
  isLoggedIn,
  portalHref,
  portalLabel
}: {
  locale: Locale;
  isLoggedIn: boolean;
  portalHref: string;
  portalLabel: string;
}) {
  return (
    <section className="landing-split-shell grid min-h-[100dvh] lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
      <LandingCosmicScene locale={locale} />
      <LandingAuthPanel
        locale={locale}
        isLoggedIn={isLoggedIn}
        portalHref={portalHref}
        portalLabel={portalLabel}
      />
    </section>
  );
}
