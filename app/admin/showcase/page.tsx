import { getAppUiLocale } from "@/lib/app-language";
import { AdminMarketingShowcasePanel } from "@/components/studioos/admin-marketing-showcase-panel";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { type SearchParams } from "@/lib/i18n";

const copy = {
  en: {
    title: "Marketing showcase",
    subtitle:
      "Upload official showcase videos for the homepage and /creators gallery — no creator profile links."
  },
  zh: {
    title: "官网精选作品",
    subtitle: "官方上传案例视频，绑定首页精选与 /creators 作品库，不再跳转创作者个人主页。"
  }
} as const;

export default async function AdminShowcasePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const t = copy[locale];

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <AdminMarketingShowcasePanel locale={locale} />
    </AdminPageShell>
  );
}
