import { getAppUiLocale } from "@/lib/app-language";
import { notFound } from "next/navigation";
import { CreatorProjectOverview } from "@/components/studioos/creator-project-overview";
import { loadCreatorProjectPortalDetail } from "@/lib/api-client/server-portal-gateway";
import { getCurrentCreatorId } from "@/features/auth/session-context";
import { isAppError } from "@/lib/core/errors";
import { type SearchParams } from "@/lib/i18n";

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
    notFound();
  }

  let detail;
  try {
    detail = await loadCreatorProjectPortalDetail({
      orderId,
      locale,
      creatorId
    });
  } catch (error) {
    if (isAppError(error) && (error.status === 404 || error.status === 403)) {
      notFound();
    }
    notFound();
  }

  return (
    <CreatorProjectOverview
      locale={detail.locale}
      order={detail.order}
      project={detail.project}
      pack={detail.pack}
      references={detail.references}
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
