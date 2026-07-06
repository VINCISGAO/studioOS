import type { MessageCategory, MessageDetailPayload, ProgressStep } from "@/components/studioos/studio-message-center.types";
import type { Locale } from "@/lib/i18n";

export type MessageStatCard = {
  key: MessageCategory | "all";
  label: string;
  count: number;
  viewLabel: string;
  icon: "all" | "project" | "brand" | "payment" | "system";
};

const categoryLabels = {
  zh: {
    all: "全部消息",
    project: "项目消息",
    brand: "品牌消息",
    payment: "付款通知",
    system: "系统通知"
  },
  en: {
    all: "All messages",
    project: "Project messages",
    brand: "Brand messages",
    payment: "Payment alerts",
    system: "System notices"
  }
} as const;

export function messageCategoryFromType(type: string): MessageCategory {
  switch (type) {
    case "project_funded":
    case "escrow_released":
      return "payment";
    case "invitation_match":
    case "certification_approved":
      return "system";
    case "not_selected":
      return "brand";
    case "order_cancelled_unpaid":
      return "brand";
    default:
      return "project";
  }
}

export function messageCategoryLabel(category: MessageCategory, locale: Locale) {
  return categoryLabels[locale][category];
}

export function senderDisplayName(companyName: string, locale: Locale) {
  const trimmed = companyName.trim();
  if (!trimmed) {
    return locale === "zh" ? "系统通知" : "System";
  }
  if (trimmed.includes("品牌") || trimmed.includes("Brand")) {
    return trimmed;
  }
  return locale === "zh" ? `${trimmed} 品牌方` : trimmed;
}

export function senderInitials(name: string) {
  const cleaned = name.replace(/品牌方/g, "").trim();
  if (cleaned.includes("系统") || cleaned.toLowerCase() === "system") {
    return "S";
  }
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return cleaned.slice(0, 1).toUpperCase() || "B";
}

export function senderAvatarTone(name: string) {
  const key = name.toLowerCase();
  if (key.includes("nike")) return "bg-zinc-950 text-white";
  if (key.includes("samsung")) return "bg-blue-600 text-white";
  if (key.includes("apple")) return "bg-zinc-200 text-zinc-700";
  if (key.includes("arc")) return "bg-violet-600 text-white";
  if (key.includes("系统") || key.includes("system")) return "bg-indigo-50 text-indigo-600";
  return "bg-zinc-100 text-zinc-700";
}

export function formatMessageListTime(iso: string, locale: Locale, now = new Date()) {
  const date = new Date(iso);
  const isZh = locale === "zh";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - msgDay.getTime()) / 86400000);
  const time = date.toLocaleTimeString(isZh ? "zh-CN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  if (diffDays === 0) return time;
  if (diffDays === 1) return isZh ? `昨天 ${time}` : `Yesterday ${time}`;
  if (isZh) {
    return `${date.getMonth() + 1}/${String(date.getDate()).padStart(2, "0")} ${time}`;
  }
  return `${date.getMonth() + 1}/${String(date.getDate()).padStart(2, "0")} ${time}`;
}

export function formatMessageDetailTime(iso: string, locale: Locale) {
  const date = new Date(iso);
  return date
    .toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    })
    .replace(/\//g, "-");
}

export function buildMessageStatCards(
  counts: Record<MessageCategory | "all", number>,
  locale: Locale
): MessageStatCard[] {
  const labels = categoryLabels[locale];
  const viewAll = locale === "zh" ? "查看全部" : "View all";
  const view = locale === "zh" ? "查看" : "View";

  return [
    { key: "all", label: labels.all, count: counts.all, viewLabel: viewAll, icon: "all" },
    { key: "project", label: labels.project, count: counts.project, viewLabel: view, icon: "project" },
    { key: "brand", label: labels.brand, count: counts.brand, viewLabel: view, icon: "brand" },
    { key: "payment", label: labels.payment, count: counts.payment, viewLabel: view, icon: "payment" },
    { key: "system", label: labels.system, count: counts.system, viewLabel: view, icon: "system" }
  ];
}

export function countMessagesByCategory<T extends { category: MessageCategory }>(items: T[]) {
  const counts = {
    all: items.length,
    project: 0,
    brand: 0,
    payment: 0,
    system: 0
  } satisfies Record<MessageCategory | "all", number>;

  for (const item of items) {
    counts[item.category] += 1;
  }

  return counts;
}

export function buildProjectCode(projectId: string | null, fallback = "0601") {
  if (!projectId) return `CAM-2026-${fallback}`;
  const suffix = projectId.replace(/\D/g, "").slice(-4).padStart(4, "0");
  return `CAM-2026-${suffix || fallback}`;
}

export function buildMessageProjectStage(progressSteps: ProgressStep[], locale: Locale) {
  const current = progressSteps.find((step) => step.state === "current");
  if (!current) {
    return locale === "zh" ? "进行中" : "In progress";
  }
  if (locale === "zh") {
    return `${current.title} · ${current.subtitle}`;
  }
  return `${current.title} · ${current.subtitle}`;
}

export function buildMessageNextStep(
  type: string,
  locale: Locale
): MessageDetailPayload["nextStep"] {
  if (locale === "zh") {
    switch (type) {
      case "creator_selected":
      case "project_funded":
        return {
          title: "下一步",
          body: "请在 3 天内上传第一版完整作品，我们的团队会尽快审核并反馈。"
        };
      case "revision_requested":
        return {
          title: "下一步",
          body: "请在 2 天内提交修改版，并注明本次改动的重点。"
        };
      case "review_comment_added":
        return {
          title: "下一步",
          body: "请查看审片批注并确认是否需要提交修改版。"
        };
      case "escrow_released":
        return {
          title: "下一步",
          body: "款项已释放，可在收益管理查看结算详情。"
        };
      case "certification_approved":
        return {
          title: "下一步",
          body: "请完善 Studio 主页、擅长领域与价格意愿，完成后即可正式接单。"
        };
      case "order_cancelled_unpaid":
        return {
          title: "说明",
          body: "该订单已关闭，无需继续制作。你可以继续查看其他意向邀请或新项目。"
        };
      default:
        return undefined;
    }
  }

  switch (type) {
    case "creator_selected":
    case "project_funded":
      return {
        title: "Next step",
        body: "Upload the first full cut within 3 days. Our team will review and reply quickly."
      };
    case "revision_requested":
      return {
        title: "Next step",
        body: "Submit the revised cut within 2 days and note what changed."
      };
    case "review_comment_added":
      return {
        title: "Next step",
        body: "Review the notes and confirm whether a revision is needed."
      };
    case "escrow_released":
      return {
        title: "Next step",
        body: "Funds are released — check Income for payout details."
      };
    case "certification_approved":
      return {
        title: "Next step",
        body: "Complete your studio profile, expertise, and pricing to start accepting orders."
      };
    case "order_cancelled_unpaid":
      return {
        title: "Note",
        body: "This order is closed — no production is needed. Check other invitations or new projects."
      };
    default:
      return undefined;
  }
}

export function buildMessageSalutation(creatorName: string, locale: Locale) {
  return locale === "zh" ? `您好，${creatorName}：` : `Hi ${creatorName},`;
}
