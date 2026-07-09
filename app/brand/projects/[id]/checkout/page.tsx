import { getAppUiLocale } from "@/lib/app-language";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandCheckoutPanel } from "@/components/studioos/brand-checkout-panel";
import { BrandCheckoutSummary } from "@/components/studioos/brand-checkout-summary";
import { getCreatorById } from "@/lib/creator-service";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { getOrderForProject, markLegacyOrderPaidForProject } from "@/lib/order-service";
import { isOrderPaymentEscrowed } from "@/lib/order-types";
import { getProject } from "@/lib/project-service";
import { getCurrentSession } from "@/lib/session-user";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";
import { setupBrandCampaignPayment } from "@/lib/studioos/brand-checkout-service";
import { estimateDeliveryDays } from "@/lib/studioos/brand-campaign-display";
import { enforceBrandPaymentDeadlineForProject } from "@/lib/studioos/brand-payment-expiry.service";
import { BRAND_PAYMENT_TIMEOUT_CANCEL_REASON } from "@/lib/studioos/brand-payment-deadline";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { paymentRepository } from "@/features/payment/payment.repository";
import { EscrowState } from "@/features/shared/state-machines/escrow.state-machine";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

function readCancellationReason(
  project: { settings_json?: Record<string, unknown> },
  locale: "en" | "zh",
  orderReason?: string | null
) {
  if (orderReason === BRAND_PAYMENT_TIMEOUT_CANCEL_REASON) {
    return locale === "zh"
      ? "已超时，请重新下单。"
      : "Payment expired. Please create a new order.";
  }
  if (orderReason?.trim()) return orderReason.trim();
  const cancellation = project.settings_json?.cancellation;
  if (!cancellation || typeof cancellation !== "object" || Array.isArray(cancellation)) {
    return null;
  }
  const reason = (cancellation as { reason?: unknown }).reason;
  if (reason === BRAND_PAYMENT_TIMEOUT_CANCEL_REASON) {
    return locale === "zh"
      ? "已超时，请重新下单。"
      : "Payment expired. Please create a new order.";
  }
  return typeof reason === "string" && reason.trim() ? reason.trim() : null;
}

export default async function BrandCheckoutPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = await getAppUiLocale();
  const session = await getCurrentSession();
  if (!session || session.role !== "client") {
    redirect(withLocale(`/login?role=brand&next=${encodeURIComponent(`/brand/projects/${id}/checkout?lang=${locale}`)}`, locale));
  }
  const clientEmail = session.email.toLowerCase();
  let project = await getProject(id);

  if (!project) redirect(withLocale(brandPortalRoutes.dashboard, locale));
  if (project.client_email !== clientEmail) {
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

  if (prismaEscrowFunded || isOrderPaymentEscrowed(order.payment_status)) {
    order = (await markLegacyOrderPaidForProject(id)) ?? order;
  }

  const orderFunded = isOrderPaymentEscrowed(order.payment_status) || prismaEscrowFunded;
  const paidReady = orderFunded;
  const orderCancelled = order.status === "cancelled" || campaignStatus === "cancelled";
  const cancelReason = readCancellationReason(project, locale, order.cancel_reason);
  const projectAlreadyStarted = ["production", "in_review", "delivered", "completed"].includes(campaignStatus);
  if (!orderCancelled && projectAlreadyStarted) {
    redirect(withLocale(`${brandPortalRoutes.project(id)}?tab=proposal`, locale));
  }
  const projectDetailHref = withLocale(
    `${brandPortalRoutes.project(id)}?tab=match&matching=1`,
    locale
  );
  if (!orderCancelled && paidReady) {
    redirect(projectDetailHref);
  }

  return (
    <div className="mx-auto max-w-[1040px] space-y-6 pb-10">
      <div>
        <Link href={withLocale("/brand", locale)} className="text-sm text-zinc-500 hover:text-zinc-900">
          ← {locale === "zh" ? "返回首页" : "Back home"}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
          {locale === "zh" ? "确认订单并付款" : "Confirm & pay"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {locale === "zh"
            ? "托管付款完成后，系统才会开始匹配 Studio。下单后 30 分钟内未付款，订单将自动取消。"
            : "Creator matching starts only after escrow payment. Unpaid orders cancel automatically after 30 minutes."}
        </p>
      </div>

      {orderCancelled ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          {cancelReason ? (
            <div className="space-y-1">
              <p>{locale === "zh" ? "该项目已取消。" : "This project has been cancelled."}</p>
              <p>
                {locale === "zh" ? "取消原因：" : "Reason: "}
                {cancelReason}
              </p>
            </div>
          ) : locale === "zh" ? (
            "该订单已因超时未付款自动取消。如需继续合作，请重新发布 Campaign 或联系平台客服。"
          ) : (
            "This order was automatically cancelled because payment was not completed within 30 minutes."
          )}
        </div>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,620px)_352px]">
        <BrandCheckoutSummary locale={locale} project={project} order={order} deliveryLabel={deliveryLabel} />
        <div className="mt-0 self-start space-y-5 lg:-mt-5">
          {!orderCancelled ? (
            <BrandCheckoutPanel
              locale={locale}
              order={order}
              projectId={id}
              studioName={studio?.name ?? "Studio"}
              escrowFunded={prismaEscrowFunded}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
