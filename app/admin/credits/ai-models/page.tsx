import Link from "next/link";
import { getAppUiLocale } from "@/lib/app-language";
import { AdminAiModelsPanel } from "@/components/admin/credits/admin-ai-models-panel";
import { AdminPricingHealthPanel } from "@/components/admin/credits/admin-pricing-health-panel";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { withLocale } from "@/lib/i18n";

const copy = {
  en: {
    title: "AI model marketplace",
    subtitle: "Unified provider models, pricing rules, enablement, and recommendation flags."
  },
  zh: {
    title: "AI 模型商城",
    subtitle: "统一管理 Provider 模型、Pricing Rules、启用状态与推荐标记。"
  }
} as const;

export default async function AdminCreditAiModelsPage() {
  const locale = await getAppUiLocale();
  const t = copy[locale];

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={withLocale(adminPortalRoutes.credits, locale)} className="text-sm text-zinc-500 underline">
          {locale === "zh" ? "返回 Credits 总览" : "Back to credits overview"}
        </Link>
        <Link
          href={withLocale(adminPortalRoutes.creditsPricing, locale)}
          className="text-sm text-zinc-500 underline"
        >
          {locale === "zh" ? "Pricing Rules" : "Pricing rules"}
        </Link>
      </div>
      <AdminPricingHealthPanel locale={locale} />
      <AdminAiModelsPanel locale={locale} />
    </AdminPageShell>
  );
}
