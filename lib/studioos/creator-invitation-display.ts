import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";
import type { Locale } from "@/lib/i18n";
import type { StoredProject } from "@/lib/project-types";
import { fallbackProjectThumbnail } from "@/lib/studioos/project-thumbnail";
import {
  buildCreatorInvitationDetail,
  type CreatorInvitationDetailModel
} from "@/lib/studioos/creator-invitation-detail";
import {
  buildInvitationBudgetLabel,
  formatInvitationDeadline,
  localizeInvitationCategory
} from "@/lib/studioos/creator-invitation-format";

const THUMBNAIL_EARBUDS =
  "https://images.unsplash.com/photo-1590658268037-6bf12165a1df?auto=format&fit=crop&w=240&q=80";
const THUMBNAIL_HEADPHONES =
  "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=240&q=80";

const demoCardCopy: Record<
  string,
  Record<Locale, { description: string; categoryLabel: string; thumbnailUrl: string }>
> = {
  inv_demo_pending_01: {
    en: {
      description:
        "We need a creator skilled in tech product short-form video to highlight core selling points and usage scenarios.",
      categoryLabel: "Tech & electronics",
      thumbnailUrl: THUMBNAIL_EARBUDS
    },
    zh: {
      description: "我们正在寻找擅长科技产品短视频创作的 Creator，呈现产品的核心卖点与使用场景。",
      categoryLabel: "科技电子",
      thumbnailUrl: THUMBNAIL_EARBUDS
    }
  },
  inv_demo_pending_03: {
    en: {
      description:
        "The brand wants creative short videos that express the product’s fashion sense and lifestyle appeal.",
      categoryLabel: "Beauty & fashion",
      thumbnailUrl: THUMBNAIL_HEADPHONES
    },
    zh: {
      description: "品牌希望通过创意短视频，展现产品的时尚感与生活方式。",
      categoryLabel: "时尚美妆",
      thumbnailUrl: THUMBNAIL_HEADPHONES
    }
  }
};

export type CreatorInvitationCardModel = CreatorPortalInvitationView & {
  description: string;
  categoryLabel: string;
  budgetLabel: string;
  thumbnailUrl: string;
  detail: CreatorInvitationDetailModel;
};

export { formatInvitationDeadline, localizeInvitationCategory, buildInvitationBudgetLabel };

function localeFallbackDescription(platform: string, title: string, locale: Locale) {
  if (locale === "zh") {
    return `为「${title}」制作 ${platform} 效果广告，核心目标是新品上市。`;
  }
  return `Create ${platform} performance ads for “${title}” with a product launch focus.`;
}

export function enrichInvitationForCard(
  invitation: CreatorPortalInvitationView,
  project: StoredProject | null,
  locale: Locale,
  thumbnailByProjectId: Record<string, string | null> = {}
): CreatorInvitationCardModel {
  const demo = demoCardCopy[invitation.id]?.[locale];
  const description =
    demo?.description ||
    project?.campaign_goal?.trim() ||
    project?.notes?.trim() ||
    (invitation.platform
      ? localeFallbackDescription(invitation.platform, invitation.title, locale)
      : invitation.title);

  return {
    ...invitation,
    description,
    categoryLabel: demo?.categoryLabel ?? localizeInvitationCategory(project?.category ?? invitation.platform, locale),
    budgetLabel: buildInvitationBudgetLabel(project, invitation, locale),
    thumbnailUrl:
      demo?.thumbnailUrl ??
      thumbnailByProjectId[invitation.campaignId] ??
      fallbackProjectThumbnail(invitation.campaignId),
    detail: buildCreatorInvitationDetail(invitation, project, locale)
  };
}

export function enrichInvitationsForCards(
  invitations: CreatorPortalInvitationView[],
  projectsById: Record<string, StoredProject | null>,
  locale: Locale,
  thumbnailByProjectId: Record<string, string | null> = {}
): CreatorInvitationCardModel[] {
  return invitations.map((invitation) =>
    enrichInvitationForCard(
      invitation,
      projectsById[invitation.campaignId] ?? null,
      locale,
      thumbnailByProjectId
    )
  );
}
