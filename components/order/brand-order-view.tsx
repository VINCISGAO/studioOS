import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, RotateCcw, CheckCircle2 } from "lucide-react";
import { approveDeliveryAction, requestRevisionAction } from "@/app/order-actions";
import { DeliverableNotesBlock } from "@/components/studioos/deliverable-notes-block";
import { OrderPaymentPanel } from "@/components/order/order-payment-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentClientEmail } from "@/lib/client-session";
import { OrderRatingPanel } from "@/components/order/order-rating-panel";
import { getCreatorById } from "@/lib/creator-service";
import { getOrderReview } from "@/lib/order-rating-service";
import type { Locale, SearchParams } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { getDeliverables, getOrder } from "@/lib/order-service";
import { DeliverableVideoPolicyNotice } from "@/components/studioos/deliverable-video-policy-notice";
import {
  deliverableDownloadHref,
  isDeliverableVideoPurged
} from "@/lib/studioos/deliverable-video-policy-shared";
import { formatCurrency, formatDate } from "@/lib/utils";

const copy = {
  en: {
    back: "Back to brand portal",
    backChat: "Production thread",
    studio: "Studio",
    requirements: "Requirements",
    budget: "Budget",
    deliverables: "Deliverables",
    version: "Version",
    download: "Download final",
    purged: "Removed from server (retention policy). Use your saved copy.",
    preparing: "Waiting for creator delivery.",
    revisionTitle: "Request revision",
    revisionPlaceholder: "Add clear revision notes for the creator.",
    revisionButton: "Request revision",
    approveTitle: "Approve delivery",
    approveBody: "Release escrow to the creator once you are satisfied with the deliverables.",
    approveButton: "Approve & complete order",
    completed: "Order completed. Escrow released.",
    unauthorized: "You do not have access to this order.",
    rateTitle: "Rate this studio",
    rateBody: "Your rating feeds the order score system and strengthens AI matching for high-performing studios."
  },
  zh: {
    back: "返回 Brand 门户",
    backChat: "制作线程",
    studio: "Studio",
    requirements: "项目需求",
    budget: "预算",
    deliverables: "交付文件",
    version: "版本",
    download: "下载成品",
    purged: "服务器已按规则自动删除，请使用您本地保存的副本。",
    preparing: "等待创作者提交交付文件。",
    revisionTitle: "申请修改",
    revisionPlaceholder: "请填写清晰的修改意见。",
    revisionButton: "申请修改",
    approveTitle: "确认交付",
    approveBody: "确认满意后，托管款项将释放给创作者。",
    approveButton: "确认交付并完成订单",
    completed: "订单已完成，托管款项已释放。",
    unauthorized: "你无权访问此订单。",
    rateTitle: "为 Studio 打分",
    rateBody: "您的评分会计入历史订单评价，并影响 AI 推荐匹配权重。"
  }
};

