import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Banknote, Clapperboard, ShieldCheck, UploadCloud } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentCreatorId } from "@/lib/creator-session";
import { creators, deposits } from "@/lib/data";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, getOrder } from "@/lib/order-service";
import { formatCurrency, formatDate } from "@/lib/utils";

const copy = {
  en: {
    back: "Back to creator desk",
    title: "Creator order",
    escrow: "Escrow",
    payout: "Creator payout",
    deposit: "Deposit",
    brief: "Production brief",
    upload: "Submit deliverable",
    file: "Video / file URL",
    thumbnail: "Thumbnail URL (optional)",
    notes: "Delivery notes",
    submit: "Submit for client review",
    notFound: "Order not found",
    previous: "Previous versions",
    review: "Open video review",
    waitingPayment: "Waiting for brand payment before production starts.",
    completed: "Order completed. Payout approved."
  },
  zh: {
    back: "返回承接人中心",
    title: "承接订单",
    escrow: "托管金额",
    payout: "承接人收入",
    deposit: "保证金",
    brief: "制作需求",
    upload: "提交交付文件",
    file: "视频 / 文件链接",
    thumbnail: "缩略图链接（可选）",
    notes: "交付说明",
    submit: "提交给客户审核",
    notFound: "未找到订单",
    previous: "历史版本",
    review: "打开视频审片",
    waitingPayment: "等待品牌方付款后开始制作。",
    completed: "订单已完成，收入已批准释放。"
  }
};

type CreatorOrderPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export const dynamic = "force-dynamic";

export default async function CreatorOrderPage({ params, searchParams }: CreatorOrderPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const t = copy[locale];
  const creatorId = await getCurrentCreatorId();
  const order = await getOrder(id);

  if (!order || !creatorId || order.creator_id !== creatorId) {
    return (
      <PageShell locale={locale}>
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-3xl font-semibold">{t.notFound}</h1>
          <Button asChild className="mt-6">
            <Link href={withLocale("/creator", locale)}>{t.back}</Link>
          </Button>
        </main>
      </PageShell>
    );
  }

  const creator = creators.find((item) => item.id === order.creator_id);
  const deposit = creator ? deposits.find((item) => item.creator_id === creator.id) : undefined;
  const orderDeliverables = await getDeliverables(order.id);
  const canDeliver = ["in_production", "revision"].includes(order.status);

  return (
    <PageShell locale={locale}>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Button asChild variant="outline" size="sm">
          <Link href={withLocale("/creator", locale)}>
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </Link>
        </Button>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t.title}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">{order.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {order.client_name} · {formatDate(order.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} locale={locale} />
            <Button asChild variant="outline" size="sm">
              <Link href={withLocale(`/creator/orders/${order.id}/review-upload`, locale)}>
                <Clapperboard className="h-4 w-4" /> {t.review}
              </Link>
            </Button>
          </div>
        </div>

        {order.status === "waiting_payment" ? (
          <Card className="mt-6 border-amber-200 bg-amber-50 shadow-none">
            <CardContent className="p-5 text-sm text-amber-950">{t.waitingPayment}</CardContent>
          </Card>
        ) : null}

        {order.status === "completed" ? (
          <Card className="mt-6 border-emerald-200 bg-emerald-50 shadow-none">
            <CardContent className="p-5 text-sm text-emerald-950">{t.completed}</CardContent>
          </Card>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Metric icon={Banknote} label={t.escrow} value={formatCurrency(order.amount)} note={order.payment_status} />
          <Metric icon={Banknote} label={t.payout} value={formatCurrency(order.creator_payout)} note={order.payout_status} />
          <Metric icon={ShieldCheck} label={t.deposit} value={formatCurrency(deposit?.amount ?? 0)} note={deposit?.status ?? "unpaid"} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.56fr_0.44fr]">
          <Card className="shadow-none">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">{t.brief}</h2>
              <div className="mt-5 space-y-3 text-sm leading-6">
                <p>
                  <span className="text-muted-foreground">{locale === "zh" ? "预算：" : "Budget: "}</span>
                  {order.budget_range}
                </p>
                <p className="rounded-lg border bg-muted/30 p-4">{order.requirements}</p>
              </div>
              {orderDeliverables.length ? (
                <div className="mt-6">
                  <h3 className="font-semibold">{t.previous}</h3>
                  <div className="mt-3 space-y-2">
                    {orderDeliverables.map((item) => (
                      <div key={item.id} className="rounded-lg border p-3 text-sm">
                        v{item.version} · {formatDate(item.created_at)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">{t.upload}</h2>
                <Badge variant="warning">
                  <UploadCloud className="mr-1 h-3.5 w-3.5" />
                  v{orderDeliverables.length + 1}
                </Badge>
              </div>
              {canDeliver || order.status === "review" ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  {locale === "zh"
                    ? "上传与审片已迁移至 Studio 审片页，支持 MP4 文件和多版本管理。"
                    : "Upload and review live on the Studio review page with MP4 uploads and version history."}
                </p>
              ) : (
                <p className="mt-6 text-sm text-muted-foreground">
                  {locale === "zh"
                    ? "当前阶段不可提交交付。"
                    : "Delivery submission is not available in the current stage."}
                </p>
              )}
              <Button asChild className="mt-4">
                <Link href={withLocale(`/creator/orders/${order.id}/review-upload`, locale)}>
                  <UploadCloud className="h-4 w-4" /> {t.review}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </PageShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  note
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-5">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <p className="mt-5 text-sm text-muted-foreground">{label}</p>
        <div className="mt-2 text-3xl font-semibold">{value}</div>
        <p className="mt-2 text-xs uppercase text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}
