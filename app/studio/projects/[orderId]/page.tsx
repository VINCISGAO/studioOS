import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { CreatorProjectOverview } from "@/components/studioos/creator-project-overview";
import { loadCreatorProjectPortalDetail } from "@/lib/api-client/server-portal-gateway";
import { getCurrentCreatorId } from "@/lib/creator-session";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

export default async function StudioProjectPage({
  params,
  searchParams
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ orderId }, query] = await Promise.all([params, searchParams]);
  void query;
  const locale = await getAppUiLocale();
  const creatorId = await getCurrentCreatorId();

  if (!creatorId) {
    redirect(withLocale("/login?role=creator", locale));
  }

  let detail;
  try {
    detail = await loadCreatorProjectPortalDetail({
      orderId,
      locale,
      creatorId
    });
  } catch {
    redirect(withLocale(creatorPortalRoutes.projects, locale));
  }

  return (
    <CreatorProjectOverview
      locale={detail.locale}
      order={detail.order}
      project={detail.project}
      pack={detail.pack}
      deliverables={detail.deliverables}
      comments={detail.comments}
      canUpload={detail.canUpload}
      collaborationView={detail.collaborationView}
      aiEnabled={detail.aiEnabled}
      creatorCommercialStep={detail.creatorCommercialStep}
      commercialContext={detail.commercialContext}
    />
  );
}
