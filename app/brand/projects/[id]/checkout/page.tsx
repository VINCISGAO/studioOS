import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BrandCheckoutPanel } from "@/components/studioos/brand-checkout-panel";
import { BrandCheckoutSummary } from "@/components/studioos/brand-checkout-summary";
import { Button } from "@/components/ui/button";
import { getCreatorById } from "@/lib/creator-service";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getOrderForProject } from "@/lib/order-service";
import { isOrderPaymentEscrowed } from "@/lib/order-types";
import { getProject } from "@/lib/project-service";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";
import { setupBrandCampaignPayment } from "@/lib/studioos/brand-checkout-service";
import { estimateDeliveryDays } from "@/lib/studioos/brand-campaign-display";
import { enforceBrandPaymentDeadlineForProject } from "@/lib/studioos/brand-payment-expiry.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { paymentRepository } from "@/features/payment/payment.repository";
import { EscrowState } from "@/features/shared/state-machines/escrow.state-machine";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams & { paid?: string }>;
};

export default async function BrandCheckoutPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const paid = query.paid === "1";
  const clientEmail = await getCurrentClientEmail();
  let project = await getProject(id);

  if (!project) notFound();
  if (clientEmail && project.client_email !== clientEmail.toLowerCase()) {
    redirect(withLocale("/brand", locale));
  }

  await enforceBrandPaymentDeadlineForProject(id);
  project = (await getProject(id)) ?? project;

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

  let prismaEscrowFunded = false;
  if (hasDatabaseUrl()) {
    const campaign = await campaignRepository.findByLegacyProjectId(id);
    if (campaign) {
      const escrow = await paymentRepository.findByCampaignId(campaign.id);
      prismaEscrowFunded =
        escrow?.status === EscrowState.HELD ||
        escrow?.status === EscrowState.PARTIAL_RELEASE ||
        escrow?.status === EscrowState.FULL_RELEASE;
    }
  }

  const orderFunded =
    isOrderPaymentEscrowed(order.payment_status) || paid || prismaEscrowFunded;
  const paidReady = orderFunded;
  const orderCancelled = order.status === "cancelled" || campaignStatus === "cancelled";
  const inProductionPhase = ["production", "in_review", "delivered", "completed"].includes(
    campaignStatus
  );
  const showProductionCta = paidReady && (inProductionPhase || Boolean(creatorId));
  const projectDetailHref = withLocale(
    showProductionCta
      ? `${brandPortalRoutes.project(id)}?tab=production`
      : `${brandPortalRoutes.project(id)}?tab=match`,
    locale
  );

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
            ? "托管付款完成后，系统才会开始匹配 Studio。下单后 3 小时内未付款，订单将自动取消。"
            : "Creator matching starts only after escrow payment. Unpaid orders cancel automatically after 3 hours."}
        </p>
      </div>

      {orderCancelled ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          {locale === "zh"
            ? "该订单已因超时未付款自动取消。如需继续合作，请重新发布 Campaign 或联系平台客服。"
            : "This order was automatically cancelled because payment was not completed within 3 hours."}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)]">
        <BrandCheckoutSummary locale={locale} project={project} deliveryLabel={deliveryLabel} />
        <div className="space-y-5">
          {!orderCancelled ? (
          <BrandCheckoutPanel
            locale={locale}
            order={order}
            projectId={id}
            studioName={studio?.name ?? "Studio"}
            paid={paid}
            escrowFunded={prismaEscrowFunded}
          />
          ) : null}
          {!orderCancelled && paidReady ? (
            <Button asChild size="lg" className="h-12 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700">
              <Link href={projectDetailHref}>
                {showProductionCta
                  ? locale === "zh"
                    ? "查看制作进度"
                    : "View production progress"
                  : locale === "zh"
                    ? "查看项目详情"
                    : "View project details"}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
