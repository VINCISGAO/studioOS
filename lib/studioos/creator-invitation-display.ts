import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";
import type { Locale } from "@/lib/i18n";
import type { StoredProject } from "@/lib/project-types";
import { formatCurrency } from "@/lib/utils";

const THUMBNAIL_EARBUDS =
  "https://images.unsplash.com/photo-1590658268037-6bf12165a1df?auto=format&fit=crop&w=240&q=80";
const THUMBNAIL_HEADPHONES =
  "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=240&q=80";
const THUMBNAIL_POOL = [
  THUMBNAIL_EARBUDS,
  THUMBNAIL_HEADPHONES,
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=240&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=240&q=80"
];

const categoryLabels: Record<string, Record<Locale, string>> = {
  CPG: { en: "Tech & electronics", zh: "科技电子" },
  tech: { en: "Tech & electronics", zh: "科技电子" },
  beauty: { en: "Beauty & fashion", zh: "时尚美妆" },
  fashion: { en: "Beauty & fashion", zh: "时尚美妆" }
};

const demoCardCopy: Record<
  string,
  Record<Locale, { description: string; categoryLabel: string; thumbnailUrl: string; budgetLabel?: string }>
> = {
  inv_demo_pending_01: {
    en: {
      description:
        "We need a creator skilled in tech product short-form video to highlight core selling points and usage scenarios.",
      categoryLabel: "Tech & electronics",
      thumbnailUrl: THUMBNAIL_EARBUDS,
      budgetLabel: "$1,800 USD"
    },
    zh: {
      description: "我们正在寻找擅长科技产品短视频创作的 Creator，呈现产品的核心卖点与使用场景。",
      categoryLabel: "科技电子",
      thumbnailUrl: THUMBNAIL_EARBUDS,
      budgetLabel: "$1,800 USD"
    }
  },
  inv_demo_pending_03: {
    en: {
      description:
        "The brand wants creative short videos that express the product’s fashion sense and lifestyle appeal.",
      categoryLabel: "Beauty & fashion",
      thumbnailUrl: THUMBNAIL_HEADPHONES,
      budgetLabel: "$300 USD"
    },
    zh: {
      description: "品牌希望通过创意短视频，展现产品的时尚感与生活方式。",
      categoryLabel: "时尚美妆",
      thumbnailUrl: THUMBNAIL_HEADPHONES,
      budgetLabel: "$300 USD"
    }
  }
};

export type CreatorInvitationCardModel = CreatorPortalInvitationView & {
  description: string;
  categoryLabel: string;
  budgetLabel: string;
  thumbnailUrl: string;
};

function hashIndex(value: string, size: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash + value.charCodeAt(i) * (i + 1)) % size;
  }
  return hash;
}

export function localizeInvitationCategory(category: string | null | undefined, locale: Locale) {
  const key = category?.trim().toLowerCase() ?? "";
  if (!key) return locale === "zh" ? "综合类目" : "General";
  const mapped = categoryLabels[key];
  if (mapped) return mapped[locale];
  return category ?? (locale === "zh" ? "综合类目" : "General");
}

export function formatInvitationDeadline(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: locale === "zh" ? "long" : "short",
    day: "numeric"
  });
}

export function buildInvitationBudgetLabel(
  project: StoredProject | null,
  invitation: CreatorPortalInvitationView,
  locale: Locale = "en"
) {
  const demoBudget = demoCardCopy[invitation.id]?.[locale]?.budgetLabel;
  if (demoBudget) return demoBudget;
  if (project?.budget_range?.trim()) {
    return project.budget_range;
  }
  return `${formatCurrency(invitation.budget)} ${invitation.currency}`;
}

export function enrichInvitationForCard(
  invitation: CreatorPortalInvitationView,
  project: StoredProject | null,
  locale: Locale
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
    budgetLabel: demo?.budgetLabel ?? buildInvitationBudgetLabel(project, invitation, locale),
    thumbnailUrl: demo?.thumbnailUrl ?? THUMBNAIL_POOL[hashIndex(invitation.id, THUMBNAIL_POOL.length)] ?? THUMBNAIL_POOL[0]
  };
}

function localeFallbackDescription(platform: string, title: string, locale: Locale) {
  if (locale === "zh") {
    return `为「${title}」制作 ${platform} 效果广告，核心目标是新品上市。`;
  }
  return `Create ${platform} performance ads for “${title}” with a product launch focus.`;
}

export function enrichInvitationsForCards(
  invitations: CreatorPortalInvitationView[],
  projectsById: Record<string, StoredProject | null>,
  locale: Locale
): CreatorInvitationCardModel[] {
  return invitations.map((invitation) =>
    enrichInvitationForCard(invitation, projectsById[invitation.campaignId] ?? null, locale)
  );
}
