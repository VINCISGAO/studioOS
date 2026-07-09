import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";
import { CreatorsShowcaseGallery } from "@/components/marketing/creators-showcase-gallery";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Card, CardContent } from "@/components/ui/card";
import { marketingShowcaseService } from "@/features/marketing-showcase/marketing-showcase.service";
import { getLocale, type SearchParams } from "@/lib/i18n";
import { buildLocalizedHref } from "@/lib/marketing/localized-href";

const copy = {
  en: {
    eyebrow: "Back to home",
    title: "Works speak for themselves.",
    subtitle: "Official showcase videos by category — search, play, and fullscreen.",
    trust: ["Portfolio-first studios", "Proposal Room before contract", "Deposit-backed production"]
  },
  zh: {
    eyebrow: "返回首页",
    title: "作品自己会说话。",
    subtitle: "官方精选案例视频，按品类浏览，支持搜索、放大播放与暂停。",
    trust: ["Studio 作品集优先", "Proposal Room 再签约", "保证金保障制作"]
  }
};

type CreatorsPageProps = {
  searchParams: Promise<SearchParams & { play?: string }>;
};

export default async function CreatorsPage({ searchParams }: CreatorsPageProps) {
  const params = await searchParams;
  const locale = getLocale(params);
  const t = copy[locale];
  const initialPlayId = typeof params.play === "string" ? params.play : undefined;
  const [works, categories] = await Promise.all([
    marketingShowcaseService.listPublished(),
    marketingShowcaseService.listCategories()
  ]);

  return (
    <MarketingShell locale={locale}>
      <main className="bg-[#f6f6f3]">
        <section className="border-b">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.74fr_0.26fr] lg:px-8">
            <div>
              <Link
                href={buildLocalizedHref("/", locale)}
                className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1.5 text-sm text-muted-foreground shadow-sm transition hover:border-zinc-300 hover:text-zinc-900"
              >
                <Sparkles className="h-4 w-4 text-foreground" />
                {t.eyebrow}
              </Link>
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
          <CreatorsShowcaseGallery
            locale={locale}
            works={works}
            categories={categories}
            initialPlayId={initialPlayId}
          />
        </section>
      </main>
    </MarketingShell>
  );
}
