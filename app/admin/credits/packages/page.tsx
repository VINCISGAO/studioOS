import Link from "next/link";
import { getAppUiLocale } from "@/lib/app-language";
import { AdminCreditPackagesPanel } from "@/components/admin/credits/admin-credit-packages-panel";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { withLocale } from "@/lib/i18n";

const copy = {
  en: {
    title: "Credit packages",
    subtitle: "Package CRUD, versioning, regional pricing, and checkout catalog control."
  },
  zh: {
    title: "Token 套餐管理",
    subtitle: "套餐 CRUD、版本管理、区域定价与结账目录控制。"
  }
} as const;

export default async function AdminCreditPackagesPage() {
  const locale = await getAppUiLocale();
  const t = copy[locale];

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <div className="mb-4">
        <Link href={withLocale(adminPortalRoutes.credits, locale)} className="text-sm text-zinc-500 underline">
          {locale === "zh" ? "返回 Token 总览" : "Back to Token overview"}
        </Link>
      </div>
      <AdminCreditPackagesPanel locale={locale} />
    </AdminPageShell>
  );
}
