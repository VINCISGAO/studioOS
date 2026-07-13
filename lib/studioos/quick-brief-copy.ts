import type { Locale } from "@/lib/i18n";
import {
  BRAND_BUDGET_MIN_USD,
  BRAND_BUDGET_PRESET_USD
} from "@/lib/studioos/brand-campaign-options";
import { formatMoneyFromUsd } from "@/lib/money/display-money";

export type QuickBriefLayer = "quick" | "ai-review";

export const QUICK_BUDGET_STOPS = BRAND_BUDGET_PRESET_USD.map((preset, index) => ({
  index,
  value: preset.value,
  usdMid:
    preset.max === null
      ? Math.max(preset.min, 5000)
      : Math.round((preset.min + preset.max) / 2)
}));

export function quickBudgetSliderMinLabel(locale: Locale): string {
  return formatMoneyFromUsd(BRAND_BUDGET_MIN_USD, locale, { currency: "USD" });
}

export function quickBudgetSliderMaxLabel(locale: Locale): string {
  const top = BRAND_BUDGET_PRESET_USD[BRAND_BUDGET_PRESET_USD.length - 1];
  return `${formatMoneyFromUsd(top.min, locale, { currency: "USD" })}+`;
}

export function quickBudgetCurrentLabel(index: number, locale: Locale): string {
  const stop = QUICK_BUDGET_STOPS[index] ?? QUICK_BUDGET_STOPS[0];
  return formatMoneyFromUsd(stop.usdMid, locale, { currency: "USD" });
}

