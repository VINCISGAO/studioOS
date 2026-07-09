import { getAppUiLocale } from "@/lib/app-language";
import { notFound } from "next/navigation";
import { AdminCampaignDetailView } from "@/components/studioos/admin-campaign-detail";
import { adminCampaignService } from "@/features/admin/campaign/admin-campaign.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams } from "@/lib/i18n";

export default async function AdminCampaignDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const locale = await getAppUiLocale();
  const user = await getAdminSessionUser();
  if (!user) notFound();

  let detail;
  try {
    detail = await adminCampaignService.getDetail(user, id);
  } catch {
    notFound();
  }

  return <AdminCampaignDetailView locale={locale} detail={detail} />;
}
