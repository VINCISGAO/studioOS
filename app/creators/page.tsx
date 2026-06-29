import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { CreatorsWorksShowcase } from "@/components/marketing/creators-works-showcase";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { creators as studioDirectory } from "@/lib/data";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getCurrentSession } from "@/lib/session-user";
import { getWorksEngagement } from "@/lib/work-engagement-service";
import { getAllCreatorWorks } from "@/lib/works-catalog";

const copy = {
  en: {
    eyebrow: "Studio portfolio",
    title: "Browse studios by real work — then enter Proposal Room.",
    subtitle:
      "Studios publish portfolio videos first. Brands compare style, category, platform, and turnaround before matching.",
    view: "View studio",
    trust: ["Portfolio-first studios", "Proposal Room before contract", "Deposit-backed production"]
  },
  zh: {
    eyebrow: "Studio 作品集",
    title: "先看真实作品，再进入 Proposal Room。",
    subtitle:
      "Studio 先发布作品集视频。Brand 按风格、品类、平台与交付周期筛选，匹配后再在平台内沟通方案。",
    view: "查看 Studio",
    trust: ["Studio 作品集优先", "Proposal Room 再签约", "保证金保障制作"]
  }
};

type CreatorsPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function CreatorsPage({ searchParams }: CreatorsPageProps) {
  const locale = getLocale(await searchParams);
  const t = copy[locale];
  const session = await getCurrentSession();
  const activeCreators = studioDirectory.filter((creator) => ["active", "approved"].includes(creator.status));
  const allWorks = await getAllCreatorWorks();
  const engagement = await getWorksEngagement(
    allWorks.map((work) => work.id),
    session?.email ?? null
  );

  return (
    <MarketingShell locale={locale}>
      <main className="bg-[#f6f6f3]">
        <section className="border-b">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.74fr_0.26fr] lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1.5 text-sm text-muted-foreground shadow-sm">
                <Sparkles className="h-4 w-4 text-foreground" />
                {t.eyebrow}
              </div>
              <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold leading-tight sm:text-6xl">
                {t.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">{t.subtitle}</p>
            </div>
            <Card className="bg-white shadow-luxe">
              <CardContent className="p-6">
                <ShieldCheck className="h-6 w-6" />
                <div className="mt-5 grid gap-3">
                  {t.trust.map((item) => (
                    <div key={item} className="border-t pt-3 text-sm font-medium text-muted-foreground">
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <CreatorsWorksShowcase
            locale={locale}
            works={allWorks}
            engagement={engagement}
            isLoggedIn={Boolean(session)}
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeCreators.map((creator) => (
              <Card key={creator.id} className="flex h-full flex-col bg-white shadow-none">
                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-semibold">{creator.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{creator.country}</p>
                    </div>
                    <Badge variant="success" className="shrink-0">
                      {creator.rating}
                    </Badge>
                  </div>
                  <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">{creator.headline}</p>
                  <Button asChild className="mt-5 h-9 w-full shrink-0" variant="outline">
                    <Link href={withLocale(`/creators/${creator.id}`, locale)}>
                      {t.view} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
