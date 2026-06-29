import type { Locale } from "@/lib/i18n";
import type { StoredProject } from "@/lib/project-types";
import { getConfirmedBriefText } from "@/lib/studioos/confirmed-brief";

export type BriefField = { label: string; value: string };

export function buildProjectBriefFields(project: StoredProject, locale: Locale): BriefField[] {
  const zh = locale === "zh";
  const fields: BriefField[] = [
    { label: zh ? "品牌" : "Brand", value: project.company_name || project.client_name },
    { label: zh ? "项目" : "Project", value: project.title || project.product_name },
    { label: zh ? "广告目标" : "Campaign goal", value: project.campaign_goal },
    { label: zh ? "品类" : "Category", value: project.category },
    { label: zh ? "投放平台" : "Platform", value: project.target_platform },
    { label: zh ? "视频规格" : "Format", value: project.video_format },
    {
      label: zh ? "交付数量" : "Deliverables",
      value: String(project.video_count ?? project.output_quantity ?? 1)
    },
    { label: zh ? "预算" : "Budget", value: project.budget_range },
    { label: zh ? "截止日期" : "Deadline", value: project.deadline },
    { label: zh ? "品牌风格" : "Brand style", value: project.brand_style },
    { label: zh ? "目标受众" : "Audience", value: project.target_audience },
    { label: zh ? "参考链接" : "References", value: project.reference_links },
    { label: zh ? "补充说明" : "Notes", value: project.notes }
  ];

  return fields.filter((field) => field.value?.trim());
}

export function buildProjectRequirementsText(project: StoredProject, locale: Locale): string {
  const confirmed = getConfirmedBriefText(project, locale);
  if (confirmed.trim()) {
    return confirmed;
  }

  return buildProjectBriefFields(project, locale)
    .map((field) => `${field.label}: ${field.value}`)
    .join("\n");
}
