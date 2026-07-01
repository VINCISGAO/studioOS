import type { OrderStore, StoredOrder } from "@/lib/order-types";
import type { ProjectStore, StoredProject } from "@/lib/project-types";
import { dataStorePath, readDataJson } from "@/lib/serverless-store";
import type { CampaignProjectStatus } from "@/lib/studioos/project-status";

function mapOrderToProjectStatus(order: StoredOrder): CampaignProjectStatus {
  if (order.status === "waiting_payment" || order.payment_status === "unpaid") {
    return "payment_pending";
  }
  if (order.status === "completed") return "completed";
  if (order.status === "cancelled") return "cancelled";
  if (order.status === "review") return "in_review";
  if (order.status === "revision" || order.status === "in_production") return "production";
  return "production";
}

function projectFromOrder(order: StoredOrder): StoredProject {
  const createdAt = order.created_at ?? new Date().toISOString();
  const status = mapOrderToProjectStatus(order);
  const title = order.title.replace(/\s*—\s*.*$/, "").trim() || order.company_name;

  return {
    id: order.project_id!,
    org_id: null,
    created_by: order.client_email.toLowerCase(),
    client_email: order.client_email.toLowerCase(),
    client_name: order.client_name,
    company_name: order.company_name,
    title,
    status,
    wizard_step: status === "draft" ? 1 : 6,
    wizard_completed_steps: status === "draft" ? [] : [1, 2, 3, 4, 5, 6],
    visibility: "invite_only",
    settings_json: {},
    product_url: "",
    product_name: title,
    commercial_objective: "launch",
    commercial_objective_note: "",
    category: "",
    target_market: [],
    target_audience: "",
    style_presets: [],
    video_lengths: [],
    aspect_ratios: [],
    output_quantity: 1,
    budget_range: order.budget_range ?? "",
    budget_min: null,
    budget_max: null,
    deadline: "",
    selected_studio_id: order.creator_id ?? null,
    published_at: status === "draft" ? null : createdAt,
    email: order.client_email.toLowerCase(),
    target_platform: "",
    video_format: "",
    video_count: 1,
    brand_style: "",
    reference_links: "",
    campaign_goal: order.requirements?.slice(0, 240) ?? title,
    notes: "",
    updated_at: order.paid_at ?? order.completed_at ?? createdAt,
    created_at: createdAt
  };
}

/** Rebuild project rows referenced by orders when project-store.json lost them. */
export async function repairMissingProjects(store: ProjectStore): Promise<{
  store: ProjectStore;
  changed: boolean;
}> {
  const existing = new Set(store.projects.map((item) => item.id));
  const additions: StoredProject[] = [];

  const orderStore = await readDataJson<OrderStore>(dataStorePath("order-store.json"), async () => ({
    quotes: [],
    orders: [],
    deliverables: []
  }));

  const deleted = new Set(store.deleted_project_ids ?? []);

  for (const order of orderStore.orders) {
    const projectId = order.project_id;
    if (!projectId || existing.has(projectId) || deleted.has(projectId)) continue;
    additions.push(projectFromOrder(order));
    existing.add(projectId);
  }

  if (!additions.length) {
    return { store, changed: false };
  }

  return {
    store: { ...store, projects: [...additions, ...store.projects] },
    changed: true
  };
}
