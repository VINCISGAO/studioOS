import Link from "next/link";
import { AdminPricingHealthPanel } from "@/components/admin/credits/admin-pricing-health-panel";
import { AdminPricingRulesPanel } from "@/components/admin/credits/admin-pricing-rules-panel";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { getAppUiLocale } from "@/lib/app-language";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { withLocale } from "@/lib/i18n";

const copy = {
  en: {
    title: "Model pricing rules",
    subtitle: "Versioned pricing workflow: draft, validate, publish. Published rules never mutate in place."
  },
  zh: {
    title: "模型计费规则",
    subtitle: "版本化定价流程：草稿 → 校验 → 发布。已发布规则禁止原地修改。"
  }
} as const;

export default async function AdminCreditPricingPage() {
  const locale = await getAppUiLocale();
  const t = copy[locale];

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={withLocale(adminPortalRoutes.credits, locale)} className="text-sm text-zinc-500 underline">
          {locale === "zh" ? "返回 Token 总览" : "Back to Token overview"}
        </Link>
        <Link
          href={withLocale(adminPortalRoutes.creditsAiModels, locale)}
          className="text-sm text-zinc-500 underline"
        >
          {locale === "zh" ? "AI 模型商城" : "AI model marketplace"}
        </Link>
      </div>

      <AdminPricingHealthPanel locale={locale} />
      <AdminPricingRulesPanel locale={locale} />
    </AdminPageShell>
  );
}