export function quickBriefCopy(locale: Locale) {
  const zh = locale === "zh";
  return {
    layer1Title: zh ? "30 秒说清楚你要什么" : "30 seconds to say what you need",
    layer1Subtitle: zh
      ? "只问最重要的四件事 — 其余交给智能助手"
      : "Four essentials only — AI handles the rest",
    descriptionTitle: zh ? "描述你的需求" : "Describe your needs",
    descriptionHint: zh ? "先写几句大概方向就好" : "A few rough lines is enough",
    descriptionPlaceholder: zh
      ? "例如：我想做一条抖音广告，想讲清楚卖什么、给谁看、想要什么感觉..."
      : "e.g. I want a TikTok ad — what we're selling, who it's for, and the vibe we're going for...",
    descriptionPromptLead: zh ? "还没想清楚？可以从这些方向随便写写：" : "Not sure yet? Jot down anything from these angles:",
    descriptionPromptTags: zh
      ? ["创意想法", "目标人群", "风格感觉", "画面元素", "整体氛围", "投放目标"]
      : ["Creative idea", "Who it's for", "Style & mood", "Visual elements", "Overall tone", "Campaign goal"],
    suggestionLead: zh ? "不会写？试试这些：" : "Not sure what to write? Try these:",
    refreshSuggestions: zh ? "换一批建议" : "More suggestions",
    descriptionSuggestionSets: zh
      ? [
          ["我要推广这款产品", "我要做抖音广告", "我要突出产品功能", "我要高级感风格", "我要提升销量"],
          ["我要做社交媒体广告", "我要做短视频广告", "我要年轻活力风格", "我要讲品牌故事", "我要获取潜在客户"],
          ["我要做产品测评视频", "我要做视频平台广告", "我要温馨治愈风格", "我要突出核心卖点", "我要提升品牌认知"]
        ]
      : [
          ["Promote this product", "Make a TikTok ad", "Highlight product features", "Premium aesthetic", "Boost sales"],
          ["Make a social media ad", "Make Instagram Reels", "Youthful energetic style", "Tell our brand story", "Generate leads"],
          ["Product review video", "YouTube ad", "Warm comforting tone", "Emphasize key selling points", "Build brand awareness"]
        ],
    referenceLabel: zh ? "② 添加参考内容" : "② Add references",
    referenceTitle: zh ? "添加参考内容" : "Add references",
    referenceOptional: zh ? "（选填）" : "(optional)",
    referenceHint: zh
      ? "上传视频、截图或公开链接，系统将自动分析视觉风格、创意结构、镜头语言与节奏"
      : "Upload video, screenshots, or public links — AI analyzes style, structure, shots, and pacing",
    referenceIntakeLead: zh
      ? "上传视频、截图或公开链接，系统将自动分析视觉风格、创意结构、镜头语言与节奏，并转换为创作者可直接理解的专业参考说明。"
      : "Upload video, screenshots, or public links. AI converts them into structured creative guidance creators can use directly.",
    referenceIntakeDisclaimer: zh
      ? "部分外部链接可能因地区或平台限制无法直接访问。平台会优先保存智能分析结果，确保全球创作者都能理解你的参考方向。外部链接解析结果取决于公开状态与平台权限；若无法解析，请上传视频文件、截图或补充文字说明。"
      : "Some external links may be unavailable in certain regions. VINCIS saves AI analysis first so global creators can understand your direction. Link parsing depends on public access — if it fails, upload a file or add notes.",
    referenceLinkTitle: zh ? "添加参考链接" : "Add reference link",
    referenceLinkHint: zh ? "支持主流视频与社交平台的公开链接" : "YouTube, TikTok, Instagram, Vimeo, and other public links",
    referenceVideoTitle: zh ? "上传参考视频" : "Upload reference video",
    referenceVideoHint: zh ? "推荐 — 可获得更完整、更准确的智能分析" : "Recommended — most complete AI analysis",
    referenceImageTitle: zh ? "上传截图或关键帧" : "Upload screenshot / keyframe",
    referenceImageHint: zh ? "适合无法提供原视频时补充画面参考" : "Use when the original video is unavailable",
    referenceCta: zh ? "拖拽或点击上传" : "Drag or click to upload",
    referenceTypes: zh ? "图片 · 视频 · 链接 · 文件" : "Image · Video · Link · File",
    budgetLabel: zh ? "预算范围" : "Budget range",
    budgetUsdNote: zh ? "均以美金计价" : "All amounts in USD",
    budgetAiTitle: zh ? "智能建议预算区间" : "AI suggested budget range",
    budgetAiHint: zh ? "基于你的需求复杂度和市场数据" : "Based on your brief complexity and market data",
    timelineLabel: zh ? "发布时间" : "Release schedule",
    next: zh ? "下一步" : "Next",
    aiWorking: zh ? "智能助手正在分析你的需求…" : "AI is analyzing your brief…",
    budgetReviewTitle: zh ? "确认你的预算" : "Confirm your budget",
    budgetReviewSubtitle: zh
      ? "选择预算档位，查看 VINCIS 智能制作估价引擎的建议。"
      : "Choose a budget tier and review the VINCIS production pricing engine recommendation.",
    aiFound: zh ? "系统发现" : "AI noticed",
    aiInferred: zh ? "自动推断" : "Inferred",
    aiSuggested: zh ? "建议" : "Suggested",
    aiGenerated: zh ? "自动生成" : "Generated",
    aiRecommended: zh ? "推荐" : "Recommended",
    aiCompleted: zh ? "我们已经帮你完成" : "We already completed",
    aiContinue: zh ? "继续" : "Continue",
    aiEdit: zh ? "修改" : "Edit",
    professionalBrief: zh ? "专业广告需求" : "Professional Brief",
    professionalBriefZh: "专业广告需求",
    professionalExpand: zh ? "展开高级字段（代理公司 / 专业品牌）" : "Expand advanced fields (agency & pro brands)",
    professionalCollapse: zh ? "收起高级字段" : "Collapse advanced fields",
    checklist: {
      audience: zh ? "目标受众" : "Audience",
      platform: zh ? "投放平台" : "Platform",
      tone: zh ? "品牌语气" : "Tone",
      cta: zh ? "行动号召" : "CTA",
      hook: zh ? "开场钩子" : "Hook",
      creatorType: zh ? "创作者类型" : "Creator Type"
    },
    needPromote: zh ? "请先描述你的需求" : "Describe your needs first",
    needPolish: zh ? "先写下你的想法，再点智能润色" : "Write your idea first, then run AI polish",
    aiPolish: zh ? "智能润色" : "AI polish",
    aiPolishSubtitle: zh
      ? "自动补全广告策略、目标受众、创意方向、平台建议、创作者类型、执行重点与缺失信息，让普通需求升级为专业广告需求。"
      : "Auto-complete strategy, audience, creative direction, platforms, creator types, execution focus, and gaps — upgrade a plain brief into a pro-ready one.",
    aiPolishing: zh ? "正在润色…" : "Polishing…",
    aiPolishDone: zh ? "润色完成，可继续编辑" : "Polished — edit anytime",
    aiPolishStages: zh
      ? ["正在解读你的需求…", "正在补全广告策略…", "正在整理创意方向…", "正在生成专业文案…"]
      : ["Reading your brief…", "Building campaign strategy…", "Shaping creative direction…", "Writing professional copy…"],
    aiPolishComplete: zh ? "润色完成" : "Polish complete",
    saveDraft: zh ? "保存草稿" : "Save draft",
    back: zh ? "返回修改" : "Back to edit",
    productionLabel: zh ? "制作要求" : "Production requirements"
  };
}

export function budgetIndexFromValue(value: string): number {
  const normalized = value.trim();
  const exact = QUICK_BUDGET_STOPS.findIndex((stop) => stop.value === normalized);
  if (exact >= 0) return exact;

  if (normalized.includes("2,500") || normalized.includes("2500")) {
    return QUICK_BUDGET_STOPS.length - 1;
  }
  if (normalized.includes("1,000") || normalized.includes("1000")) {
    return Math.min(2, QUICK_BUDGET_STOPS.length - 1);
  }
  if (normalized.includes("500")) {
    return Math.min(1, QUICK_BUDGET_STOPS.length - 1);
  }
  return 0;
}
