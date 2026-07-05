import type { MessageCategory, MessageDetailPayload } from "@/components/studioos/studio-message-center.types";
import type { Locale } from "@/lib/i18n";
import type { BrandNotificationType } from "@/lib/studioos/brand-notification-types";
import {
  buildMessageProjectStage,
  buildMessageStatCards,
  buildProjectCode,
  countMessagesByCategory,
  formatMessageDetailTime,
  formatMessageListTime,
  type MessageStatCard
} from "@/lib/studioos/creator-messages-ui";

export {
  buildProjectCode,
  buildMessageProjectStage,
  countMessagesByCategory,
  formatMessageDetailTime,
  formatMessageListTime
};

const brandCategoryLabels = {
  zh: {
    all: "全部消息",
    project: "项目动态",
    brand: "创作者消息",
    payment: "付款通知",
    system: "系统通知"
  },
  en: {
    all: "All messages",
    project: "Project updates",
    brand: "Creator messages",
    payment: "Payment alerts",
    system: "System notices"
  }
} as const;

export function brandMessageCategoryFromType(type: BrandNotificationType): MessageCategory {
  switch (type) {
    case "order_cancelled_unpaid":
      return "payment";
    case "invitation_accepted":
    case "invitation_declined":
      return "brand";
    default:
      return "project";
  }
}

export function brandMessageCategoryLabel(category: MessageCategory, locale: Locale) {
  return brandCategoryLabels[locale][category];
}

export function brandSenderDisplayName(creatorName: string, locale: Locale) {
  const trimmed = creatorName.trim();
  if (!trimmed) {
    return locale === "zh" ? "创作者" : "Creator";
  }
  if (trimmed.includes("创作者") || trimmed.toLowerCase().includes("creator")) {
    return trimmed;
  }
  return locale === "zh" ? `${trimmed} 创作者` : trimmed;
}

export function brandSenderInitials(name: string) {
  const cleaned = name.replace(/创作者/g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase() || "CR";
}

export function brandSenderAvatarTone(name: string) {
  const key = name.toLowerCase();
  if (key.includes("nova")) return "bg-violet-600 text-white";
  if (key.includes("maya")) return "bg-emerald-600 text-white";
  if (key.includes("sam")) return "bg-blue-600 text-white";
  return "bg-zinc-900 text-white";
}

export function buildBrandMessageStatCards(
  counts: Record<MessageCategory | "all", number>,
  locale: Locale
): MessageStatCard[] {
  const labels = brandCategoryLabels[locale];
  const cards = buildMessageStatCards(counts, locale);
  return cards.map((card) => ({
    ...card,
    label: labels[card.key]
  }));
}

export function buildBrandMessageSalutation(brandName: string, locale: Locale) {
  return locale === "zh" ? `您好，${brandName}：` : `Hi ${brandName},`;
}

export function buildBrandMessageNextStep(
  type: BrandNotificationType,
  locale: Locale
): MessageDetailPayload["nextStep"] {
  if (locale === "zh") {
    switch (type) {
      case "invitation_accepted":
        return {
          title: "下一步",
          body: "该 Creator 已接受意向，请前往匹配页查看并确认是否选定。"
        };
      case "invitation_declined":
        return {
          title: "下一步",
          body: "该 Creator 已拒绝意向，可继续邀请其他候选人。"
        };
      case "deliverable_uploaded":
        return {
          title: "下一步",
          body: "Creator 已上传新版本，请前往审片中心查看并给出反馈。"
        };
      case "comment_resolved":
        return {
          title: "下一步",
          body: "Creator 已处理批注，请继续审片流程直至确认交付。"
        };
      default:
        return undefined;
    }
  }

  switch (type) {
    case "invitation_accepted":
      return {
        title: "Next step",
        body: "This creator accepted your invitation — open the match tab to confirm selection."
      };
    case "invitation_declined":
      return {
        title: "Next step",
        body: "This creator declined — invite other candidates from the match tab."
      };
    case "deliverable_uploaded":
      return {
        title: "Next step",
        body: "A new cut was uploaded — open review to watch and leave feedback."
      };
    case "comment_resolved":
      return {
        title: "Next step",
        body: "Review notes were addressed — continue review until delivery is approved."
      };
    default:
      return undefined;
  }
}
