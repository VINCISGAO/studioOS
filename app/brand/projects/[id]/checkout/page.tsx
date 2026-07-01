import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BrandCheckoutPanel } from "@/components/studioos/brand-checkout-panel";
import { BrandCheckoutSummary } from "@/components/studioos/brand-checkout-summary";
import { Button } from "@/components/ui/button";
import { getCreatorById } from "@/lib/creator-service";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getOrderForProject } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";
import { setupBrandCampaignPayment } from "@/lib/studioos/brand-checkout-service";
import { estimateDeliveryDays } from "@/lib/studioos/brand-campaign-display";

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

  if (!order) {
    const created = await setupBrandCampaignPayment({
      project,
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
    redirect(withLocale(`/brand/projects/new?project=${id}&step=3`, locale));
  }

  const studio = creatorId ? await getCreatorById(creatorId) : null;
  const deliveryLabel = estimateDeliveryDays(project.deadline);
  const campaignStatus = normalizeCampaignStatus(project.status);
  const paidReady = order.payment_status !== "unpaid" || paid;
  const showProductionCta =
    paidReady && ["production", "in_review", "delivered", "completed"].includes(campaignStatus);
  const showMatchCta = paidReady && !showProductionCta;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <Link href={withLocale("/brand", locale)} className="text-sm text-zinc-500 hover:text-zinc-900">
          ← {locale === "zh" ? "返回首页" : "Back home"}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
          {locale === "zh" ? "确认订单并付款" : "Confirm & pay"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {locale === "zh"
            ? "托管付款完成后，系统才会开始匹配 Studio。"
            : "Creator matching starts only after escrow payment is complete."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)]">
        <BrandCheckoutSummary locale={locale} project={project} deliveryLabel={deliveryLabel} />
        <div className="space-y-5">
          <BrandCheckoutPanel
            locale={locale}
            order={order}
            projectId={id}
            studioName={studio?.name ?? "Studio"}
            paid={paid}
          />
          {paidReady ? (
            showMatchCta ? (
              <Button asChild size="lg" className="h-12 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700">
                <Link href={withLocale(`/brand/projects/${id}?tab=match`, locale)}>
                  {locale === "zh" ? "开始匹配创作者" : "Start matching creators"}
                </Link>
              </Button>
            ) : showProductionCta ? (
              <Button asChild size="lg" className="h-12 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700">
                <Link href={withLocale(`/brand/projects/${id}?tab=production`, locale)}>
                  {locale === "zh" ? "查看制作进度" : "View production progress"}
                </Link>
              </Button>
            ) : null
          ) : null}
        </div>
      </div>
    </div>
  );
}
