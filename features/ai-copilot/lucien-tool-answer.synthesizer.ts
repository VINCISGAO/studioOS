import type { AiCopilotContext, AiCopilotToolResult } from "@/features/ai-copilot/ai-copilot.types";
import { formatMoneyFromUsd } from "@/lib/money/display-money";
import { normalizeLanguageCode } from "@/features/i18n/language.constants";

function isZh(language: string) {
  return language === "zh-CN" || language === "zh-TW" || language === "zh";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toolOutput(toolCalls: AiCopilotToolResult[], toolName: string) {
  return asRecord(toolCalls.find((call) => call.toolName === toolName)?.output);
}

function textIncludes(message: string, terms: string[]) {
  const normalized = message.toLowerCase();
  return terms.some((term) => normalized.includes(term.toLowerCase()));
}

const BUDGET_INTENT = ["预算", "budget", "合理", "多少钱", "贵不贵", "价钱", "价格"];
const MATCHING_INTENT = ["推荐", "创作者", "creator", "匹配", "match", "invite", "邀请"];
const USER_COUNT_INTENT = ["多少用户", "用户数", "注册用户", "how many users", "user count", "平台人数", "有多少人"];
const PROGRESS_INTENT = ["进度", "哪一步", "step", "status", "项目", "project", "进行", "下一步"];

export function matchesSpecificLucienIntent(message: string) {
  return (
    textIncludes(message, BUDGET_INTENT) ||
    textIncludes(message, MATCHING_INTENT) ||
    textIncludes(message, USER_COUNT_INTENT) ||
    textIncludes(message, PROGRESS_INTENT)
  );
}

export function isGenericLucienBoilerplate(text: string) {
  const normalized = text.replace(/\s+/g, "");
  const zhMarkers = ["我已读取", "你可以继续问我", "你可以问我", "整理最相关", "结合了你的项目"];
  const enMarkers = ["I have read the real VINCIS", "You can ask me about project progress", "most relevant information"];
  const markers = [...zhMarkers, ...enMarkers];
  const hits = markers.filter((marker) => normalized.includes(marker.replace(/\s+/g, ""))).length;
  if (hits >= 2) return true;
  return (
    (normalized.includes("我已读取") && normalized.includes("你可以")) ||
    (normalized.toLowerCase().includes("vincis") && normalized.toLowerCase().includes("you can ask"))
  );
}

function parseBudgetUsd(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const match = raw.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

function budgetGuidance(language: string, budgetRange: string | null, campaignTitle: string | null) {
  const zh = isZh(language);
  const locale = normalizeLanguageCode(language);
  const amount = parseBudgetUsd(budgetRange);
  const label = campaignTitle?.trim() || (zh ? "当前项目" : "this project");

  if (!budgetRange?.trim()) {
    return zh
      ? `${label} 还没有填写预算区间。建议先完成需求创建里的预算与时间，系统才能给出更准确的制作估价与匹配建议。`
      : `${label} does not have a budget range yet. Complete the budget step in your brief so pricing and matching can be evaluated.`;
  }

  const formatted = amount != null ? formatMoneyFromUsd(amount, locale) : budgetRange;
  if (amount != null && amount < 500) {
    return zh
      ? `${label} 当前预算约 ${formatted}，偏低，可能只能覆盖极短素材或单镜头测试。若目标是正式投放级广告，建议提高到至少 $800–$1,500 区间。`
      : `${label} is budgeted around ${formatted}, which is low for a full production ad. For launch-ready creative, consider at least $800–$1,500.`;
  }
  if (amount != null && amount < 1500) {
    return zh
      ? `${label} 当前预算约 ${formatted}，适合轻量短视频或单场景制作。若需要多镜头、修订轮次和更高匹配质量，可考虑上调 20%–40%。`
      : `${label} is around ${formatted}, which fits a lighter short-form production. For more shots, revisions, and stronger matching, consider raising it by 20%–40%.`;
  }

  return zh
    ? `${label} 当前预算为 ${formatted}，处于可成交的常规制作区间。若包含复杂场景、多平台版本或额外修订，可预留约 20% 缓冲。`
    : `${label} is set to ${formatted}, which is in a workable production range. Reserve ~20% headroom if you need complex scenes, multi-platform cuts, or extra revisions.`;
}

function matchingGuidance(
  language: string,
  campaigns: unknown[],
  currentPage: Record<string, unknown>
) {
  const zh = isZh(language);
  const project = asRecord(currentPage.project);
  const selectedStudioId =
    typeof project.selectedStudioId === "string" && project.selectedStudioId.trim()
      ? project.selectedStudioId.trim()
      : null;
  const status = typeof project.normalizedStatus === "string" ? project.normalizedStatus : null;
  const title = typeof project.title === "string" ? project.title : null;

  if (selectedStudioId) {
    return zh
      ? `当前项目${title ? `「${title}」` : ""} 已选定创作者（ID: ${selectedStudioId}）。推荐依据通常包括：风格匹配、历史履约、预算区间、档期与 AI 偏好学习；你可以在邀约记录和项目详情里查看具体匹配分。`
      : `This project${title ? ` "${title}"` : ""} already has a selected creator (${selectedStudioId}). Recommendations usually combine style fit, delivery history, budget fit, availability, and preference learning. Check invitations and project details for the exact match rationale.`;
  }

  const active = campaigns.filter((item) => asRecord(item).phase === "active");
  if (active.length === 0) {
    return zh
      ? "当前还没有进入匹配阶段的正式项目。完成需求、付款并发布后，系统才会基于你的 Production Brief 和创作者真实资料生成推荐，而不是占位名单。"
      : "You do not have a project in matching yet. After you publish and complete escrow payment, recommendations are generated from your Production Brief and real creator profiles—not placeholder lists.";
  }

  return zh
    ? "已有进行中的项目，但尚未最终选定创作者。推荐会在付款后由 AI 根据简报、风格偏好、履约记录和档期生成；你可以在「广告需求」里继续推进并查看邀约。"
    : "You have active projects, but no creator has been finally selected yet. After payment, AI matching uses your brief, style preferences, delivery history, and availability. Continue in Ad Requirements to review invitations.";
}

function userCountGuidance(language: string, brand: Record<string, unknown>) {
  const zh = isZh(language);
  const total = typeof brand.campaignCount === "number" ? brand.campaignCount : 0;
  const drafts = typeof brand.draftCampaigns === "number" ? brand.draftCampaigns : 0;
  const active = typeof brand.activeCampaigns === "number" ? brand.activeCampaigns : 0;
  const done = typeof brand.completedCampaigns === "number" ? brand.completedCampaigns : 0;

  return zh
    ? [
        "我无法查看全平台注册用户总数，这属于平台内部运营数据，品牌账号无权访问。",
        "",
        "我能看到的是你账号下的真实业务数据：",
        `· 全部广告：${total}`,
        `· 草稿：${drafts}`,
        `· 进行中：${active}`,
        `· 已完成：${done}`,
        "",
        "如果你想了解项目进度、预算或创作者推荐，可以直接问具体项目。"
      ].join("\n")
    : [
        "I cannot see total registered users on the platform—that is internal operations data outside brand permissions.",
        "",
        "Here is what I can see for your account:",
        `· All ads: ${total}`,
        `· Drafts: ${drafts}`,
        `· In progress: ${active}`,
        `· Completed: ${done}`,
        "",
        "Ask about a specific project if you want progress, budget, or creator-matching help."
      ].join("\n");
}

function progressGuidance(language: string, brand: Record<string, unknown>, campaigns: unknown[]) {
  const zh = isZh(language);
  const drafts = typeof brand.draftCampaigns === "number" ? brand.draftCampaigns : 0;
  const active = typeof brand.activeCampaigns === "number" ? brand.activeCampaigns : 0;
  const done = typeof brand.completedCampaigns === "number" ? brand.completedCampaigns : 0;

  const latest = campaigns
    .map((item) => asRecord(item))
    .sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")))[0];
  const latestTitle = typeof latest?.title === "string" ? latest.title : null;
  const latestStatus = typeof latest?.status === "string" ? latest.status : null;

  const lines = zh
    ? [
        `你当前有 ${drafts} 个草稿、${active} 个进行中、${done} 个已完成项目。`,
        latestTitle && latestStatus
          ? `最近更新的是「${latestTitle}」，状态：${latestStatus}。`
          : "还没有可展示的项目动态。",
        active > 0
          ? "进行中的项目可在审片中心或广告需求里查看下一步。"
          : drafts > 0
            ? "建议先把草稿补充完整并继续发布流程。"
            : "可以从品牌首页新建广告需求开始。"
      ]
    : [
        `You currently have ${drafts} drafts, ${active} active, and ${done} completed projects.`,
        latestTitle && latestStatus
          ? `Most recently updated: "${latestTitle}" (${latestStatus}).`
          : "No project activity to show yet.",
        active > 0
          ? "Open Review Hub or Ad Requirements for next steps on active work."
          : drafts > 0
            ? "Finish and publish a draft to move forward."
            : "Start from the brand dashboard with a new ad brief."
      ];

  return lines.filter(Boolean).join("\n");
}

function workspaceFallback(language: string, brand: Record<string, unknown>) {
  const zh = isZh(language);
  const total = typeof brand.campaignCount === "number" ? brand.campaignCount : 0;
  const drafts = typeof brand.draftCampaigns === "number" ? brand.draftCampaigns : 0;
  const active = typeof brand.activeCampaigns === "number" ? brand.activeCampaigns : 0;

  return zh
    ? [
        "我已读取你账号下的真实 VINCIS 数据。",
        "",
        `当前概览：全部广告 ${total}、草稿 ${drafts}、进行中 ${active}。`,
        "你可以继续问我：项目进度、预算是否合理、为什么推荐某位创作者，或下一步该怎么推进。"
      ].join("\n")
    : [
        "I loaded the real VINCIS data available to your account.",
        "",
        `Overview: ${total} ads total, ${drafts} drafts, ${active} in progress.`,
        "Ask me about project progress, budget health, creator recommendations, or the best next step."
      ].join("\n");
}

/** Deterministic fallback when the LLM is unavailable — uses tool/context data, not a static template. */
export function synthesizeLucienToolAnswer(input: {
  message: string;
  context: AiCopilotContext;
  toolCalls: AiCopilotToolResult[];
}): string | null {
  const { message, context, toolCalls } = input;
  const language = context.language;
  const role = context.user.role.toUpperCase();

  const brandSummary = toolOutput(toolCalls, "get_brand_summary");
  const brand = asRecord(brandSummary.brand ?? context.summaries.brand);
  const campaigns = asArray(brandSummary.campaigns ?? context.summaries.campaigns);
  const currentPage = asRecord(brandSummary.currentPage ?? context.summaries.currentPage);
  const project = asRecord(currentPage.project);
  const budgetRange =
    (typeof project.budgetRange === "string" && project.budgetRange) ||
    (typeof asRecord(campaigns[0]).budgetRange === "string" ? String(asRecord(campaigns[0]).budgetRange) : null);
  const projectTitle = typeof project.title === "string" ? project.title : null;

  if (role === "BRAND") {
    if (textIncludes(message, BUDGET_INTENT)) {
      return budgetGuidance(language, budgetRange, projectTitle);
    }
    if (textIncludes(message, MATCHING_INTENT)) {
      return matchingGuidance(language, campaigns, currentPage);
    }
    if (textIncludes(message, USER_COUNT_INTENT)) {
      return userCountGuidance(language, brand);
    }
    if (textIncludes(message, PROGRESS_INTENT)) {
      return progressGuidance(language, brand, campaigns);
    }
    if (Object.keys(brand).length > 0) {
      return workspaceFallback(language, brand);
    }
  }

  if (Object.keys(brand).length > 0 || campaigns.length > 0) {
    return workspaceFallback(language, brand);
  }

  return null;
}
