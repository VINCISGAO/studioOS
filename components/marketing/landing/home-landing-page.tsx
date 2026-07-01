import { CinematicHomePage } from "@/components/marketing/cinematic/cinematic-home-page";
import type { Locale } from "@/lib/i18n";
import type { CreatorWork } from "@/lib/types";
import type { WorkEngagementSnapshot } from "@/lib/work-engagement-utils";

/** Cinematic marketing homepage — login lives at /login only. */
export function HomeLandingPage({
  locale,
  workspaceCta,
  featuredWorks,
  engagement,
  isLoggedIn
}: {
  locale: Locale;
  workspaceCta?: { href: string; label: string } | null;
  featuredWorks: CreatorWork[];
  engagement: Record<string, WorkEngagementSnapshot>;
  isLoggedIn: boolean;
}) {
  return (
    <CinematicHomePage
      locale={locale}
      workspaceCta={workspaceCta}
      featuredWorks={featuredWorks}
      engagement={engagement}
      isLoggedIn={isLoggedIn}
    />
  );
}
