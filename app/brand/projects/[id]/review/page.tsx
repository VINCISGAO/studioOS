import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { FrameioReviewCenter } from "@/components/studioos/review-engine/frameio-review-center";
import { DeliverableVideoPolicyNotice } from "@/components/studioos/deliverable-video-policy-notice";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, getOrderForProject } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { listReviewComments } from "@/lib/studioos/review-store";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<
    SearchParams & { approved?: string; revision?: string; settled?: string; completed?: string }
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
  if (!project) {
    notFound();
  }

  if (project.client_email.toLowerCase() !== clientEmail.toLowerCase()) {
    redirect(withLocale("/brand", locale));
  }

  const order = await getOrderForProject(id);
  const [deliverables, comments] = await Promise.all([
    order ? getDeliverables(order.id) : Promise.resolve([]),
    order ? listReviewComments(order.id) : Promise.resolve([])
  ]);

  const flash =
    query.approved === "1" || query.completed === "1"
      ? ("completed" as const)
      : query.revision === "1" || query.revision === "requested"
        ? ("revision" as const)
        : undefined;

  if (!order || !deliverables.length) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href={withLocale(`${brandPortalRoutes.project(id)}?tab=production`, locale)}
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
      {order.status === "completed" ? <DeliverableVideoPolicyNotice locale={locale} /> : null}
      <FrameioReviewCenter
        locale={locale}
        order={order}
        campaignTitle={project.title || project.product_name || project.company_name}
        deliverables={deliverables}
        initialComments={comments}
        initialVersion={deliverables[deliverables.length - 1]?.version ?? 1}
        role="brand"
        variant="embedded"
        backHref={withLocale(`${brandPortalRoutes.project(id)}?tab=production`, locale)}
        backLabel={locale === "zh" ? "返回项目" : "Back to project"}
        flash={flash}
      />
    </div>
  );
}
