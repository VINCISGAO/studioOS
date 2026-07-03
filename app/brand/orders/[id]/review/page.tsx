import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReviewerTimestampWorkspace } from "@/components/studioos/reviewer-skeleton/reviewer-timestamp-workspace";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, getOrder } from "@/lib/order-service";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { listReviewComments } from "@/lib/studioos/review-store";
import { resolveActiveReviewPlaybackVersion } from "@/lib/studioos/review-upload-version";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export const dynamic = "force-dynamic";

export default async function BrandOrderReviewPage({ params, searchParams }: PageProps) {
  const [{ id: orderId }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const clientEmail = await getCurrentClientEmail();
  const order = await getOrder(orderId);

  if (!order || !clientEmail || order.client_email.toLowerCase() !== clientEmail.toLowerCase()) {
    notFound();
  }

  if (order.project_id) {
    redirect(withLocale(`/brand/projects/${order.project_id}/review`, locale));
  }

  const [deliverables, comments] = await Promise.all([
    getDeliverables(order.id),
    listReviewComments(order.id)
  ]);

  const campaignTitle = locale === "zh" ? "审批中心" : "Review center";

  if (!deliverables.length) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href={withLocale(brandPortalRoutes.reviewHub, locale)}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900"
        >
          ← {locale === "zh" ? "返回审片中心" : "Back to review center"}
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
      order={order}
      campaignTitle={campaignTitle}
      deliverables={deliverables}
      initialComments={comments}
      initialVersion={await resolveActiveReviewPlaybackVersion(order.id, deliverables)}
      backHref={withLocale(brandPortalRoutes.reviewHub, locale)}
      backLabel={locale === "zh" ? "返回审片中心" : "Back to review center"}
    />
  );
}
