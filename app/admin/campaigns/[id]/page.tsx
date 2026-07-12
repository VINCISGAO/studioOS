import { getAppUiLocale } from "@/lib/app-language";
import { notFound } from "next/navigation";
import { AdminCampaignDetailView } from "@/components/studioos/admin-campaign-detail";
import { AdminPageActionLink, AdminPageShell } from "@/components/studioos/admin-page-shell";
import { adminCampaignService } from "@/features/admin/campaign/admin-campaign.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";

const copy = {
  en: { back: "Back to campaigns" },
  zh: { back: "返回活动列表" }
} as const;

export default async function AdminCampaignDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const user = await getAdminSessionUser();
  if (!user) notFound();

  let detail;
  try {
    detail = await adminCampaignService.getDetail(user, id);
  } catch {
    notFound();
  }

  return (
    <AdminPageShell
      locale={locale}
      title={detail.title}
      subtitle={detail.id}
      actions={
        <AdminPageActionLink href={withLocale(adminPortalRoutes.campaigns, locale)}>← {t.back}</AdminPageActionLink>
      }
    >
      <AdminCampaignDetailView locale={locale} detail={detail} embedded />
    </AdminPageShell>
  );
}
