import { getAppUiLocale } from "@/lib/app-language";
import { AdminRegionalPackagePricingPanel } from "@/components/admin/credits/admin-regional-package-pricing-panel";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";

const copy = {
  en: {
    title: "Regional package pricing",
    subtitle: "Configure explicit regional prices, Stripe Price mappings, and GLOBAL fallback."
  },
  zh: {
    title: "区域套餐定价",
    subtitle: "配置各区域明确售价、Stripe Price 映射与 GLOBAL 回退价。"
  }
} as const;

export default async function AdminRegionalPackagePricingPage({
  params
}: {
  params: Promise<{ packageId: string }>;
}) {
  const locale = await getAppUiLocale();
  const { packageId } = await params;
  const t = copy[locale];

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <AdminRegionalPackagePricingPanel locale={locale} packageId={packageId} />
    </AdminPageShell>
  );
}
