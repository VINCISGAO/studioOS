import type { Locale } from "@/lib/i18n";
import type { BrandBriefOptimizerResult } from "@/lib/studioos/brand-brief-optimizer.types";

function usesChinese(locale: Locale) {
  return locale === "zh" || locale.startsWith("zh");
}

function joinList(items: string[], locale: Locale) {
  return items.filter(Boolean).join(usesChinese(locale) ? "、" : ", ");
}

export function formatProfessionalBriefDocument(optimizer: BrandBriefOptimizerResult, locale: Locale) {
  const zh = usesChinese(locale);

  if (zh) {
    const lines = [
      `项目 · ${optimizer.campaign_name}`,
      "",
      `广告目标｜${optimizer.primary_objective}`,
      optimizer.secondary_objectives.length
        ? `次要目标｜${joinList(optimizer.secondary_objectives, locale)}`
        : "",
      `目标受众｜${optimizer.audience_primary}（置信度 ${optimizer.audience_confidence}%）`,
      optimizer.audience_segments.length ? `人群分层｜${joinList(optimizer.audience_segments, locale)}` : "",
      "",
      "消费者洞察",
      optimizer.consumer_insight,
      "",
      "核心信息",
      optimizer.key_message,
      "",
      optimizer.selling_points.length ? "卖点优先级" : "",
      ...optimizer.selling_points.map((point) => `${point.priority}. ${point.label}`),
      "",
      `投放平台｜${joinList(optimizer.recommended_platforms, locale)}`,
      `视频时长｜${optimizer.recommended_video_duration}`,
      `创作者类型｜${joinList(optimizer.recommended_creator_types, locale)}`,
      `品牌调性｜${joinList(optimizer.recommended_tones, locale)}`,
      `视觉风格｜${joinList(optimizer.visual_style, locale)}`,
      `行动号召｜${optimizer.recommended_cta}`,
      "",
      `推荐 KPI｜${joinList(optimizer.recommended_kpis, locale)}`
    ];

    return lines.filter((line) => line !== "").join("\n");
  }

  const lines = [
    `Campaign · ${optimizer.campaign_name}`,
    "",
    `Objective | ${optimizer.primary_objective}`,
    optimizer.secondary_objectives.length
      ? `Secondary | ${joinList(optimizer.secondary_objectives, locale)}`
      : "",
    `Audience | ${optimizer.audience_primary} (${optimizer.audience_confidence}% confidence)`,
    optimizer.audience_segments.length ? `Segments | ${joinList(optimizer.audience_segments, locale)}` : "",
    "",
    "Consumer insight",
    optimizer.consumer_insight,
    "",
    "Key message",
    optimizer.key_message,
    "",
    optimizer.selling_points.length ? "Selling points" : "",
    ...optimizer.selling_points.map((point) => `${point.priority}. ${point.label}`),
    "",
    `Platforms | ${joinList(optimizer.recommended_platforms, locale)}`,
    `Duration | ${optimizer.recommended_video_duration}`,
    `Creators | ${joinList(optimizer.recommended_creator_types, locale)}`,
    `Tone | ${joinList(optimizer.recommended_tones, locale)}`,
    `Visual style | ${joinList(optimizer.visual_style, locale)}`,
    `CTA | ${optimizer.recommended_cta}`,
    "",
    `KPIs | ${joinList(optimizer.recommended_kpis, locale)}`
  ];

  return lines.filter((line) => line !== "").join("\n");
}
