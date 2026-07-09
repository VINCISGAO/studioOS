import { HomeLandingPage } from "@/components/marketing/landing/home-landing-page";
import { getAppLanguage } from "@/lib/app-language";
import { toUiLocale } from "@/lib/app-language.shared";
import { loadHomeShowcaseWorks } from "@/lib/marketing/home-showcase-works";
import { getLanguageCode, type SearchParams } from "@/lib/i18n";
import { resolveHomeHeroVideoPlaybackSrc } from "@/lib/marketing/home-hero-video-sources";

type HomePageProps = {
  searchParams: Promise<SearchParams>;
};

/** Marketing homepage — presentation and conversion only. */
export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const copyLocale = resolvedSearchParams.lang
    ? getLanguageCode(resolvedSearchParams)
    : await getAppLanguage();
  const locale = toUiLocale(copyLocale);
  const heroVideoSrc = resolveHomeHeroVideoPlaybackSrc(copyLocale);
  const featuredWorks = await loadHomeShowcaseWorks();

  return (
    <HomeLandingPage
      locale={locale}
      copyLocale={copyLocale}
      heroVideoSrc={heroVideoSrc}
      featuredWorks={featuredWorks}
    />
  );
}
