import { HomePageJsonLd } from "@/components/marketing/homepage-json-ld";
import { HomeLandingPage } from "@/components/marketing/landing/home-landing-page";
import { getAppLanguage } from "@/lib/app-language";
import { toUiLocale } from "@/lib/app-language.shared";
import { loadHomeShowcaseWorks } from "@/lib/marketing/home-showcase-works";
import { homePageSeoMetadata } from "@/lib/marketing/marketing-seo-metadata";
import { getLanguageCode, type SearchParams } from "@/lib/i18n";
import { resolveHomeHeroVideoPlaybackSrc } from "@/lib/marketing/home-hero-video-sources";
import type { Metadata } from "next";

export const revalidate = 300;

type HomePageProps = {
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const copyLocale = resolvedSearchParams.lang ? getLanguageCode(resolvedSearchParams) : await getAppLanguage();
  return homePageSeoMetadata(toUiLocale(copyLocale));
}

/** Marketing homepage — presentation and conversion only. */
export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;

  const [copyLocale, featuredWorks] = await Promise.all([
    resolvedSearchParams.lang ? getLanguageCode(resolvedSearchParams) : getAppLanguage(),
    loadHomeShowcaseWorks()
  ]);

  const locale = toUiLocale(copyLocale);
  const heroVideoSrc = resolveHomeHeroVideoPlaybackSrc(copyLocale);

  return (
    <>
      <HomePageJsonLd />
      <HomeLandingPage
        locale={locale}
        copyLocale={copyLocale}
        heroVideoSrc={heroVideoSrc}
        featuredWorks={featuredWorks}
        hydratePortalSession
      />
    </>
  );
}
