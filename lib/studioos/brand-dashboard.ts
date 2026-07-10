import type { StoredOrder } from "@/lib/order-types";
import type { StoredProject } from "@/lib/project-types";
import { canDeleteOrder } from "@/lib/order-service";
import { projectCta, projectHref, canDeleteProject } from "@/lib/project-service";
import { brandCampaignHref } from "@/lib/studioos/brand-campaign-display";
import { isBrandPaymentTimeoutCancellation } from "@/lib/studioos/brand-payment-deadline";
import { isVisibleBrandDraftProject } from "@/lib/studioos/brand-wizard-session";
import { normalizeCampaignStatus, type CampaignProjectStatus } from "@/lib/studioos/project-status";

export type BrandDashboardMetrics = {
  projectCount: number;
  adsDelivered: number;
  avgProductionDays: number;
  monthSpend: number;
};

export function computeBrandMetrics(
  orders: StoredOrder[],
  projects: StoredProject[] = []
): BrandDashboardMetrics {
  const completedOrders = orders.filter((o) => o.status === "completed");
  const completedProjects = projects.filter((p) => p.status === "completed");
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthSpend = orders
    .filter((o) => o.payment_status !== "unpaid" && o.paid_at && new Date(o.paid_at) >= monthStart)
    .reduce((sum, o) => sum + o.amount, 0);

  const activeProjects = projects.filter(
    (p) => !["completed", "cancelled"].includes(p.status) && isVisibleBrandDraftProject(p)
  );
  const activeOrders = orders.filter((o) => !["completed", "cancelled"].includes(o.status));

  return {
    projectCount: activeProjects.length + activeOrders.length,
    adsDelivered: completedOrders.length + completedProjects.length,
    avgProductionDays: completedOrders.length ? 2.8 : 0,
    monthSpend
  };
}

export type BrandProjectRow = {
  id: string;
  kind: "campaign" | "order";
  name: string;
  status: CampaignProjectStatus | string;
  updatedAt: string;
  href: string;
  cta: string;
  category?: string;
  budgetRange?: string;
  deadline?: string;
  wizardStep?: number;
  progress?: number;
  canDelete?: boolean;
  paymentExpired?: boolean;
  phase: "draft" | "active" | "done";
  thumbnailUrl?: string;
};

function projectPhase(status: string): BrandProjectRow["phase"] {
  const normalized = normalizeCampaignStatus(status);
  if (normalized === "draft") return "draft";
  if (["delivered", "completed", "cancelled"].includes(normalized)) return "done";
  return "active";
}

export function toBrandProjectRows(
  orders: StoredOrder[],
  projects: StoredProject[],
  locale: "en" | "zh"
): BrandProjectRow[] {
  const projectIds = new Set(projects.map((project) => project.id));
  const orderByProjectId = new Map(
    orders
      .filter((order) => order.project_id)
      .map((order) => [order.project_id as string, order])
  );

  const campaignRows: BrandProjectRow[] = projects
    .filter(isVisibleBrandDraftProject)
    .map((project) => {
      const status = normalizeCampaignStatus(project.status);
      const linkedOrder = orderByProjectId.get(project.id);
      const paymentExpired = linkedOrder ? isBrandPaymentTimeoutCancellation(linkedOrder) : false;
      return {
        id: project.id,
        kind: "campaign",
        name: project.title || project.product_name || project.campaign_goal || project.company_name,
        status,
        updatedAt: project.updated_at ?? project.created_at,
        href: paymentExpired ? "/brand/projects/new" : projectHref(project),
        cta: paymentExpired
          ? locale === "zh"
            ? "重新下单"
            : "Create new order"
          : projectCta(project, locale),
        category: project.category || undefined,
        budgetRange: project.budget_range || undefined,
        deadline: project.deadline || undefined,
        wizardStep: status === "draft" ? project.wizard_step : undefined,
        progress:
          status === "draft"
            ? Math.round((project.wizard_completed_steps.length / 7) * 100)
            : undefined,
        canDelete: canDeleteProject(status),
        paymentExpired,
        phase: projectPhase(status)
      };
    });

  const orderRows: BrandProjectRow[] = orders
    .filter((order) => !order.project_id || !projectIds.has(order.project_id))
    .map((order) => {
      const paymentExpired = isBrandPaymentTimeoutCancellation(order);
      return {
        id: order.id,
        kind: "order",
        name: order.title || order.company_name,
        status: order.status,
        updatedAt: order.completed_at ?? order.paid_at ?? order.created_at,
        href: paymentExpired
          ? "/brand/projects/new"
          : brandCampaignHref({
              id: order.id,
              kind: "order",
              status: order.status,
              projectId: order.project_id
            }),
        cta:
          paymentExpired
            ? locale === "zh"
              ? "重新下单"
              : "Create new order"
            : order.status === "waiting_payment"
              ? locale === "zh"
                ? "去付款"
                : "Pay now"
              : locale === "zh"
                ? "打开订单"
                : "Open order",
        paymentExpired,
        phase: projectPhase(order.status),
        canDelete: canDeleteOrder(order)
      };
    });

  return [...campaignRows, ...orderRows].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
