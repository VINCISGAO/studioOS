import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BrandCommercialTimeline } from "@/components/studioos/commercial-lifecycle-timeline";
import { BrandProjectHub } from "@/components/studioos/brand-project-hub";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, getOrder, getOrderForProject } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { enforceBrandPaymentDeadlineForProject } from "@/lib/studioos/brand-payment-expiry.service";
import { isBrandAwaitingPayment, resolveBrandCommercialStep } from "@/lib/studioos/commercial-lifecycle";
import { listAcceptedInvitationsForProject, listInvitationsForProject } from "@/lib/studioos/creator-invitation-store";
import { countUnreadBrandNotifications } from "@/lib/studioos/brand-notification-service";
import { listReviewComments } from "@/lib/studioos/review-store";

type HubTab = "brief" | "match" | "proposal" | "production" | "review";

const validTabs = new Set<HubTab>(["brief", "match", "proposal", "production", "review"]);

function defaultTab(status: string): HubTab {
  if (status === "matching" || status === "studio_selected") return "match";
  if (["proposal", "contract_pending", "payment_pending"].includes(status)) return "proposal";
  if (["production", "in_review", "delivered", "completed"].includes(status)) return "production";
  return "brief";
}

export default async function BrandProjectHubPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams & { tab?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const clientEmail = await getCurrentClientEmail();
  let project = await getProject(id);

  if (!project) {
    const order = await getOrder(id);
    if (order?.project_id) {
      redirect(withLocale(brandPortalRoutes.project(order.project_id), locale));
    }
    if (order) {
      redirect(withLocale(brandPortalRoutes.projectReview(id), locale));
    }
    notFound();
  }

  if (clientEmail && project.client_email !== clientEmail.toLowerCase()) {
    redirect(withLocale("/brand", locale));
  }

  await enforceBrandPaymentDeadlineForProject(id);
  project = (await getProject(id)) ?? project;

  const linkedOrder = await getOrderForProject(id);
  const deliverables = linkedOrder ? await getDeliverables(linkedOrder.id) : [];

  const tabParam = query.tab;
  const activeTab: HubTab =
    tabParam && validTabs.has(tabParam as HubTab)
      ? (tabParam as HubTab)
      : defaultTab(project.status);

  if (activeTab === "review") {
    redirect(withLocale(`/brand/projects/${id}/review`, locale));
  }

  if (activeTab === "production" && isBrandAwaitingPayment({ project, order: linkedOrder })) {
    redirect(withLocale(brandPortalRoutes.projectCheckout(id), locale));
  }

  const reviewComments = linkedOrder ? await listReviewComments(linkedOrder.id) : [];
  const projectInvitations = await listInvitationsForProject(id);
  const acceptedInvitations = await listAcceptedInvitationsForProject(id);
  const notificationCount = clientEmail ? await countUnreadBrandNotifications(clientEmail) : 0;
  const brandCommercialStep = resolveBrandCommercialStep({
    project,
    order: linkedOrder,
    invitations: projectInvitations,
    deliverableCount: deliverables.length
  });

  return (
    <div className="space-y-6">
      <Link
        href={withLocale("/brand", locale)}
        className="inline-flex items-center text-sm text-zinc-500 transition hover:text-zinc-900"
      >
        ← {locale === "zh" ? "返回工作台" : "Back to workspace"}
      </Link>
      <BrandCommercialTimeline
        locale={locale}
        currentStep={brandCommercialStep}
        orderStatus={linkedOrder?.status ?? null}
        paymentStatus={linkedOrder?.payment_status ?? null}
        projectStatus={project.status}
        hasOpenComments={reviewComments.some((item) => item.status === "open")}
        compact
      />
      <BrandProjectHub
        locale={locale}
        project={project}
        activeTab={activeTab}
        linkedOrder={linkedOrder}
        deliverables={deliverables}
        reviewComments={reviewComments}
        acceptedInvitations={acceptedInvitations}
        projectInvitations={projectInvitations}
        brandCommercialStep={brandCommercialStep}
        notificationCount={notificationCount}
      />
    </div>
  );
}
