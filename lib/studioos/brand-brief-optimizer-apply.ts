import type { Locale } from "@/lib/i18n";
import type { CommercialObjective } from "@/lib/project-types";
import { PLATFORM_OPTIONS, resolveCampaignObjectiveFromBrief } from "@/lib/studioos/brand-brief-options";
import type { BrandBriefOptimizerResult } from "@/lib/studioos/brand-brief-optimizer.types";
import { coerceOptimizerText } from "@/lib/studioos/brand-brief-optimizer-coerce";
import { formatProfessionalBriefDocument } from "@/lib/studioos/brand-brief-optimizer-format";

function normalizePlatforms(values: string[]) {
  const mapped = values.map((raw) => {
    const lower = raw.toLowerCase();
    if (lower.includes("tiktok")) return "TikTok";
    if (lower.includes("meta") || lower.includes("facebook")) return "Meta";
    if (lower.includes("youtube")) return "YouTube";
    if (lower.includes("instagram")) return "Instagram";
    if (lower.includes("amazon")) return "Amazon";
    return raw.trim();
  });
  return [...new Set(mapped.filter((item) => PLATFORM_OPTIONS.includes(item as (typeof PLATFORM_OPTIONS)[number])))];
}

function inferVideoDuration(raw: string): string {
  const match = raw.match(/(\d+)\s*s/i);
  if (match) {
    const sec = Number(match[1]);
    if (sec <= 15) return "15s";
    if (sec <= 30) return "30s";
    if (sec <= 45) return "45s";
    if (sec <= 60) return "60s";
    return "90s";
  }
  return "30s";
}

function mapStyleIds(styles: string[]) {
  const ids = new Set<string>();
  for (const raw of styles) {
    const lower = raw.toLowerCase();
    if (/apple|minimal|极简|nothing/.test(lower)) ids.add("minimal");
    if (/luxury|奢华|premium|高端/.test(lower)) ids.add("luxury");
    if (/cinematic|电影|cinema/.test(lower)) ids.add("cinematic");
    if (/lifestyle|生活/.test(lower)) ids.add("lifestyle");
    if (/viral|病毒/.test(lower)) ids.add("viral");
  }
  return [...ids];
}

function mapToneIds(tones: string[]) {
  const ids = new Set<string>();
  for (const raw of tones) {
    const lower = raw.toLowerCase();
    if (/warm|温暖|trust|安心/.test(lower)) ids.add("inspiring");
    if (/premium|高端/.test(lower)) ids.add("premium");
    if (/modern|现代|minimal|极简/.test(lower)) ids.add("modern");
    if (/bold|大胆/.test(lower)) ids.add("bold");
  }
  return [...ids];
}

export function formatOptimizerBriefDocument(result: BrandBriefOptimizerResult, locale: Locale) {
  return formatProfessionalBriefDocument(result, locale).slice(0, 1500);
}

export function applyOptimizerPatches(
  form: {
    projectTitle: string;
    productName: string;
    brandName: string;
    adOneLiner: string;
    objective: CommercialObjective;
    audienceDescription: string;
    audienceAge: string;
    platforms: string[];
    productDescription: string;
    rawSummary: string;
    videoDuration: string;
    creativeStyles: string[];
    creativeTones: string[];
    extraNotes: string;
  },
  optimizer: BrandBriefOptimizerResult,
  locale: Locale,
  options?: { preserveProductionSpecs?: boolean }
) {
  const platforms = normalizePlatforms(optimizer.recommended_platforms);
  const styles = mapStyleIds(optimizer.visual_style);
  const tones = mapToneIds(optimizer.recommended_tones);
  const userSource = `${form.rawSummary} ${form.productDescription}`.trim();
  const objective = resolveCampaignObjectiveFromBrief(
    userSource,
    `${optimizer.primary_objective} ${optimizer.secondary_objectives.join(" ")}`
  );

  const preserveProductionSpecs = options?.preserveProductionSpecs === true;
  const optimizerBrand = coerceOptimizerText(optimizer.campaign_name);
  const formBrand = form.projectTitle.trim() || form.brandName.trim() || form.productName.trim();
  const campaignName = optimizerBrand || formBrand;

  return {
    projectTitle: campaignName,
    productName: campaignName,
    brandName: campaignName,
    adOneLiner: coerceOptimizerText(optimizer.key_message).slice(0, 100),
    objective,
    audienceDescription: coerceOptimizerText(optimizer.audience_primary),
    audienceAge: /25.?40|25-34/.test(coerceOptimizerText(optimizer.audience_primary)) ? "25-34" : form.audienceAge,
    platforms: platforms.length ? platforms : form.platforms,
    ...(preserveProductionSpecs
      ? {}
      : { videoDuration: inferVideoDuration(coerceOptimizerText(optimizer.recommended_video_duration)) }),
    creativeStyles: styles.length ? styles : form.creativeStyles,
    creativeTones: tones.length ? tones : form.creativeTones,
    extraNotes: [optimizer.consumer_insight, optimizer.recommended_cta]
      .map((item) => coerceOptimizerText(item))
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 1500)
  };
}
