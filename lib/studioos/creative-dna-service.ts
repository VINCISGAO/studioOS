import type { CreativeDnaField } from "@/lib/studioos/creative-dna";
import type {
  CreativeDnaProfile,
  CreativePerformanceRecord,
  StoredCreativeInsight,
  WizardIntelligencePrefill
} from "@/lib/studioos/creative-performance-types";

function topRecord(records: CreativePerformanceRecord[]) {
  return [...records].sort((a, b) => b.metrics.ctr - a.metrics.ctr)[0] ?? null;
}

export function buildDnaProfile(
  orgId: string,
  records: CreativePerformanceRecord[],
  insights: StoredCreativeInsight[]
): CreativeDnaProfile {
  const best = topRecord(records);
  const hookInsight = insights.find((item) => item.category === "hook");
  const hookType = hookInsight?.pattern ?? best?.tags.hook_type ?? "first_person";
  const lengthSec = best?.tags.length_sec ?? 15;
  const styles = best?.tags.style_presets ?? ["ugc", "cinematic"];

  return {
    org_id: orgId,
    version: records.length,
    fields: {
      color: "#1D1D1F · #F5F5F7 · accent from product hero",
      typography: "Large headlines · tight tracking · minimal copy",
      transitions: "Hard cut on beat · product hero push-in",
      music: "Minimal electronic · 90–100 BPM",
      hook: hookType === "first_person" ? "First-person opener in first 1.0s" : "Product macro in first 1.2s",
      cta: "Single CTA · bottom third · high contrast",
      pacing: lengthSec <= 15 ? "9–15s · 3 beats · hold final frame 1.5s" : "20–30s · 4 beats",
      voice: hookType === "ugc_handheld" ? "Authentic UGC tone · conversational" : "Calm VO · no hard sell",
      logo: "End card only · min 12% width",
      aspect_ratio: best?.tags.aspect_ratio ?? "9:16",
      style_presets: styles
    },
    learned_from_project_ids: [...new Set(records.map((item) => item.project_id).filter(Boolean))] as string[],
    learned_from_record_ids: records.map((item) => item.id),
    updated_at: new Date().toISOString()
  };
}

export function dnaProfileToFields(profile: CreativeDnaProfile | null, locale: "en" | "zh"): CreativeDnaField[] {
  if (!profile) {
    return [];
  }

  const labels: Record<string, { en: string; zh: string }> = {
    color: { en: "Color", zh: "色彩" },
    typography: { en: "Typography", zh: "字体" },
    transitions: { en: "Transitions", zh: "转场" },
    music: { en: "Music", zh: "音乐" },
    hook: { en: "Hook", zh: "开场钩子" },
    cta: { en: "CTA", zh: "行动号召" },
    pacing: { en: "Pacing", zh: "节奏" },
    voice: { en: "Voice", zh: "旁白" },
    logo: { en: "Logo rules", zh: "Logo 规范" },
    aspect_ratio: { en: "Aspect ratio", zh: "画幅" },
    style_presets: { en: "Style presets", zh: "风格预设" }
  };

  return Object.entries(profile.fields).map(([key, value]) => ({
    key,
    label: labels[key] ?? { en: key, zh: key },
    value: Array.isArray(value) ? value.join(", ") : String(value)
  }));
}

export function buildWizardPrefill(
  profile: CreativeDnaProfile | null,
  insights: StoredCreativeInsight[],
  urlOverrides?: { hook?: string; length?: string; style?: string }
): WizardIntelligencePrefill {
  const styles = profile?.fields.style_presets;
  const styleList = Array.isArray(styles)
    ? styles
    : typeof styles === "string"
      ? styles.split(",").map((s) => s.trim())
      : ["ugc"];

  const lengthFromDna = profile?.fields.pacing?.toString().includes("9–15") ? "15s" : "30s";
  const aspect = String(profile?.fields.aspect_ratio ?? "9:16");

  const hookStyle =
    urlOverrides?.hook ??
    insights.find((item) => item.category === "hook")?.pattern ??
    (profile?.fields.hook?.toString().includes("First-person") ? "first_person" : "product_macro");

  return {
    style_presets: urlOverrides?.style ? [urlOverrides.style, ...styleList].slice(0, 2) : styleList.slice(0, 2),
    video_lengths: [urlOverrides?.length ?? lengthFromDna],
    aspect_ratios: [aspect],
    hook_style: hookStyle,
    insights: insights.slice(0, 3),
    dna_version: profile?.version ?? 0,
    source: profile ? "dna" : insights.length ? "insight" : "none"
  };
}

export async function getWizardIntelligencePrefill(
  orgId: string,
  urlOverrides?: { hook?: string; length?: string; style?: string }
): Promise<WizardIntelligencePrefill> {
  const { getDnaProfile, getInsightsForOrg } = await import("@/lib/studioos/creative-performance-store");
  const [profile, insights] = await Promise.all([getDnaProfile(orgId), getInsightsForOrg(orgId)]);
  return buildWizardPrefill(profile, insights, urlOverrides);
}
