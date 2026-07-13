import { getAppUiLocale } from "@/lib/app-language";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BrandCheckoutPanel } from "@/components/studioos/brand-checkout-panel";
import { BrandCheckoutSummary } from "@/components/studioos/brand-checkout-summary";
import { BrandPaymentDeadlineNotice } from "@/components/studioos/brand-payment-deadline-notice";
import { WizardStepper } from "@/components/studioos/ui/wizard-stepper";
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
import { isLegacyOrderFunded, isPrismaEscrowFundedForProject } from "@/lib/studioos/brand-payment-funding";
import { readBrandDisplayBudgetInput } from "@/lib/studioos/brand-budget-display-input";
import { BRAND_PAYMENT_TIMEOUT_CANCEL_REASON } from "@/lib/studioos/brand-payment-deadline";
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
  const [{ id }, , locale, session] = await Promise.all([
    params,
    searchParams,
    getAppUiLocale(),
    getCurrentSession()
  ]);
  if (!session || session.role !== "client") {
    redirect(withLocale(`/login?role=brand&next=${encodeURIComponent(`/brand/projects/${id}/checkout?lang=${locale}`)}`, locale));
  }
  const clientEmail = session.email.toLowerCase();
  let [project, order] = await Promise.all([getProject(id), getOrderForProject(id)]);

  if (!project) notFound();
  if (project.client_email !== clientEmail) {
    notFound();
  }

  const expired = await enforceBrandPaymentDeadlineForProject(id);
  if (expired) {
    const [refreshedProject, refreshedOrder] = await Promise.all([
      getProject(id),
      getOrderForProject(id)
    ]);
    if (!refreshedProject) notFound();
    project = refreshedProject;
    order = refreshedOrder;
  }

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

  const [studio, prismaEscrowFunded] = await Promise.all([
    creatorId ? getCreatorById(creatorId) : null,
    hasDatabaseUrl() ? isPrismaEscrowFundedForProject(id) : Promise.resolve(false)
  ]);
  const deliveryLabel = estimateDeliveryDays(project.deadline);
  const campaignStatus = normalizeCampaignStatus(project.status);

  if (prismaEscrowFunded || isOrderPaymentEscrowed(order.payment_status)) {
    order = (await markLegacyOrderPaidForProject(id)) ?? order;
  }

  const paidReady = isLegacyOrderFunded(order) || prismaEscrowFunded;
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

  const displayBudgetInput = readBrandDisplayBudgetInput(project);

  return (
    <div className="min-h-[calc(100dvh-7rem)] rounded-[2rem] bg-[#f8f9fb] px-3 pb-8 pt-4 sm:px-4 sm:pt-5 lg:px-5 lg:pt-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <WizardStepper locale={locale} currentStep={3} variant="brand" />

        <div className="rounded-2xl border border-violet-100 bg-white/80 px-5 py-3 text-sm leading-6 text-violet-700 shadow-sm">
          {locale === "zh"
            ? "资金进入平台托管后才会启动 AI 匹配、邀请与 Creator 响应流程。"
            : "Escrow funding unlocks AI matching, invitations, and creator responses."}
        </div>

        <header className="pt-1">
          <Link href={withLocale("/brand", locale)} className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
            ← {locale === "zh" ? "返回首页" : "Back home"}
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            {locale === "zh" ? "确认订单并付款" : "Confirm & pay"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500 sm:text-base sm:leading-7">
            {locale === "zh"
              ? "托管付款完成后，系统才会开始匹配 Creator。"
              : "Creator matching starts only after escrow payment."}
          </p>
        </header>

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

        <div>
          {!orderCancelled ? (
            <BrandCheckoutPanel
              locale={locale}
              order={order}
              projectId={id}
              studioName={studio?.name ?? "Studio"}
              escrowFunded={prismaEscrowFunded}
              displayBudgetInput={displayBudgetInput}
              deadlineNotice={
                <BrandPaymentDeadlineNotice
                  locale={locale}
                  order={order}
                  className="border-amber-200 bg-amber-50/80"
                />
              }
              summaryColumn={
                <BrandCheckoutSummary
                  locale={locale}
                  project={project}
                  order={order}
                  deliveryLabel={deliveryLabel}
                />
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
