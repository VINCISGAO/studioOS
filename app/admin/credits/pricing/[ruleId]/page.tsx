import Link from "next/link";
import { AdminPricingRuleEditor } from "@/components/admin/credits/admin-pricing-rule-editor";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { getAppUiLocale } from "@/lib/app-language";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { withLocale } from "@/lib/i18n";

export default async function AdminPricingRuleDetailPage({
  params
}: {
  params: Promise<{ ruleId: string }>;
}) {
  const locale = await getAppUiLocale();
  const { ruleId } = await params;

  return (
    <AdminPageShell
      locale={locale}
      title={locale === "zh" ? "定价规则编辑" : "Pricing rule editor"}
      subtitle={
        locale === "zh"
          ? "草稿 → 校验 → 发布。已发布规则不可原地修改。"
          : "Draft → validate → publish. Published rules are immutable."
      }
    >
      <div className="mb-4">
        <Link href={withLocale(adminPortalRoutes.creditsPricing, locale)} className="text-sm text-zinc-500 underline">
          {locale === "zh" ? "返回定价列表" : "Back to pricing list"}
        </Link>
      </div>
      <AdminPricingRuleEditor locale={locale} ruleId={ruleId} />
    </AdminPageShell>
  );
}
