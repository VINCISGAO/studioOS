import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Calendar, CheckCircle2, Clock3, Shield } from "lucide-react";
import { BrandCheckoutPanel } from "@/components/studioos/brand-checkout-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCreatorById } from "@/lib/creator-service";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getOrderForProject } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { setupBrandCheckout } from "@/lib/studioos/brand-checkout-service";
import { estimateDeliveryDays } from "@/lib/studioos/brand-campaign-display";
import { formatCurrency } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams & { paid?: string }>;
};

export default async function BrandCheckoutPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const paid = query.paid === "1";
  const clientEmail = await getCurrentClientEmail();
  const project = await getProject(id);

  if (!project) notFound();
  if (clientEmail && project.client_email !== clientEmail.toLowerCase()) {
    redirect(withLocale("/brand", locale));
  }

  let order = await getOrderForProject(id);
  const creatorId = project.selected_studio_id;

  if (!order && creatorId) {
    const creator = await getCreatorById(creatorId);
    const { order: created } = await setupBrandCheckout({
      project,
      creatorId,
      workId: null,
      client: {
        client_name: project.client_name,
        client_email: project.client_email,
        company_name: project.company_name
      },
      locale
    });
    order = created;
  }

  if (!order) {
    redirect(withLocale(`/brand/projects/${id}/studios`, locale));
  }

  const studio = creatorId ? await getCreatorById(creatorId) : null;
  const deliveryLabel = estimateDeliveryDays(project.deadline);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link href={withLocale("/brand", locale)} className="text-sm text-zinc-500 hover:text-zinc-900">
          ← {locale === "zh" ? "返回首页" : "Back home"}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          {locale === "zh" ? "确认订单并付款" : "Confirm & pay"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {locale === "zh"
            ? "托管付款后 Studio 开始制作。款项在你确认交付前不会释放。"
            : "Pay into escrow to start production. Funds release only after you approve delivery."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          <Card className="border-zinc-200/80 shadow-sm">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {locale === "zh" ? "Campaign 摘要" : "Campaign summary"}
              </p>
              <h2 className="mt-2 text-xl font-semibold">{project.title || project.product_name}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {project.campaign_goal || project.notes || "—"}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {project.target_platform ? <Badge variant="secondary">{project.target_platform}</Badge> : null}
                {project.video_format ? <Badge variant="outline">{project.video_format}</Badge> : null}
                {(project.video_count ?? project.output_quantity) ? (
                  <Badge variant="outline">
                    {project.video_count ?? project.output_quantity}{" "}
                    {locale === "zh" ? "支视频" : "videos"}
                  </Badge>
                ) : null}
              </div>

              <dl className="mt-6 space-y-3 border-t border-zinc-100 pt-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">{locale === "zh" ? "预算区间" : "Budget range"}</dt>
                  <dd className="font-medium">{project.budget_range || "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="flex items-center gap-1.5 text-zinc-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {locale === "zh" ? "截止日期" : "Deadline"}
                  </dt>
                  <dd className="font-medium">{project.deadline || "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="flex items-center gap-1.5 text-zinc-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    {locale === "zh" ? "预计交付" : "Est. delivery"}
                  </dt>
                  <dd className="font-medium">{deliveryLabel}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {studio ? (
            <Card className="border-zinc-200/80 shadow-sm">
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Studio</p>
                <h3 className="mt-2 text-lg font-semibold">{studio.name}</h3>
                <p className="mt-1 text-sm text-zinc-600">{studio.headline}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary">⭐ {studio.rating}</Badge>
                  {studio.specialties.slice(0, 2).map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
                <Button asChild variant="link" className="mt-3 h-auto p-0">
                  <Link href={withLocale(`/creators/${studio.id}`, locale)}>
                    {locale === "zh" ? "查看 Studio 主页" : "View studio profile"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-zinc-200/80 bg-zinc-50/50 shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-zinc-700" />
              <div className="text-sm leading-6 text-zinc-600">
                {locale === "zh" ? (
                  <>
                    <strong className="font-medium text-zinc-900">托管保障：</strong>
                    付款进入平台托管账户，Studio 完成交付并经你审片确认后，款项才会释放。
                  </>
                ) : (
                  <>
                    <strong className="font-medium text-zinc-900">Escrow protection:</strong> Payment is held
                    until you review and approve the final deliverables.
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="border-zinc-900/10 shadow-sm ring-1 ring-zinc-900/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-500">{locale === "zh" ? "应付金额" : "Amount due"}</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight">{formatCurrency(order.amount)}</p>
                </div>
                {order.payment_status !== "unpaid" || paid ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                ) : null}
              </div>
            </CardContent>
          </Card>

          <BrandCheckoutPanel
            locale={locale}
            order={order}
            projectId={id}
            studioName={studio?.name ?? "Studio"}
            paid={paid}
          />

          {order.payment_status !== "unpaid" || paid ? (
            <Button asChild size="lg" className="h-12 w-full rounded-full">
              <Link href={withLocale(`/brand/projects/${id}?tab=production`, locale)}>
                {locale === "zh" ? "查看制作进度" : "View production progress"}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
