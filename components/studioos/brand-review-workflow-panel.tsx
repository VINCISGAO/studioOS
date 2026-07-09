import Link from "next/link";
import { CheckCircle2, Circle, Clapperboard, RotateCcw } from "lucide-react";
import { approveDeliveryAction, requestRevisionAction } from "@/app/order-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { creators } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import type { ReviewComment } from "@/lib/studioos/review-store";
import type { ReviewPortalUiState } from "@/features/review/review-portal-ui-state";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Collaborative review",
    subtitle: "Brand timeline notes sync to the studio review room. Studio marks items resolved before you approve.",
    stepUpload: "Studio submits version",
    stepComment: "Brand adds timeline notes",
    stepResolve: "Studio resolves notes",
    stepApprove: "Brand approves delivery",
    waitingUpload: "Waiting for the studio to upload Version 1.",
    openComments: (n: number) => `${n} open note${n === 1 ? "" : "s"} for studio`,
    allResolved: "All timeline notes resolved by studio",
    studioRoom: "Studio review room",
    studioRoomHint: "Nova sees the same comments and uploads revisions from Delivery Workspace.",
    approveTitle: "Approve delivery",
    approveBody: "Release escrow once you are satisfied. Open notes can remain — approval closes the round.",
    approveButton: "Approve & release escrow",
    revisionTitle: "Request revision round",
    revisionPlaceholder: "Summarize changes needed beyond timeline notes (optional).",
    revisionButton: "Send back to studio",
    completed: "Delivery approved. Escrow released to the studio.",
    revisionSent: "Revision requested. Studio will upload a new version.",
    orderStatus: "Order status"
  },
  zh: {
    title: "协同审片流程",
    subtitle: "Brand 时间轴批注会同步到 Studio 审片室；Studio 标记「已解决」后，Brand 再批准交付。",
    stepUpload: "Studio 提交版本",
    stepComment: "Brand 添加时间轴批注",
    stepResolve: "Studio 处理批注",
    stepApprove: "Brand 批准交付",
    waitingUpload: "等待 Studio 上传 Version 1。",
    openComments: (n: number) => `${n} 条待 Studio 处理的批注`,
    allResolved: "Studio 已处理全部时间轴批注",
    studioRoom: "Studio 审片室",
    studioRoomHint: "Nova 在同一订单里查看批注，并在「交付工作台」上传修改版。",
    approveTitle: "批准交付",
    approveBody: "确认满意后释放托管款项。即使仍有未解决批注，也可批准以结束本轮。",
    approveButton: "批准并释放托管",
    revisionTitle: "申请修改轮次",
    revisionPlaceholder: "补充时间轴批注之外的修改说明（可选）。",
    revisionButton: "退回 Studio 修改",
    completed: "交付已批准，托管款项已释放给 Studio。",
    revisionSent: "已申请修改，Studio 将上传新版本。",
    orderStatus: "订单状态"
  }
};

function StepRow({
  done,
  active,
  label,
  detail
}: {
  done: boolean;
  active?: boolean;
  label: string;
  detail?: string;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
          done ? "bg-emerald-100 text-emerald-700" : active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400"
        )}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-3.5 w-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", done || active ? "text-zinc-900" : "text-zinc-500")}>{label}</p>
        {detail ? <p className="mt-0.5 text-xs leading-5 text-zinc-500">{detail}</p> : null}
      </div>
    </li>
  );
}

