import type { CopilotContext } from "@/lib/studioos/copilot";
import type { StoredOrder } from "@/lib/order-types";
import type { StoredProject } from "@/lib/project-types";

export type CopilotProjectOption = {
  id: string;
  label: string;
  brandName: string;
  context: CopilotContext;
};

export function orderToCopilotOption(
  order: StoredOrder,
  project?: StoredProject | null
): CopilotProjectOption {
  const brandName = order.company_name || order.client_name;
  const context: CopilotContext = {
    projectTitle: order.title || project?.title || brandName,
    productUrl: project?.product_url || "",
    campaignGoal: project?.campaign_goal || project?.commercial_objective || order.requirements,
    audience: project?.target_audience || "",
    style: project?.brand_style || project?.style_presets?.join(", ") || "",
    requirements: order.requirements,
    brandName,
    platform: project?.target_platform || "",
    budgetRange: order.budget_range || project?.budget_range || ""
  };

  return {
    id: order.id,
    label: order.title || brandName,
    brandName,
    context
  };
}

export function emptyCopilotContext(): CopilotContext {
  return {
    projectTitle: "",
    productUrl: "",
    campaignGoal: "",
    audience: "",
    style: "",
    requirements: "",
    brandName: "",
    platform: "",
    budgetRange: ""
  };
}
