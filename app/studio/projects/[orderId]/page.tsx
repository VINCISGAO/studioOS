import Link from "next/link";
import { redirect } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { CreatorCommercialTimeline } from "@/components/studioos/commercial-lifecycle-timeline";
import { StudioCreativeWorkspace } from "@/components/studioos/studio-creative-workspace";
import { getCreativeBrief, listPackItems } from "@/lib/campaign-store";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { beginOrderProduction, getDeliverables, getOrder } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { resolveCreatorCommercialStep } from "@/lib/studioos/commercial-lifecycle";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { listReviewComments } from "@/lib/studioos/review-store";
import { isCreatorVerified } from "@/lib/studioos/deposit-guard";

export default async function StudioProjectPage({
  params,
  searchParams
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ orderId }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const creator = await getCurrentCreator();

  if (!creator) {
    redirect(withLocale("/login?role=creator", locale));
  }

  let order = await getOrder(orderId);
  if (!order || order.creator_id !== creator.id) {
    redirect(withLocale("/studio", locale));
  }

  const project = order.project_id ? await getProject(order.project_id) : null;

  if (order.status === "waiting_payment" && project?.status === "production") {
    const repaired = await beginOrderProduction(order.id);
    if (repaired) {
      order = repaired;
    }
  }
  const [deliverables, comments, brief, pack] = await Promise.all([
    getDeliverables(order.id),
    listReviewComments(order.id),
    order.project_id ? getCreativeBrief(order.project_id) : Promise.resolve(null),
    order.project_id ? listPackItems(order.project_id) : Promise.resolve([])
  ]);

  const canUpload = ["in_production", "revision", "review"].includes(order.status);
  const creatorCommercialStep = resolveCreatorCommercialStep({
    invitationStatus: "selected",
    order,
    deliverableCount: deliverables.length
  });

  return (
    <div className="space-y-6">
      <Link
        href={withLocale(creatorPortalRoutes.projects, locale)}
        className="text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← {locale === "zh" ? "返回我的项目" : "Back to my projects"}
      </Link>
      <CreatorCommercialTimeline
        locale={locale}
        currentStep={creatorCommercialStep}
        orderStatus={order.status}
        compact
      />
      {canUpload ? (
        <Link
          href={withLocale(creatorPortalRoutes.review(orderId), locale)}
          className="flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 transition hover:bg-blue-100"
        >
          <span className="inline-flex items-center gap-2 font-medium">
            <Clapperboard className="h-4 w-4" />
            {deliverables.length
              ? locale === "zh"
                ? "进入审片中心 — 与品牌同步批注与版本"
                : "Open review center — synced with brand feedback"
              : locale === "zh"
                ? "进入审片中心 — 上传 Version 1"
                : "Open review center — upload Version 1"}
          </span>
          <span className="text-blue-700">→</span>
        </Link>
      ) : null}
      <StudioCreativeWorkspace
          locale={locale}
          studioName={creator.name}
          isVerified={isCreatorVerified(creator)}
          order={order}
          project={project}
          brief={brief}
          pack={pack}
          deliverables={deliverables}
          comments={comments}
          canUpload={canUpload}
      />
    </div>
  );
}
