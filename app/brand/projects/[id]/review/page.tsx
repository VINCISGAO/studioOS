import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { FrameioReviewCenter } from "@/components/studioos/review-engine/frameio-review-center";
import { DeliverableVideoPolicyNotice } from "@/components/studioos/deliverable-video-policy-notice";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, getOrder, getOrderForProject } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { deliveryService } from "@/features/delivery/delivery.service";
import { listReviewComments } from "@/lib/studioos/review-store";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<
    SearchParams & {
      approved?: string;
      revision?: string;
      settled?: string;
      completed?: string;
      error?: string;
    }
  >;
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
  const [deliverables, comments, delivery] = await Promise.all([
    orderForReview ? getDeliverables(orderForReview.id) : Promise.resolve([]),
    orderForReview ? listReviewComments(orderForReview.id) : Promise.resolve([]),
    deliveryService.getForLegacyProject(resolvedProjectId)
  ]);

  const campaignTitle =
    project?.title ||
    project?.product_name ||
    project?.company_name ||
    orderForReview?.title ||
    orderForReview?.company_name ||
    "Project";

  const flash =
    query.approved === "1" || query.completed === "1"
      ? ("completed" as const)
      : query.revision === "1" || query.revision === "requested"
        ? ("revision" as const)
        : undefined;
  const actionError =
    query.error === "approve"
      ? locale === "zh"
        ? "暂时无法通过交付，请确认订单仍在审片状态后重试。"
        : "Could not approve delivery. Make sure the order is still in review and try again."
      : query.error === "revision"
        ? locale === "zh"
          ? "暂时无法提交修改请求，请稍后重试。"
          : "Could not request changes. Please try again."
        : query.error === "download"
          ? locale === "zh"
            ? "暂时无法下载成片，请确认最终版已交付后重试。"
            : "Could not download final delivery. Make sure the studio has marked a final version."
          : undefined;

  if (!orderForReview || !deliverables.length) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href={withLocale(`${brandPortalRoutes.project(resolvedProjectId)}?tab=production`, locale)}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900"
        >
          ← {locale === "zh" ? "返回项目" : "Back to project"}
        </Link>
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">
            {locale === "zh" ? "审片" : "Review"}
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            {locale === "zh"
              ? "制作团队尚未上传审片版。上传后你会收到通知，并在此审片。"
              : "The studio has not uploaded a review version yet. You will be notified here when it is ready."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {orderForReview.status === "completed" ? <DeliverableVideoPolicyNotice locale={locale} /> : null}
      <FrameioReviewCenter
        locale={locale}
        order={orderForReview}
        campaignTitle={campaignTitle}
        deliverables={deliverables}
        initialComments={comments}
        initialVersion={deliverables[deliverables.length - 1]?.version ?? 1}
        role="brand"
        variant="embedded"
        backHref={withLocale(`${brandPortalRoutes.project(resolvedProjectId)}?tab=production`, locale)}
        backLabel={locale === "zh" ? "返回项目" : "Back to project"}
        flash={flash}
        actionError={actionError}
        delivery={delivery}
      />
    </div>
  );
}
