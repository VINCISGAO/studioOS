import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";
import type { FrozenProductionBrief } from "@/features/ai/creative-direction.types";
import type { Locale } from "@/lib/i18n";
import type { StoredProject } from "@/lib/project-types";
import { objectiveLabelFor } from "@/lib/studioos/brand-brief-options";
import {
  buildInvitationBudgetLabel,
  formatInvitationDeadline,
  localizeInvitationCategory
} from "@/lib/studioos/creator-invitation-format";

export type CreatorInvitationDetailField = {
  label: string;
  value: string;
};

export type CreatorInvitationDetailModel = {
  title: string;
  brandName: string;
  brief: string;
  fields: CreatorInvitationDetailField[];
};

const demoDetailCopy: Record<
  string,
  Record<
    Locale,
    {
      brief: string;
      productName: string;
      audience: string;
      platforms: string;
      videoSpec: string;
      objective: string;
    }
  >
> = {
  inv_demo_pending_01: {
    en: {
      productName: "Wireless earbuds",
      brief:
        "We need a creator skilled in tech product short-form video to highlight core selling points and usage scenarios.",
      audience: "Young professionals who commute and work out",
      platforms: "TikTok, Meta",
      videoSpec: "30s · 9:16 · 2 videos",
      objective: "Product launch"
    },
    zh: {
      productName: "无线耳机",
      brief: "我们正在寻找擅长科技产品短视频创作的 Creator，呈现产品的核心卖点与使用场景。",
      audience: "通勤与健身的年轻职场人群",
      platforms: "TikTok、Meta",
      videoSpec: "30 秒 · 9:16 · 2 支视频",
      objective: "新品上市"
    }
  },
  inv_demo_pending_03: {
    en: {
      productName: "Fashion accessories",
      brief:
        "The brand wants creative short videos that express the product's fashion sense and lifestyle appeal.",
      audience: "Style-conscious women aged 18–34",
      platforms: "Instagram, TikTok",
      videoSpec: "15s · 9:16 · 1 video",
      objective: "Brand awareness"
    },
    zh: {
      productName: "时尚配饰",
      brief: "品牌希望通过创意短视频，展现产品的时尚感与生活方式。",
      audience: "18–34 岁、注重穿搭的女性",
      platforms: "Instagram、TikTok",
      videoSpec: "15 秒 · 9:16 · 1 支视频",
      objective: "品牌曝光"
    }
  }
};

function readFrozenBrief(project: StoredProject | null): FrozenProductionBrief | null {
  if (!project) return null;
  const raw = project.settings_json?.frozen_production_brief;
  if (!raw || typeof raw !== "object") return null;
  return raw as FrozenProductionBrief;
}

function resolveBriefText(project: StoredProject | null, invitation: CreatorPortalInvitationView, locale: Locale) {
  const demo = demoDetailCopy[invitation.id]?.[locale];
  if (demo?.brief) return demo.brief;

  const frozen = readFrozenBrief(project);
  if (frozen?.full_text?.trim()) return frozen.full_text.trim();
  if (project?.campaign_goal?.trim()) return project.campaign_goal.trim();
  if (project?.notes?.trim()) return project.notes.trim();
  if (invitation.platform) {
    return locale === "zh"
      ? `为「${invitation.title}」制作 ${invitation.platform} 效果广告。`
      : `Create ${invitation.platform} performance ads for “${invitation.title}”.`;
  }
  return invitation.title;
}

function formatVideoSpec(project: StoredProject | null, locale: Locale) {
  if (!project) return null;
  const lengths = project.video_lengths?.filter(Boolean) ?? [];
  const ratios = project.aspect_ratios?.filter(Boolean) ?? [];
  const quantity = project.output_quantity || project.video_count || 0;
  const parts: string[] = [];

  if (lengths.length) {
    parts.push(lengths.join(locale === "zh" ? "、" : ", "));
  } else if (project.video_format?.trim()) {
    parts.push(project.video_format.trim());
  }

  if (ratios.length) {
    parts.push(ratios.join(locale === "zh" ? "、" : ", "));
  }

  if (quantity > 0) {
    parts.push(
      locale === "zh" ? `${quantity} 支视频` : `${quantity} video${quantity > 1 ? "s" : ""}`
    );
  }

  return parts.length ? parts.join(locale === "zh" ? " · " : " · ") : null;
}

