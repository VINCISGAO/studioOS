import { getAppUiLocale } from "@/lib/app-language";
import { AdminMarketingShowcasePanel } from "@/components/studioos/admin-marketing-showcase-panel";
import { type SearchParams } from "@/lib/i18n";

export default async function AdminShowcasePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950">
          {locale === "zh" ? "官网精选作品" : "Marketing showcase"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {locale === "zh"
            ? "官方上传案例视频，绑定首页精选与 /creators 作品库，不再跳转创作者个人主页。"
            : "Upload official showcase videos for the homepage and /creators gallery — no creator profile links."}
        </p>
      </div>
      <AdminMarketingShowcasePanel locale={locale} />
    </div>
  );
}
