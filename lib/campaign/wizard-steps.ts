import type { Locale } from "@/lib/i18n";
import { wizard } from "@/lib/design/tokens";

export type CampaignWizardStepKey =
  | "brief"
  | "product"
  | "references"
  | "analysis"
  | "pack"
  | "confirm"
  | "match";

export type CampaignWizardStep = {
  id: number;
  key: CampaignWizardStepKey;
  label: Record<Locale, string>;
};

export const CAMPAIGN_WIZARD_STEP_COUNT = wizard.steps;

/** Brand portal — user-facing 3-step flow (internal backend still tracks 7 substeps). */
export const BRAND_WIZARD_VISIBLE_STEP_COUNT = 3;

export const BRAND_WIZARD_VISIBLE_STEPS: CampaignWizardStep[] = [
  { id: 1, key: "brief", label: { en: "Describe", zh: "谈需求" } },
  { id: 2, key: "confirm", label: { en: "Review", zh: "看方案" } },
  { id: 3, key: "match", label: { en: "Publish", zh: "发布" } }
];

export function clampBrandVisibleStep(step: number): number {
  return Math.min(BRAND_WIZARD_VISIBLE_STEP_COUNT, Math.max(1, Math.floor(step) || 1));
}

export function brandWizardProgressPercent(visibleStep: number): number {
  return Math.round((clampBrandVisibleStep(visibleStep) / BRAND_WIZARD_VISIBLE_STEP_COUNT) * 100);
}

export function completedBrandVisibleSteps(visibleStep: number): number[] {
  return BRAND_WIZARD_VISIBLE_STEPS.filter((s) => s.id < clampBrandVisibleStep(visibleStep)).map((s) => s.id);
}

export function brandWizardStepMeta(locale: Locale, visibleStep: number) {
  const clamped = clampBrandVisibleStep(visibleStep);
  const labels: Record<number, { headline: Record<Locale, string>; subtitle: Record<Locale, string> }> = {
    1: {
      headline: { en: "Describe your ad", zh: "创建您的创意需求" },
      subtitle: {
        en: "The more detail you share, the better we can match you with the right creative team.",
        zh: "请尽可能详细地描述您的需求，AI 帮助您匹配最合适的创作团队。"
      }
    },
    2: {
      headline: { en: "Review and confirm", zh: "确认创意方案" },
      subtitle: {
        en: "AI prepared your plan — check budget and certify the brief.",
        zh: "AI 已生成方案 — 核对预算并确认需求表单。"
      }
    },
    3: {
      headline: { en: "Publish your ad", zh: "发布广告" },
      subtitle: {
        en: "Publish sends intent invitations to matched creators — they accept or decline before you select one.",
        zh: "发布后会向匹配的 Creator 发出意向发单 — 对方接受或拒绝后，你再从名单里选定。"
      }
    }
  };
  return labels[clamped] ?? labels[1]!;
}

export const CAMPAIGN_WIZARD_STEPS: CampaignWizardStep[] = [
  { id: 1, key: "brief", label: { en: "Brief", zh: "Brief" } },
  { id: 2, key: "product", label: { en: "Product", zh: "产品" } },
  { id: 3, key: "references", label: { en: "References", zh: "参考" } },
  { id: 4, key: "analysis", label: { en: "Analysis", zh: "分析" } },
  { id: 5, key: "pack", label: { en: "Creative Pack", zh: "创意包" } },
  { id: 6, key: "confirm", label: { en: "Confirm", zh: "确认" } },
  { id: 7, key: "match", label: { en: "Match", zh: "匹配" } }
];

export function clampWizardStep(step: number): number {
  return Math.min(CAMPAIGN_WIZARD_STEP_COUNT, Math.max(1, Math.floor(step) || 1));
}

export function completedWizardSteps(currentStep: number): number[] {
  return CAMPAIGN_WIZARD_STEPS.filter((s) => s.id < currentStep).map((s) => s.id);
}

export function wizardProgressPercent(currentStep: number): number {
  return Math.round((clampWizardStep(currentStep) / CAMPAIGN_WIZARD_STEP_COUNT) * 100);
}

export type WizardPhase = "idle" | "analyzing" | "matching" | "publishing";

export type WizardDraftState = {
  step: number;
  completedSteps: number[];
  updatedAt: string;
  phase?: WizardPhase;
  progressMessage?: string;
  progressPercent?: number;
};

export function emptyWizardDraft(step = 1): WizardDraftState {
  const clamped = clampWizardStep(step);
  return {
    step: clamped,
    completedSteps: completedWizardSteps(clamped),
    updatedAt: new Date().toISOString(),
    phase: "idle",
    progressPercent: wizardProgressPercent(clamped)
  };
}

/** Map legacy 7-step URLs to the 3-step brand wizard. Steps 1–3 are already visible steps. */
export function migrateLegacyBrandWizardStep(step: number): number {
  const normalized = Math.floor(step) || 1;
  if (normalized <= BRAND_WIZARD_VISIBLE_STEP_COUNT) {
    return clampBrandVisibleStep(normalized);
  }
  if (normalized <= 6) return 2;
  return 3;
}

/** Map legacy 6-step project wizard progress */
export function migrateLegacyProjectWizardStep(step: number): number {
  if (step <= 6) {
    const map: Record<number, number> = { 1: 1, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7 };
    return map[step] ?? clampWizardStep(step);
  }
  return clampWizardStep(step);
}

export function wizardStepMeta(locale: Locale, step: number) {
  const clamped = clampWizardStep(step);
  const labels: Record<number, { headline: Record<Locale, string>; subtitle: Record<Locale, string> }> = {
    1: {
      headline: { en: "Tell us about your campaign", zh: "告诉我们你想做什么广告" },
      subtitle: {
        en: "Describe your idea — AI turns it into a studio-ready brief.",
        zh: "描述你的想法 — AI 整理成 Studio 能用的 Brief。"
      }
    },
    2: {
      headline: { en: "What are you promoting?", zh: "你要推广什么？" },
      subtitle: {
        en: "Upload a product photo and add basic product info.",
        zh: "上传产品图并填写基本信息。"
      }
    },
    3: {
      headline: { en: "Show us ads you like", zh: "找几条你觉得好的广告" },
      subtitle: {
        en: "Paste 1–3 reference links — optional but helps matching.",
        zh: "粘贴 1–3 条参考链接 — 可选，但有助于匹配。"
      }
    },
    4: {
      headline: { en: "Analyzing your inputs", zh: "正在分析你的输入" },
      subtitle: {
        en: "We analyze product, references, and draft your creative direction.",
        zh: "分析产品、参考视频，并生成创意方向。"
      }
    },
    5: {
      headline: { en: "Your creative pack is ready", zh: "创意方案已就绪" },
      subtitle: {
        en: "Review estimated budget, timeline, and generated pack.",
        zh: "查看预估预算、工期与创意包。"
      }
    },
    6: {
      headline: { en: "Confirm your brief", zh: "确认需求表单" },
      subtitle: {
        en: "Certify the brief before matching creators.",
        zh: "确认 Brief 后再进入 Studio 匹配。"
      }
    },
    7: {
      headline: { en: "Matching Studios", zh: "匹配 Studio" },
      subtitle: {
        en: "Finding the best creators for your campaign.",
        zh: "正在为你匹配最合适的创作者。"
      }
    }
  };
  return labels[clamped] ?? labels[1]!;
}
