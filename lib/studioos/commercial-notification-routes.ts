import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { CreatorNotificationType } from "@/lib/notification-types";
import type { BrandNotificationType } from "@/lib/studioos/brand-notification-types";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

export type NotificationAction = {
  href: string;
  label: string;
};

const brandLabels = {
  en: {
    openMatch: "Open match tab",
    openReview: "Open review",
    openHome: "Back to brand home"
  },
  zh: {
    openMatch: "查看匹配页",
    openReview: "前往审片",
    openHome: "返回品牌首页"
  }
} as const;

const creatorLabels = {
  en: {
    invitations: "View invitations",
    project: "Open project workspace",
    review: "Open review center",
    income: "View income"
  },
  zh: {
    invitations: "查看意向邀请",
    project: "进入项目工作台",
    review: "进入审片中心",
    income: "查看收入"
  }
} as const;

export function resolveBrandNotificationAction(
  input: { type: BrandNotificationType; project_id: string },
  locale: Locale
): NotificationAction {
  const labels = brandLabels[locale];

  if (
    input.type === "deliverable_uploaded" ||
    input.type === "comment_resolved" ||
    input.type === "payment_required" ||
    input.type === "paid_revision_unlocked" ||
    input.type === "platform_intervention_required" ||
    input.type === "order_completed"
  ) {
    return {
      href: withLocale(brandPortalRoutes.projectReview(input.project_id), locale),
      label: labels.openReview
    };
  }

  if (input.type === "order_cancelled_unpaid") {
    return {
      href: withLocale(brandPortalRoutes.dashboard, locale),
      label: labels.openHome
    };
  }

  return {
    href: withLocale(`${brandPortalRoutes.project(input.project_id)}?tab=match`, locale),
    label: labels.openMatch
  };
}

export function resolveCreatorNotificationAction(
  input: {
    type: CreatorNotificationType;
    order_id: string | null;
    project_id: string | null;
  },
  locale: Locale
): NotificationAction {
  const labels = creatorLabels[locale];

  if (input.type === "escrow_released") {
    return {
      href: withLocale(creatorPortalRoutes.income, locale),
      label: labels.income
    };
  }

  if (input.type === "certification_approved") {
    return {
      href: withLocale(`${creatorPortalRoutes.works}?onboarding=1`, locale),
      label: locale === "zh" ? "完善 Studio 主页" : "Complete studio profile"
    };
  }

  if (input.type === "invitation_match" || input.type === "not_selected" || input.type === "order_cancelled_unpaid") {
    return {
      href: withLocale(
        input.type === "order_cancelled_unpaid" ? creatorPortalRoutes.messages : creatorPortalRoutes.invitations,
        locale
      ),
      label: input.type === "order_cancelled_unpaid" ? labels.project : labels.invitations
    };
  }

  if (
    input.order_id &&
    (input.type === "review_comment_added" ||
      input.type === "revision_requested" ||
      input.type === "project_funded" ||
      input.type === "creator_selected" ||
      input.type === "delivery_approved" ||
      input.type === "platform_intervention_required")
  ) {
    const reviewTypes = new Set<CreatorNotificationType>([
      "review_comment_added",
      "revision_requested",
      "creator_selected",
      "project_funded",
      "paid_revision_unlocked",
      "platform_intervention_required"
    ]);
    return {
      href: withLocale(
        reviewTypes.has(input.type)
          ? creatorPortalRoutes.review(input.order_id)
          : creatorPortalRoutes.project(input.order_id),
        locale
      ),
      label: reviewTypes.has(input.type) ? labels.review : labels.project
    };
  }

  if (input.order_id) {
    return {
      href: withLocale(creatorPortalRoutes.project(input.order_id), locale),
      label: labels.project
    };
  }

  if (input.project_id) {
    return {
      href: withLocale(
        input.type === "creator_selected" ? creatorPortalRoutes.projects : creatorPortalRoutes.invitations,
        locale
      ),
      label: input.type === "creator_selected" ? labels.project : labels.invitations
    };
  }

  return {
    href: withLocale(creatorPortalRoutes.home, locale),
    label: labels.project
  };
}
