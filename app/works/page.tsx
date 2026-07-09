import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingShowcaseGallery } from "@/components/marketing/showcase/marketing-showcase-gallery";
import { marketingShowcaseService } from "@/features/marketing-showcase/marketing-showcase.service";
import { getLocale, type SearchParams } from "@/lib/i18n";

type WorksPageProps = {
  searchParams: Promise<SearchParams & { play?: string }>;
};

export default async function WorksPage({ searchParams }: WorksPageProps) {
  const params = await searchParams;
  const locale = getLocale(params);
  const [works, categories] = await Promise.all([
    marketingShowcaseService.listPublished(),
    marketingShowcaseService.listCategories()
  ]);
  const initialPlayId = typeof params.play === "string" ? params.play : undefined;

  return (
    <MarketingShell locale={locale}>
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
            {locale === "zh" ? "精选作品" : "Featured works"}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">
            {locale === "zh" ? "作品自己会说话" : "Works speak for themselves"}
          </h1>
          <p className="mt-4 text-lg text-zinc-500">
            {locale === "zh"
              ? "官方精选案例视频，按品类浏览，支持放大播放与暂停。"
              : "Official showcase videos by category — play, pause, and fullscreen."}
          </p>
        </div>

        <div className="mt-12">
          <MarketingShowcaseGallery
            locale={locale}
            works={works}
            categories={categories}
            initialPlayId={initialPlayId}
          />
        </div>
      </main>
    </MarketingShell>
  );
}