export async function BrandOrderView({
  orderId,
  locale,
  searchParams
}: {
  orderId: string;
  locale: Locale;
  searchParams: SearchParams;
}) {
  const t = copy[locale];
  const order = await getOrder(orderId);

  if (!order) {
    notFound();
  }

  const clientEmail = await getCurrentClientEmail();
  if (clientEmail && order.client_email !== clientEmail) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold">{t.unauthorized}</h1>
        <Button asChild className="mt-6">
          <Link href={withLocale("/creators", locale)}>{locale === "zh" ? "浏览创作者" : "Browse creators"}</Link>
        </Button>
      </main>
    );
  }

  const creator = await getCreatorById(order.creator_id);
  const orderDeliverables = await getDeliverables(orderId);
  const showPayPrompt = searchParams.pay === "1";
  const paid = searchParams.paid === "1";
  const completed = searchParams.completed === "1" || searchParams.rated === "1" || order.status === "completed";
  const orderReview = completed ? await getOrderReview(orderId) : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap gap-3">
        <Link href={withLocale("/brand", locale)} className="text-sm text-muted-foreground hover:text-foreground">
          {t.back}
        </Link>
        <Link
          href={withLocale(order.inquiry_id ? `/proposal/${order.inquiry_id}` : `/brand/projects/${order.id}/review`, locale)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {order.payment_status !== "unpaid" && order.status !== "waiting_payment"
            ? locale === "zh"
              ? "Timeline Review"
              : "Timeline Review"
            : locale === "zh"
              ? "Proposal Room"
              : "Proposal Room"}
        </Link>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">{order.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {order.id} · {creator?.name} · {formatDate(order.created_at)}
          </p>
        </div>
        <StatusBadge status={order.status} locale={locale} />
      </div>

      {completed ? (
        <Card className="mt-6 border-emerald-200 bg-emerald-50 shadow-none">
          <CardContent className="flex items-center gap-3 p-5 text-emerald-950">
            <CheckCircle2 className="h-5 w-5" />
            {t.completed}
          </CardContent>
        </Card>
      ) : null}

      {completed ? (
        <OrderRatingPanel
          locale={locale}
          orderId={order.id}
          existingRating={orderReview?.rating ?? null}
          submitted={searchParams.rated === "1"}
        />
      ) : null}

      {paid && order.payment_status === "escrowed" ? (
        <Card className="mt-6 border-emerald-200 bg-emerald-50 shadow-none">
          <CardContent className="p-5 text-sm text-emerald-950">
            {locale === "zh" ? "付款成功，创作者正在制作中。" : "Payment received. Creator is now in production."}
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-[0.68fr_0.32fr]">
        <div className="space-y-5">
          <Card className="shadow-none">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">{t.requirements}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t.budget}</p>
                  <p className="mt-2 font-medium">{order.budget_range}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t.studio}</p>
                  <p className="mt-2 font-medium">{creator?.name}</p>
                </div>
              </div>
              <p className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm leading-6">{order.requirements}</p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">{t.deliverables}</h2>
              <DeliverableVideoPolicyNotice locale={locale} className="mt-4" />
              <div className="mt-5 space-y-3">
                {orderDeliverables.length ? (
                  orderDeliverables.map((deliverable) => {
                    const purged = isDeliverableVideoPurged(deliverable);
                    const downloadHref =
                      order.status === "completed" && !purged
                        ? deliverableDownloadHref(deliverable.file_url)
                        : deliverable.file_url;

                    return (
                    <div key={deliverable.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {t.version} {deliverable.version}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDate(deliverable.created_at)}</p>
                        </div>
                        {purged ? (
                          <p className="text-xs text-muted-foreground">{t.purged}</p>
                        ) : (
                          <Button asChild size="sm" variant="outline">
                            <a href={downloadHref} target="_blank" rel="noreferrer">
                              <Download className="h-4 w-4" /> {t.download}
                            </a>
                          </Button>
                        )}
                      </div>
                      {(() => {
                        const notesView = deliverableNotesForViewer(deliverable, "brand", locale);
                        return notesView ? (
                          <DeliverableNotesBlock locale={locale} view={notesView} className="mt-3" />
                        ) : null;
                      })()}
                    </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">{t.preparing}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <OrderPaymentPanel locale={locale} order={order} showPayPrompt={Boolean(showPayPrompt)} />

          {order.status === "review" || order.status === "revision" ? (
            <>
              <Card className="shadow-none">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold">{t.approveTitle}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.approveBody}</p>
                  <form action={approveDeliveryAction} className="mt-4">
                    <input type="hidden" name="lang" value={locale} />
                    <input type="hidden" name="order_id" value={order.id} />
                    <Button type="submit" className="w-full">
                      <CheckCircle2 className="h-4 w-4" /> {t.approveButton}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold">{t.revisionTitle}</h2>
                  <form action={requestRevisionAction} className="mt-4 grid gap-3">
                    <input type="hidden" name="lang" value={locale} />
                    <input type="hidden" name="order_id" value={order.id} />
                    <Textarea name="revision_notes" placeholder={t.revisionPlaceholder} />
                    <Button variant="outline">
                      <RotateCcw className="h-4 w-4" /> {t.revisionButton}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
