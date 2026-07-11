import { CreatorsShowcaseGallery } from "@/components/marketing/creators-showcase-gallery";
import { MarketingDocsShell } from "@/components/marketing/docs/marketing-docs-shell";
import { marketingShowcaseService } from "@/features/marketing-showcase/marketing-showcase.service";
import { getLocale, type SearchParams } from "@/lib/i18n";

export const revalidate = 3600;

const copy = {
  zh: {
    eyebrow: "成功案例",
    title: "作品自己会说话。",
    subtitle: "精选真实案例视频，按品类浏览，快速了解 VINCIS 可以帮助品牌完成怎样的广告作品。"
  },
  en: {
    eyebrow: "Case studies",
    title: "Works speak for themselves.",
    subtitle: "Browse selected showcase videos by category and see what VINCIS helps brands produce."
  }
};

type CasesPageProps = {
  searchParams: Promise<SearchParams & { play?: string }>;
};

export default async function CasesPage({ searchParams }: CasesPageProps) {
  const params = await searchParams;
  const locale = getLocale(params);
  const t = copy[locale];
  const initialPlayId = typeof params.play === "string" ? params.play : undefined;
  const [works, categories] = await Promise.all([
    marketingShowcaseService.listPublished(),
    marketingShowcaseService.listCategories()
  ]);

  return (
    <MarketingDocsShell locale={locale} active="cases">
      <section className="overflow-hidden rounded-[1.75rem] border border-violet-100/70 bg-white p-6 shadow-[0_18px_60px_-48px_rgba(76,29,149,0.35)] sm:p-8 lg:p-10">
        <p className="text-sm font-semibold text-violet-700">{t.eyebrow}</p>
        <div className="mt-2 h-0.5 w-6 rounded-full bg-violet-600" />
        <h1 className="mt-5 max-w-4xl text-3xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.08]">
          {t.title}
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-600">{t.subtitle}</p>

        <div className="mt-8">
          <CreatorsShowcaseGallery
            locale={locale}
            works={works}
            categories={categories}
            initialPlayId={initialPlayId}
          />
        </div>
      </section>
    </MarketingDocsShell>
  );
}
