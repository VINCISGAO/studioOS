import type { Locale } from "@/lib/i18n";
import type { StoredProject } from "@/lib/project-types";
import { objectiveOptions } from "@/lib/studioos/brand-brief-options";
import { deliveryTimelineLabel } from "@/lib/studioos/brand-campaign-options";

export type ConfirmedBriefField = {
  section: string;
  label: string;
  value: string;
};

export type ConfirmedBriefSnapshot = {
  confirmed_at: string;
  fields: ConfirmedBriefField[];
  full_text: string;
};

type Questionnaire = {
  productName?: string;
  productUrl?: string;
  productDescription?: string;
  objective?: string;
  objectiveLabel?: string;
  audienceDescription?: string;
  platforms?: string[];
  extraNotes?: string;
  rawSummary?: string;
  budgetRange?: string;
  deliveryTimeline?: string;
  aspectRatio?: string;
};

function readQuestionnaire(project: StoredProject): Questionnaire {
  return (project.settings_json?.brand_questionnaire as Questionnaire | undefined) ?? {};
}

function field(section: string, label: string, value: string | undefined | null): ConfirmedBriefField | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return { section, label, value: trimmed };
}

export function buildConfirmedBriefSnapshot(project: StoredProject, locale: Locale): ConfirmedBriefSnapshot {
  const zh = locale === "zh";
  const q = readQuestionnaire(project);
  const objectiveLabel =
    q.objectiveLabel ??
    objectiveOptions(locale).find((item) => item.id === project.commercial_objective)?.label ??
    project.commercial_objective;

  const deliveryLabel = q.deliveryTimeline
    ? deliveryTimelineLabel(q.deliveryTimeline, locale)
    : project.deadline;

  const sections = {
    basic: zh ? "基本信息" : "Basic information",
    campaign: zh ? "广告目标" : "Campaign objective",
    deliverables: zh ? "交付规格" : "Deliverables",
    creative: zh ? "创意说明" : "Creative direction",
    references: zh ? "参考素材" : "References"
  };

  const fields = [
    field(sections.basic, zh ? "品牌" : "Brand", project.company_name || project.client_name),
    field(sections.basic, zh ? "项目名称" : "Project title", project.title),
    field(sections.basic, zh ? "产品名称" : "Product name", project.product_name || q.productName),
    field(sections.basic, zh ? "产品链接" : "Product URL", project.product_url || q.productUrl),
    field(sections.campaign, zh ? "推广目标" : "Objective", objectiveLabel),
    field(sections.campaign, zh ? "广告目标" : "Campaign goal", project.campaign_goal),
    field(sections.campaign, zh ? "目标受众" : "Target audience", project.target_audience || q.audienceDescription),
    field(sections.deliverables, zh ? "投放平台" : "Platforms", project.target_platform || q.platforms?.join(", ")),
    field(sections.deliverables, zh ? "视频比例" : "Aspect ratio", project.video_format || q.aspectRatio),
    field(
      sections.deliverables,
      zh ? "交付数量" : "Quantity",
      String(project.video_count ?? project.output_quantity ?? 1)
    ),
    field(sections.deliverables, zh ? "预算" : "Budget", project.budget_range || q.budgetRange),
    field(sections.deliverables, zh ? "交付时间" : "Timeline", deliveryLabel),
    field(sections.deliverables, zh ? "截止日期" : "Deadline", project.deadline),
    field(sections.deliverables, zh ? "品牌风格" : "Brand style", project.brand_style),
    field(sections.creative, zh ? "产品描述" : "Product description", q.productDescription),
    field(sections.creative, zh ? "原始需求" : "Original brief", q.rawSummary),
    field(sections.creative, zh ? "补充说明" : "Additional notes", project.notes || q.extraNotes),
    field(sections.references, zh ? "参考链接" : "Reference links", project.reference_links)
  ].filter((item): item is ConfirmedBriefField => Boolean(item));

  const full_text = fields.map((item) => `${item.label}: ${item.value}`).join("\n");

  return {
    confirmed_at: new Date().toISOString(),
    fields,
    full_text
  };
}

export function getConfirmedBriefText(project: StoredProject, locale: Locale): string {
  const stored = project.settings_json?.confirmed_brief as ConfirmedBriefSnapshot | undefined;
  if (stored?.full_text?.trim()) {
    return stored.full_text;
  }
  return buildConfirmedBriefSnapshot(project, locale).full_text;
}

export function getConfirmedBriefFields(project: StoredProject, locale: Locale): ConfirmedBriefField[] {
  const stored = project.settings_json?.confirmed_brief as ConfirmedBriefSnapshot | undefined;
  if (stored?.fields?.length) {
    return stored.fields;
  }
  return buildConfirmedBriefSnapshot(project, locale).fields;
}
