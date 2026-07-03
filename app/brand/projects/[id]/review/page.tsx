import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReviewerTimestampWorkspace } from "@/components/studioos/reviewer-skeleton/reviewer-timestamp-workspace";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, getOrder, getOrderForProject } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { resolveReviewPortalUiState } from "@/features/review/review-portal-ui-state";
import { listReviewComments } from "@/lib/studioos/review-store";
import { resolveActiveReviewPlaybackVersion } from "@/lib/studioos/review-upload-version";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export const dynamic = "force-dynamic";

export default async function BrandProjectReviewPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const clientEmail = await getCurrentClientEmail();

  if (!clientEmail) {
    redirect(withLocale("/login?role=brand", locale));
  }

  const project = await getProject(id);
  const order = await getOrderForProject(id);
  const linkedOrder = order ?? (await getOrder(id));
  const resolvedProjectId = project?.id ?? linkedOrder?.project_id ?? id;

  if (!project && !linkedOrder) {
    notFound();
  }

  if (project && project.client_email.toLowerCase() !== clientEmail.toLowerCase()) {
    redirect(withLocale("/brand", locale));
  }

  if (!project && linkedOrder && linkedOrder.client_email.toLowerCase() !== clientEmail.toLowerCase()) {
    redirect(withLocale("/brand", locale));
  }

  const orderForReview = linkedOrder ?? (resolvedProjectId ? await getOrderForProject(resolvedProjectId) : null);
  if (!orderForReview) {
    notFound();
  }

  const [deliverables, comments] = await Promise.all([
    getDeliverables(orderForReview.id),
    listReviewComments(orderForReview.id)
  ]);

  const portalUi = orderForReview.project_id
    ? await resolveReviewPortalUiState({
        legacyProjectId: resolvedProjectId,
        order: orderForReview,
        deliverableCount: deliverables.length
      })
    : null;

  const effectiveOrder = portalUi
    ? { ...orderForReview, status: portalUi.derivedOrderStatus }
    : orderForReview;

  const campaignTitle = locale === "zh" ? "审批中心" : "Review center";

  if (!deliverables.length) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href={withLocale(`${brandPortalRoutes.project(resolvedProjectId)}?tab=production`, locale)}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900"
        >
          ← {locale === "zh" ? "返回项目" : "Back to project"}
        </Link>
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">{locale === "zh" ? "审片" : "Review"}</h1>
          <p className="mt-3 text-sm text-zinc-500">
            {locale === "zh"
              ? "制作团队尚未上传审片版。上传后你可以在此暂停视频并留言。"
              : "No review version yet. Once uploaded, pause the video here and leave timestamp comments."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ReviewerTimestampWorkspace
      locale={locale}
      role="brand"
      order={effectiveOrder}
      campaignTitle={campaignTitle}
      deliverables={deliverables}
      initialComments={comments}
      initialVersion={await resolveActiveReviewPlaybackVersion(orderForReview.id, deliverables)}
      portalUi={portalUi}
      backHref={withLocale(`${brandPortalRoutes.project(resolvedProjectId)}?tab=production`, locale)}
      backLabel={locale === "zh" ? "返回项目" : "Back to project"}
    />
  );
}