function parseReferenceLinks(raw: string | undefined | null) {
  if (!raw?.trim()) return [];
  return raw
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter((item) => item.startsWith("http"));
}

function pushField(fields: CreatorInvitationDetailField[], label: string, value: string | null | undefined) {
  const trimmed = value?.trim();
  if (trimmed) fields.push({ label, value: trimmed });
}

export function buildCreatorInvitationDetail(
  invitation: CreatorPortalInvitationView,
  project: StoredProject | null,
  locale: Locale
): CreatorInvitationDetailModel {
  const demo = demoDetailCopy[invitation.id]?.[locale];
  const frozen = readFrozenBrief(project);
  const fields: CreatorInvitationDetailField[] = [];
  const labels =
    locale === "zh"
      ? {
          product: "产品",
          objective: "推广目标",
          audience: "目标人群",
          platforms: "投放平台",
          markets: "目标市场",
          videoSpec: "视频规格",
          category: "类目",
          budget: "预算",
          deadline: "截止日期",
          notes: "补充说明",
          references: "参考链接",
          match: "匹配度"
        }
      : {
          product: "Product",
          objective: "Objective",
          audience: "Target audience",
          platforms: "Platforms",
          markets: "Target markets",
          videoSpec: "Video spec",
          category: "Category",
          budget: "Budget",
          deadline: "Deadline",
          notes: "Additional notes",
          references: "Reference links",
          match: "Match score"
        };

  const productName =
    demo?.productName ||
    frozen?.product?.name?.trim() ||
    project?.product_name?.trim() ||
    invitation.title;

  pushField(fields, labels.product, productName);
  pushField(
    fields,
    labels.objective,
    demo?.objective ||
      (project?.commercial_objective
        ? objectiveLabelFor(project.commercial_objective, locale)
        : null) ||
      frozen?.title
  );
  pushField(
    fields,
    labels.audience,
    demo?.audience || frozen?.audience || project?.target_audience
  );
  pushField(
    fields,
    labels.platforms,
    demo?.platforms ||
      frozen?.platforms ||
      project?.target_platform ||
      invitation.platform
  );
  if (project?.target_market?.length) {
    pushField(fields, labels.markets, project.target_market.join(locale === "zh" ? "、" : ", "));
  }
  pushField(
    fields,
    labels.videoSpec,
    demo?.videoSpec || formatVideoSpec(project, locale)
  );
  pushField(
    fields,
    labels.category,
    localizeInvitationCategory(project?.category ?? invitation.platform, locale)
  );
  pushField(
    fields,
    labels.budget,
    buildInvitationBudgetLabel(project, invitation, locale)
  );
  pushField(
    fields,
    labels.deadline,
    formatInvitationDeadline(invitation.deadline, locale)
  );
  pushField(fields, labels.notes, project?.notes);

  const references = parseReferenceLinks(project?.reference_links);
  if (references.length) {
    pushField(fields, labels.references, references.join(locale === "zh" ? "、" : ", "));
  }

  if (invitation.matchScore > 0) {
    pushField(fields, labels.match, `${Math.round(invitation.matchScore)}%`);
  }

  return {
    title: invitation.title,
    brandName: invitation.brandName,
    brief: resolveBriefText(project, invitation, locale),
    fields
  };
}

export function resolveCreatorInvitationDetail(
  invitation: CreatorPortalInvitationView,
  locale: Locale,
  detail?: CreatorInvitationDetailModel | null,
  project?: StoredProject | null
): CreatorInvitationDetailModel {
  if (detail?.brandName && detail.brief) {
    return detail;
  }
  return buildCreatorInvitationDetail(invitation, project ?? null, locale);
}
