import type {
  AiCopilotContext,
  AiCopilotToolResult
} from "@/features/ai-copilot/ai-copilot.types";

type ToolName =
  | "get_current_user"
  | "get_brand_summary"
  | "get_creator_summary"
  | "get_campaign_status"
  | "get_order_status"
  | "get_payment_status"
  | "get_wallet_summary"
  | "get_review_status"
  | "get_matching_explanation"
  | "get_budget_score"
  | "get_attribution_summary"
  | "get_ai_memory_summary"
  | "get_notifications"
  | "get_timeline";

const ROLE_TOOLS: Record<string, ToolName[]> = {
  BRAND: [
    "get_current_user",
    "get_brand_summary",
    "get_campaign_status",
    "get_order_status",
    "get_payment_status",
    "get_review_status",
    "get_matching_explanation",
    "get_budget_score",
    "get_attribution_summary",
    "get_ai_memory_summary",
    "get_notifications",
    "get_timeline"
  ],
  CREATOR: [
    "get_current_user",
    "get_creator_summary",
    "get_order_status",
    "get_wallet_summary",
    "get_review_status",
    "get_matching_explanation",
    "get_ai_memory_summary",
    "get_notifications",
    "get_timeline"
  ],
  ADMIN: [
    "get_current_user",
    "get_brand_summary",
    "get_creator_summary",
    "get_campaign_status",
    "get_order_status",
    "get_payment_status",
    "get_wallet_summary",
    "get_review_status",
    "get_matching_explanation",
    "get_budget_score",
    "get_attribution_summary",
    "get_ai_memory_summary",
    "get_notifications",
    "get_timeline"
  ],
  SUPPORT: [
    "get_current_user",
    "get_campaign_status",
    "get_order_status",
    "get_payment_status",
    "get_review_status",
    "get_notifications",
    "get_timeline"
  ]
};

function textIncludes(input: string, values: string[]) {
  const normalized = input.toLowerCase();
  return values.some((value) => normalized.includes(value));
}

function pickTools(message: string, role: string): ToolName[] {
  const allowed = ROLE_TOOLS[role] ?? ROLE_TOOLS.BRAND;
  const picked = new Set<ToolName>(["get_current_user", "get_notifications"]);

  if (role === "BRAND") picked.add("get_brand_summary");
  if (role === "CREATOR") picked.add("get_creator_summary");
  if (role === "ADMIN" || role === "SUPPORT") picked.add("get_timeline");

  if (textIncludes(message, ["campaign", "project", "项目", "活动", "下一步", "step"])) {
    picked.add("get_campaign_status");
    picked.add("get_timeline");
  }
  if (textIncludes(message, ["order", "订单", "delivery", "交付"])) picked.add("get_order_status");
  if (textIncludes(message, ["payment", "付款", "支付", "提现", "wallet", "收益", "收入"])) {
    picked.add("get_payment_status");
    picked.add("get_wallet_summary");
  }
  if (textIncludes(message, ["review", "审片", "revision", "修改"])) picked.add("get_review_status");
  if (textIncludes(message, ["creator", "推荐", "match", "匹配", "邀请", "invite"])) {
    picked.add("get_matching_explanation");
  }
  if (textIncludes(message, ["budget", "预算", "合理"])) picked.add("get_budget_score");
  if (textIncludes(message, ["ad", "ads", "广告", "归因", "attribution", "utm", "流量"])) {
    picked.add("get_attribution_summary");
  }
  if (textIncludes(message, ["memory", "learning", "学习", "记忆", "dna"])) picked.add("get_ai_memory_summary");

  return [...picked].filter((tool) => allowed.includes(tool)).slice(0, 6);
}

function outputForTool(toolName: ToolName, context: AiCopilotContext): Record<string, unknown> {
  const summaries = context.summaries;
  switch (toolName) {
    case "get_current_user":
      return { user: context.user, language: context.language, country: context.country, timezone: context.timezone };
    case "get_brand_summary":
      return { brand: summaries.brand ?? null, campaigns: summaries.campaigns ?? [] };
    case "get_creator_summary":
      return { creator: summaries.creator ?? null, invitations: summaries.invitations ?? [] };
    case "get_campaign_status":
      return { campaigns: summaries.campaigns ?? [], platform: summaries.platform ?? null };
    case "get_order_status":
      return { orders: summaries.orders ?? [], platform: summaries.platform ?? null };
    case "get_payment_status":
      return { orders: summaries.orders ?? [], wallet: summaries.wallet ?? null, platform: summaries.platform ?? null };
    case "get_wallet_summary":
      return { wallet: summaries.wallet ?? null, platform: summaries.platform ?? null };
    case "get_review_status":
      return { campaigns: summaries.campaigns ?? [], orders: summaries.orders ?? [] };
    case "get_matching_explanation":
      return { campaigns: summaries.campaigns ?? [], invitations: summaries.invitations ?? [] };
    case "get_budget_score":
      return { campaigns: summaries.campaigns ?? [], creator: summaries.creator ?? null };
    case "get_attribution_summary":
      return { campaigns: summaries.campaigns ?? [] };
    case "get_ai_memory_summary":
      return { memory: "V1 only reads saved StudioOS summaries. No raw database dump is sent to AI." };
    case "get_notifications":
      return { notifications: summaries.notifications ?? [] };
    case "get_timeline":
      return { pagePath: context.pagePath, entityType: context.entityType, entityId: context.entityId, summaries };
  }
}

export class AiCopilotToolRouter {
  run(message: string, context: AiCopilotContext): AiCopilotToolResult[] {
    return pickTools(message, context.user.role.toUpperCase()).map((toolName) => {
      const started = Date.now();
      return {
        toolName,
        status: "SUCCESS",
        output: outputForTool(toolName, context),
        durationMs: Date.now() - started
      };
    });
  }
}

export const aiCopilotToolRouter = new AiCopilotToolRouter();
