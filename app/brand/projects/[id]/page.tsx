import { notFound, redirect } from "next/navigation";
import { BrandProjectHub } from "@/components/studioos/brand-project-hub";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getDeliverables, getOrder, getOrderForProject } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { listReviewComments } from "@/lib/studioos/review-store";

type HubTab = "brief" | "match" | "proposal" | "production" | "review";

const validTabs = new Set<HubTab>(["brief", "match", "proposal", "production", "review"]);

function defaultTab(status: string): HubTab {
  if (status === "matching" || status === "studio_selected") return "match";
  if (["proposal", "contract_pending", "payment_pending"].includes(status)) return "proposal";
  if (status === "production") return "production";
  if (["in_review", "delivered", "completed"].includes(status)) return "review";
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
  const project = await getProject(id);

  if (!project) {
    const order = await getOrder(id);
    if (order) {
      redirect(withLocale(`/orders/${id}`, locale));
    }
    notFound();
  }

  if (clientEmail && project.client_email !== clientEmail.toLowerCase()) {
    redirect(withLocale("/brand", locale));
  }

  const tabParam = query.tab;
  const activeTab: HubTab =
    tabParam && validTabs.has(tabParam as HubTab) ? (tabParam as HubTab) : defaultTab(project.status);

  const linkedOrder = await getOrderForProject(id);
  const deliverables = linkedOrder ? await getDeliverables(linkedOrder.id) : [];
  const reviewComments = linkedOrder ? await listReviewComments(linkedOrder.id) : [];

  return (
    <BrandProjectHub
      locale={locale}
      project={project}
      activeTab={activeTab}
      linkedOrder={linkedOrder}
      deliverables={deliverables}
      reviewComments={reviewComments}
    />
  );
}
