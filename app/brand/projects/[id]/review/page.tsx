import { getAppUiLocale } from "@/lib/app-language";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock3, Film, MessageSquareText, UploadCloud } from "lucide-react";
import { ReviewerTimestampWorkspace } from "@/components/studioos/reviewer-skeleton/reviewer-timestamp-workspace";
import { getCurrentClientEmail } from "@/features/auth/session-context";
import { brandPortalRequireOwnedResource, brandPortalRequireSession } from "@/lib/studioos/brand-portal-page-guards";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, getOrder, getOrderForProject } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { resolveReviewPortalUiState } from "@/features/review/review-portal-ui-state";
import { listReviewComments } from "@/lib/studioos/review-store";
import { resolveActiveReviewPlaybackVersion } from "@/lib/studioos/review-upload-version";
import { isPaymentStubMode } from "@/lib/payment/payment-stub";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export const dynamic = "force-dynamic";

export default async function BrandProjectReviewPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = await getAppUiLocale();
  const clientEmail = await getCurrentClientEmail();
  brandPortalRequireSession(clientEmail, locale, `/brand/projects/${id}/review`);

  const project = await getProject(id);
  const order = await getOrderForProject(id);
  const linkedOrder = order ?? (await getOrder(id));
  const resolvedProjectId = project?.id ?? linkedOrder?.project_id ?? id;

  if (!project && !linkedOrder) {
    notFound();
  }

  if (project) {
    brandPortalRequireOwnedResource(project, clientEmail);
  }

  if (!project && linkedOrder) {
    brandPortalRequireOwnedResource(linkedOrder, clientEmail);
  }

  const orderForReview = linkedOrder ?? (resolvedProjectId ? await getOrderForProject(resolvedProjectId) : null);
  if (!orderForReview) {
    redirect(withLocale(`${brandPortalRoutes.project(resolvedProjectId)}?tab=production`, locale));
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
    const projectTitle = project?.title || project?.product_name || orderForReview.title || campaignTitle;
    const projectHref = withLocale(`${brandPortalRoutes.project(resolvedProjectId)}?tab=production`, locale);
    const steps =
      locale === "zh"
        ? [
            { title: "等待上传", body: "制作团队会在项目工作台上传审片版本。", icon: UploadCloud },
            { title: "在线审片", body: "视频上传后，你可以暂停画面并留下时间点意见。", icon: MessageSquareText },
            { title: "确认交付", body: "审片通过后进入交付确认与款项释放流程。", icon: Film }
          ]
        : [
            { title: "Await upload", body: "The studio will upload the review version from their workspace.", icon: UploadCloud },
            { title: "Review online", body: "After upload, pause the video and leave timestamped comments.", icon: MessageSquareText },
            { title: "Approve delivery", body: "After approval, the project moves into delivery confirmation and fund release.", icon: Film }
          ];

    return (
      <div className="mx-auto max-w-6xl space-y-6 pb-10">
        <Link href={projectHref} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" />
          {locale === "zh" ? "返回项目" : "Back to project"}
        </Link>

        <section className="overflow-hidden rounded-[24px] border border-zinc-200/80 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="p-8 sm:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                <Clock3 className="h-4 w-4" />
                {locale === "zh" ? "等待制作团队上传审片版" : "Waiting for studio upload"}
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-950">
                {locale === "zh" ? "审片中心" : "Review center"}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
                {locale === "zh"
                  ? "当前项目还没有可审阅的视频版本。制作团队上传后，你会在这里看到播放器、时间轴批注、版本记录和通过/退回操作。"
                  : "There is no reviewable video version yet. Once the studio uploads, this page will show the player, timeline comments, version history, and approval actions."}
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="mt-4 text-base font-semibold text-zinc-950">{step.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-zinc-500">{step.body}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <aside className="border-t border-zinc-100 bg-zinc-50/70 p-8 lg:border-l lg:border-t-0">
              <p className="text-sm font-medium text-zinc-500">{locale === "zh" ? "当前项目" : "Current project"}</p>
              <h2 className="mt-2 text-xl font-semibold leading-snug text-zinc-950">{projectTitle}</h2>
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-zinc-100">
                  <span className="text-zinc-500">{locale === "zh" ? "订单状态" : "Order status"}</span>
                  <span className="font-medium text-zinc-900">{orderForReview.status}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-zinc-100">
                  <span className="text-zinc-500">{locale === "zh" ? "审片版本" : "Review versions"}</span>
                  <span className="font-medium text-zinc-900">0</span>
                </div>
              </div>
              <Link
                href={projectHref}
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                {locale === "zh" ? "返回项目进度" : "Back to project progress"}
              </Link>
            </aside>
          </div>
        </section>

        <div className="rounded-2xl border border-violet-100 bg-violet-50/70 px-5 py-4 text-sm leading-6 text-violet-900">
          {locale === "zh"
            ? "提示：审片页只在创作者上传视频后进入正式工作区。当前无需操作，等待系统通知即可。"
            : "Note: the review workspace opens after the creator uploads a video. No action is needed yet; wait for the system notification."}
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
      stripeCheckoutEnabled={!isPaymentStubMode()}
    />
  );
}
