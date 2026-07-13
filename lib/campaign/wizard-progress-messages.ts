import type { Locale } from "@/lib/i18n";
import type { WizardPhase } from "@/lib/campaign/wizard-steps";

export const WIZARD_PROGRESS_MESSAGES: Record<
  WizardPhase,
  Record<Locale, string[]>
> = {
  idle: { en: [], zh: [] },
  analyzing: {
    en: [
      "Reading your brief…",
      "Analyzing product visuals…",
      "Studying reference videos…",
      "Drafting creative direction…",
      "Building storyboard & script…"
    ],
    zh: ["读取创意简报…", "分析产品视觉…", "研究参考视频…", "撰写创意方向…", "生成分镜与脚本…"]
  },
  matching: {
    en: [
      "Publishing campaign…",
      "Scanning creator network…",
      "Scoring style fit…",
      "Ranking top matches…"
    ],
    zh: ["发布广告项目…", "扫描创作者网络…", "评估风格匹配…", "排序最佳匹配…"]
  },
  publishing: {
    en: ["Finalizing campaign…", "Syncing escrow & notifications…"],
    zh: ["完成广告项目设置…", "同步托管与通知…"]
  }
};

export function messageForAnalyzingIndex(index: number, locale: Locale): string {
  const list = WIZARD_PROGRESS_MESSAGES.analyzing[locale];
  return list[Math.min(index, list.length - 1)] ?? list[0] ?? "";
}

export function messageForMatchingIndex(index: number, locale: Locale): string {
  const list = WIZARD_PROGRESS_MESSAGES.matching[locale];
  return list[Math.min(index, list.length - 1)] ?? list[0] ?? "";
}
