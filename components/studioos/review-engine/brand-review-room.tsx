"use client";

import Link from "next/link";
import { useTransition } from "react";
import { CheckCircle2, ExternalLink, Loader2, RotateCcw } from "lucide-react";
import {
  approveReviewDeliveryAction,
  requestReviewChangesAction
} from "@/app/review-engine-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n";
import type { StoredOrder } from "@/lib/order-types";
import type { ReviewEvent, ReviewSession } from "@/lib/review-engine/types";
import { reviewSessionStatusLabel } from "@/lib/review-engine/types";
import { formatDate } from "@/lib/utils";

const copy = {
  en: {
    project: "Project",
    version: "Version",
    status: "Review status",
    openRoom: "Open Review Room",
    requestChanges: "Request Changes",
    approve: "Approve Delivery",
    events: "Activity",
    noLink: "Waiting for creator to upload a review version.",
    approvedHint: "Approved — you can proceed to master delivery and payment release.",
    paymentHint: "Escrow will release after final master delivery is confirmed.",
    demoNote: "Comments and annotations happen in Frame.io — not duplicated here."
  },
  zh: {
    project: "项目",
    version: "当前版本",
    status: "审片状态",
    openRoom: "进入审片室",
    requestChanges: "申请修改",
    approve: "批准交付",
    events: "动态记录",
    noLink: "等待创作者上传审片版。",
    approvedHint: "已通过 — 可继续上传最终母版并释放付款。",
    paymentHint: "确认最终母版交付后，托管款项将释放。",
    demoNote: "评论与批注在 Frame.io 完成 — 此处不重复实现。"
  }
};

export function BrandReviewRoomPanel({
  locale,
  order,
  session,
  events,
  demoMode
}: {
  locale: Locale;
  order: StoredOrder;
  session: ReviewSession | null;
  events: ReviewEvent[];
  demoMode: boolean;
}) {
  const t = copy[locale];
  const [pending, startTransition] = useTransition();

  const canReview = session?.status === "ready_for_review";
  const isApproved = session?.status === "approved" || order.status === "completed";

  function handleApprove() {
    if (!session) return;
    startTransition(async () => {
      await approveReviewDeliveryAction(session.id, locale);
    });
  }

  function handleRequestChanges() {
    if (!session) return;
    startTransition(async () => {
      await requestReviewChangesAction(session.id, locale);
    });
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-none">
        <CardContent className="p-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{t.project}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{order.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{order.company_name}</p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">{t.version}</dt>
              <dd className="mt-1 font-semibold">V{session?.version_number ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t.status}</dt>
              <dd className="mt-1 font-semibold">
                {session ? reviewSessionStatusLabel(session.status, locale) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{locale === "zh" ? "订单状态" : "Order"}</dt>
              <dd className="mt-1 font-semibold">{order.status}</dd>
            </div>
          </dl>

          <p className="mt-4 text-xs text-muted-foreground">{t.demoNote}</p>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {session?.frame_review_link ? (
              <Button asChild size="lg">
                <Link href={session.frame_review_link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  {t.openRoom}
                </Link>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">{t.noLink}</p>
            )}
            {demoMode ? (
              <p className="mt-2 text-xs text-amber-700">
                {locale === "zh" ? "演示模式：审片链接为模拟地址。" : "Demo mode: review link is simulated."}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!canReview || pending}
              onClick={handleRequestChanges}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              {t.requestChanges}
            </Button>
            <Button disabled={!canReview || pending} onClick={handleApprove}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {t.approve}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isApproved ? (
        <Card className="border-emerald-200 bg-emerald-50 shadow-none">
          <CardContent className="space-y-2 p-5 text-sm text-emerald-950">
            <p className="font-medium">{t.approvedHint}</p>
            <p>{t.paymentHint}</p>
          </CardContent>
        </Card>
      ) : null}

      {events.length ? (
        <Card className="shadow-none">
          <CardContent className="p-6">
            <h2 className="font-semibold">{t.events}</h2>
            <ul className="mt-4 space-y-2">
              {events.map((event) => (
                <li key={event.id} className="rounded-lg border px-3 py-2 text-sm">
                  <span className="font-medium">{event.frame_event_type}</span>
                  <span className="ml-2 text-muted-foreground">{formatDate(event.created_at)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