export function BrandReviewWorkflowPanel({
  locale,
  projectId,
  order,
  deliverables,
  comments,
  flash,
  reviewUi
}: {
  locale: Locale;
  projectId?: string;
  order: StoredOrder | null;
  deliverables: StoredDeliverable[];
  comments: ReviewComment[];
  flash?: "completed" | "revision";
  reviewUi?: ReviewPortalUiState | null;
}) {
  const t = copy[locale];
  const creator = order ? creators.find((item) => item.id === order.creator_id) : null;
  const hasVersions = deliverables.length > 0;
  const openComments = comments.filter((item) => item.status !== "resolved");
  const resolvedComments = comments.filter((item) => item.status === "resolved");
  const canDecide =
    reviewUi?.canDecide ??
    Boolean(order && (order.status === "review" || order.status === "revision") && hasVersions);
  const isCompleted = reviewUi?.orderApproved ?? order?.status === "completed";
  const brandReviewHref = brandPortalRoutes.projectReview(projectId ?? order?.project_id ?? order?.id ?? "");

  if (!order) {
    return (
      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-6">
          <p className="text-sm text-zinc-500">{t.waitingUpload}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {flash === "completed" || isCompleted ? (
        <Card className="border-emerald-200 bg-emerald-50 shadow-none">
          <CardContent className="flex items-center gap-3 p-5 text-sm text-emerald-950">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {t.completed}
          </CardContent>
        </Card>
      ) : null}

      {flash === "revision" ? (
        <Card className="border-amber-200 bg-amber-50 shadow-none">
          <CardContent className="p-5 text-sm text-amber-950">{t.revisionSent}</CardContent>
        </Card>
      ) : null}

      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold">{t.title}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{t.subtitle}</p>

          <ol className="mt-6 space-y-4">
            <StepRow
              done={hasVersions}
              active={!hasVersions}
              label={t.stepUpload}
              detail={
                hasVersions
                  ? `${deliverables.length} version${deliverables.length === 1 ? "" : "s"} · ${creator?.name ?? "Studio"}`
                  : t.waitingUpload
              }
            />
            <StepRow
              done={comments.length > 0}
              active={hasVersions && comments.length === 0}
              label={t.stepComment}
              detail={
                comments.length
                  ? `${comments.length} total · ${openComments.length} open`
                  : locale === "zh"
                    ? "在下方播放器时间轴添加批注"
                    : "Add notes on the timeline below"
              }
            />
            <StepRow
              done={comments.length > 0 && openComments.length === 0}
              active={openComments.length > 0}
              label={t.stepResolve}
              detail={
                openComments.length
                  ? t.openComments(openComments.length)
                  : resolvedComments.length
                    ? t.allResolved
                    : locale === "zh"
                      ? "Studio 在审片室标记「已解决」"
                      : "Studio marks notes resolved in review room"
              }
            />
            <StepRow
              done={isCompleted}
              active={Boolean(canDecide)}
              label={t.stepApprove}
              detail={isCompleted ? t.completed : locale === "zh" ? "确认后释放托管" : "Release escrow on approval"}
            />
          </ol>

          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border bg-zinc-50/80 px-4 py-3 text-sm">
            <Clapperboard className="h-4 w-4 text-zinc-500" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-900">{t.studioRoom}</p>
              <p className="text-xs text-zinc-500">{t.studioRoomHint}</p>
            </div>
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link href={withLocale(brandReviewHref, locale)} target="_blank" rel="noreferrer">
                {creator?.name ?? "Studio"} · {t.studioRoom}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {canDecide ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-none">
            <CardContent className="p-6">
              <h3 className="text-base font-semibold">{t.approveTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{t.approveBody}</p>
              <form action={approveDeliveryAction} className="mt-4">
                <input type="hidden" name="lang" value={locale} />
                <input type="hidden" name="order_id" value={order.id} />
                {projectId ? <input type="hidden" name="project_id" value={projectId} /> : null}
                <Button type="submit" className="w-full rounded-full">
                  <CheckCircle2 className="h-4 w-4" />
                  {t.approveButton}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-6">
              <h3 className="text-base font-semibold">{t.revisionTitle}</h3>
              <form action={requestRevisionAction} className="mt-4 grid gap-3">
                <input type="hidden" name="lang" value={locale} />
                <input type="hidden" name="order_id" value={order.id} />
                {projectId ? <input type="hidden" name="project_id" value={projectId} /> : null}
                <Textarea name="revision_notes" placeholder={t.revisionPlaceholder} rows={3} />
                <Button type="submit" variant="outline" className="rounded-full">
                  <RotateCcw className="h-4 w-4" />
                  {t.revisionButton}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
