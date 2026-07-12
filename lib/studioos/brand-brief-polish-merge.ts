import type { Locale } from "@/lib/i18n";
import { isChineseLanguage } from "@/lib/i18n";
import type { ReorganizedBrandBrief } from "@/lib/studioos/brand-brief-ai";

function usesChinese(locale: Locale) {
  return locale === "zh" || isChineseLanguage(locale);
}

export function primaryBriefSourceText(input: {
  productDescription?: string;
  rawSummary?: string;
  adOneLiner?: string;
}) {
  return (input.productDescription || input.rawSummary || input.adOneLiner || "").trim();
}

function splitBriefSegments(text: string) {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/[。；;！!？?]/))
    .map((segment) => segment.trim())
    .filter((segment) => segment.length >= 6);
}

function segmentsMissingFromPolish(original: string, polished: string) {
  return splitBriefSegments(original).filter((segment) => !polished.includes(segment));
}

function mergePreservingDetail(original: string, polished: string, locale: Locale) {
  const missing = segmentsMissingFromPolish(original, polished);
  if (missing.length === 0) return polished;

  const zh = usesChinese(locale);
  const label = zh ? "【需求细节保留】" : "【Preserved requirements】";
  const merged = `${polished}\n\n${label}\n${missing.join(zh ? "；" : "; ")}`;
  return merged.slice(0, 1500);
}

export function applyPolishedBriefToForm(input: {
  original: string;
  brief: ReorganizedBrandBrief;
  locale: Locale;
}) {
  const original = input.original.trim();
  const polished = input.brief.campaign_goal.trim();
  const compressionRatio = polished.length / Math.max(original.length, 1);
  const shouldPreserveDetail = original.length >= 180 && compressionRatio < 0.72;

  const productDescription = shouldPreserveDetail
    ? mergePreservingDetail(original, polished, input.locale)
    : polished.slice(0, 1500);

  return {
    productDescription,
    rawSummary: productDescription,
    audienceDescription: input.brief.target_audience.trim(),
    extraNotes: input.brief.notes.trim()
  };
}

export function briefPolishSystemPrompt(locale: Locale) {
  const zh = usesChinese(locale);
  if (zh) {
    return [
      "你是品牌广告 Brief 整理助手。用户可能已经写了很详细的需求，也可能只是口语草稿。",
      "核心原则：",
      "1. 禁止删信息：用户提到的平台、受众、卖点、创意方向、参考风格、钩子、镜头、时长、数量、禁忌等必须全部保留。",
      "2. 只做整理：分段、加小标题、理顺语序、去掉口语赘词；不要压缩成两三句话。",
      "3. campaign_goal 输出完整整理后的正文（建议 300-1200 字），可用【投放平台】【目标受众】【产品卖点】【创意方向】【风格调性】【执行要求】等标签组织。",
      "4. 若用户输入已很专业，以润色和结构化为主；信息量只能≥原文，不能更少。",
      "5. campaign_goal 开头用一句「广告创意主旨为…」概括，后面跟完整整理正文。",
      "6. notes 只放 Studio 执行备忘，不要重复 campaign_goal 已有内容。",
      "7. 禁止编造用户未提到的功能或数据。",
      "返回 JSON：campaign_goal、product_name、target_audience、title、notes。"
    ].join("\n");
  }

  return [
    "You are a brand ad brief organizer. The user may already have a detailed brief or only a casual draft.",
    "Rules:",
    "1. Never drop details: platforms, audience, selling points, creative directions, style refs, hooks, shots, duration, quantity, and constraints must all stay.",
    "2. Organize only: add section labels, improve flow, remove filler; do not compress into 2-3 sentences.",
    "3. campaign_goal should be the full organized brief (roughly 300-1200 chars) with clear sections.",
    "4. If the input is already strong, polish and structure it without reducing information.",
    "5. notes is for studio execution reminders only, not a duplicate of campaign_goal.",
    "6. Do not invent product claims.",
    "Return JSON: campaign_goal, product_name, target_audience, title, notes."
  ].join("\n");
}
