import { MarketingShell } from "@/components/marketing/marketing-shell";
import { HomePortfolioShowcase } from "@/components/home-portfolio-showcase";
import { getLocale, type SearchParams } from "@/lib/i18n";
import { getCurrentUserEmail } from "@/lib/session-user";
import { getWorksEngagement } from "@/lib/work-engagement-service";
import { getFeaturedWorks } from "@/lib/works-catalog";

export default async function CaseStudiesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const works = await getFeaturedWorks(9);
  const userEmail = await getCurrentUserEmail();
  const engagement = await getWorksEngagement(
    works.map((work) => work.id),
    userEmail
  );

  return (
    <MarketingShell locale={locale}>
      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-tight">{locale === "zh" ? "案例" : "Case studies"}</h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-500">
          {locale === "zh"
            ? "真实 Studio 交付的高转化广告样片。"
            : "High-performing ads delivered through VINCIS production studios."}
        </p>
        <div className="mt-12">
          <HomePortfolioShowcase
            locale={locale}
            works={works}
            engagement={engagement}
            isLoggedIn={Boolean(userEmail)}
          />
        </div>
      </main>
    </MarketingShell>
  );
}
