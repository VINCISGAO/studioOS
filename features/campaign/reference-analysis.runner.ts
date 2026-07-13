import "server-only";

import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import { logger } from "@/lib/core/logger";
import {
  referenceAccessStatus,
  referencePlatformLabel
} from "@/lib/studioos/reference-platform";
import type {
  ReferenceAnalysisInput,
  ReferenceAnalysisReport,
  ReferenceInputKind
} from "@/lib/studioos/reference-analysis.types";

function parseJsonObject<T extends Record<string, unknown>>(raw: string): T {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1]?.trim() ?? trimmed;
  return JSON.parse(body) as T;
}

function asStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function normalizeReport(raw: Record<string, unknown>, input: ReferenceAnalysisInput): ReferenceAnalysisReport {
  const locale = input.locale ?? "zh";
  const platformLabel = referencePlatformLabel(input.referenceType, locale);
  const shotBreakdown = Array.isArray(raw.shot_breakdown)
    ? raw.shot_breakdown
        .map((row) => {
          if (!row || typeof row !== "object") return null;
          const item = row as Record<string, unknown>;
          return {
            time_range: String(item.time_range ?? "").trim(),
            shot_description: String(item.shot_description ?? "").trim(),
            framing: String(item.framing ?? "").trim(),
            camera_movement: String(item.camera_movement ?? "").trim(),
            purpose: String(item.purpose ?? "").trim()
          };
        })
        .filter((row) => row && row.shot_description)
    : [];

  const visual = (raw.visual_language ?? {}) as Record<string, unknown>;

  return {
    style_summary: String(raw.style_summary ?? "").trim(),
    creative_outline: asStringArray(raw.creative_outline),
    shot_breakdown: shotBreakdown as ReferenceAnalysisReport["shot_breakdown"],
    visual_language: {
      color: String(visual.color ?? "").trim(),
      lighting: String(visual.lighting ?? "").trim(),
      composition: String(visual.composition ?? "").trim(),
      lens_types: String(visual.lens_types ?? "").trim(),
      editing: String(visual.editing ?? "").trim(),
      typography: String(visual.typography ?? "").trim()
    },
    music_and_rhythm: String(raw.music_and_rhythm ?? "").trim(),
    copyable_elements: asStringArray(raw.copyable_elements),
    non_copyable_elements: asStringArray(raw.non_copyable_elements),
    recommended_creator_types: asStringArray(raw.recommended_creator_types),
    production_difficulty: String(raw.production_difficulty ?? "").trim(),
    copyright_risk_note: String(raw.copyright_risk_note ?? "").trim(),
    confidence: Math.min(100, Math.max(0, Number(raw.confidence ?? 0) || 0)),
    source_label: String(raw.source_label ?? platformLabel).trim() || platformLabel,
    shot_count: shotBreakdown.length,
    estimated_duration_seconds:
      raw.estimated_duration_seconds === null || raw.estimated_duration_seconds === undefined
        ? null
        : Number(raw.estimated_duration_seconds) || null
  };
}

export function buildTemplateReferenceReport(input: ReferenceAnalysisInput): ReferenceAnalysisReport {
  const locale = input.locale ?? "zh";
  const zh = locale === "zh";
  const platformLabel = referencePlatformLabel(input.referenceType, locale);
  const access = referenceAccessStatus(input.referenceType, input.inputKind);
  const uploaded = input.inputKind !== "link";
  const context = input.brandContext?.trim() || input.note?.trim() || "";

  const styleSummary = uploaded
    ? zh
      ? `品牌上传了可直接分析的${platformLabel}。整体风格应围绕品牌已描述的产品与诉求展开，建议采用清晰的产品特写、稳定节奏与克制的信息密度。${context ? `结合品牌说明：${context}` : ""}`
      : `The brand uploaded an analyzable ${platformLabel}. Style should follow the described product and goals with clear product close-ups, controlled pacing, and restrained information density.${context ? ` Brand context: ${context}` : ""}`
    : zh
      ? `该参考来自${platformLabel}。VINCIS 已根据公开链接与品牌说明生成结构化参考说明；${access === "region_restricted" ? "部分地区创作者可能无法直接打开原链接，请优先阅读下方 AI 分析。" : "建议结合 AI 分析理解品牌喜欢的节奏、镜头与情绪方向。"}${context ? ` 品牌说明：${context}` : ""}`
      : `This reference comes from ${platformLabel}. VINCIS generated a structured brief from the public link and brand notes.${access === "region_restricted" ? " Some creators may not open the original link — rely on the AI analysis below." : ""}${context ? ` Brand context: ${context}` : ""}`;

  return {
    style_summary: styleSummary,
    creative_outline: zh
      ? ["开场：快速建立场景与痛点", "中段：展示产品/服务核心卖点", "后段：呈现使用后的情绪变化", "结尾：品牌露出与行动引导"]
      : ["Opening: establish scene and pain point", "Middle: show core product value", "Later: emotional payoff", "End: brand lockup and CTA"],
    shot_breakdown: [
      {
        time_range: "0–2s",
        shot_description: zh ? "主体快速进入画面" : "Subject enters frame quickly",
        framing: zh ? "特写" : "Close-up",
        camera_movement: zh ? "快速推进" : "Fast push-in",
        purpose: zh ? "抓住注意力" : "Hook attention"
      },
      {
        time_range: "2–6s",
        shot_description: zh ? "使用场景或功能展示" : "Usage scene or feature reveal",
        framing: zh ? "中近景" : "Medium close-up",
        camera_movement: zh ? "手持跟随" : "Handheld follow",
        purpose: zh ? "建立真实感" : "Build authenticity"
      },
      {
        time_range: "6–10s",
        shot_description: zh ? "细节或效果对比" : "Detail or before/after contrast",
        framing: zh ? "微距 / 中景" : "Macro / medium",
        camera_movement: zh ? "缓慢横移" : "Slow lateral move",
        purpose: zh ? "强调卖点" : "Emphasize selling point"
      },
      {
        time_range: "10–15s",
        shot_description: zh ? "品牌 Logo 与 CTA" : "Brand logo and CTA",
        framing: zh ? "全屏图形" : "Full-frame graphic",
        camera_movement: zh ? "固定" : "Static",
        purpose: zh ? "完成转化" : "Drive conversion"
      }
    ],
    visual_language: {
      color: zh ? "低饱和、干净背景、少量品牌色点缀" : "Low saturation, clean backgrounds, restrained brand accents",
      lighting: zh ? "柔光、高亮边缘光" : "Soft light with edge highlights",
      composition: zh ? "大量留白、主体居中" : "Generous negative space, centered subject",
      lens_types: zh ? "产品特写、微距、缓慢推拉" : "Product close-ups, macro, slow push/pull",
      editing: zh ? "前快后稳" : "Fast open, steadier middle and end",
      typography: zh ? "短句、大字号、低信息密度" : "Short lines, large type, low information density"
    },
    music_and_rhythm: zh
      ? "前 3 秒节奏偏快，中段保持稳定脉冲，结尾留出品牌记忆点。建议使用现代电子乐或极简节拍。"
      : "Fast first 3 seconds, steady mid pulse, memorable brand ending. Modern electronic or minimal beat recommended.",
    copyable_elements: zh
      ? ["节奏结构", "光影风格", "镜头类型", "信息顺序", "字幕排版", "情绪方向"]
      : ["Pacing structure", "Lighting style", "Shot types", "Information order", "Subtitle layout", "Emotional direction"],
    non_copyable_elements: zh
      ? ["原视频脚本", "品牌口号", "独特角色", "专属产品设计", "原始音乐", "具有识别度的镜头创意"]
      : ["Original script", "Brand tagline", "Distinct characters", "Proprietary product design", "Original music", "Recognizable shot ideas"],
    recommended_creator_types: zh ? ["商业广告导演", "产品广告创作者", "生活方式短片创作者"] : ["Commercial director", "Product ad creator", "Lifestyle short-form creator"],
    production_difficulty: uploaded ? (zh ? "中" : "Medium") : zh ? "中-高（依赖链接可访问性）" : "Medium-high (depends on link access)",
    copyright_risk_note: zh
      ? "仅参考节奏、镜头语言与情绪方向，不得直接复制原片脚本、音乐、角色或具有识别度的创意。"
      : "Reference pacing, camera language, and mood only — do not copy script, music, characters, or distinctive creative ideas.",
    confidence: uploaded ? 72 : access === "region_restricted" ? 48 : 58,
    source_label: platformLabel,
    shot_count: 4,
    estimated_duration_seconds: 15
  };
}

function analysisSystemPrompt(locale: "zh" | "en", inputKind: ReferenceInputKind) {
  const zh = locale === "zh";
  if (zh) {
    return [
      "你是 VINCIS 广告创意分析总监。任务是把品牌参考内容转换为全球创作者都能理解的专业结构化说明。",
      "创作者可能无法打开原始 YouTube/TikTok/Instagram 链接，因此输出必须自洽、可执行，不依赖访问原链接。",
      inputKind === "uploaded_video"
        ? "这是品牌直接上传的视频文件，可假定内容可完整分析，置信度可更高。"
        : inputKind === "uploaded_image"
          ? "这是品牌上传的截图或关键帧，请从画面推断风格、构图、光线与情绪。"
          : "这是外部公开链接，可能受地区/登录/私密限制；请明确不确定性，但仍给出最佳推断。",
      "必须区分「可以参考」与「不应直接复制」以降低版权风险。",
      "返回严格 JSON：style_summary, creative_outline[], shot_breakdown[{time_range,shot_description,framing,camera_movement,purpose}], visual_language{color,lighting,composition,lens_types,editing,typography}, music_and_rhythm, copyable_elements[], non_copyable_elements[], recommended_creator_types[], production_difficulty, copyright_risk_note, confidence(0-100), source_label, estimated_duration_seconds。"
    ].join("\n");
  }

  return [
    "You are VINCIS reference analysis director. Convert brand references into structured creative guidance creators can use without opening the original link.",
    inputKind === "uploaded_video"
      ? "This is a directly uploaded video — assume fuller analysis with higher confidence."
      : inputKind === "uploaded_image"
        ? "This is an uploaded screenshot/keyframe — infer style, composition, lighting, and mood."
        : "This is an external public link that may be region/login restricted — note uncertainty but still infer.",
    "Separate copyable vs non-copyable elements for copyright safety.",
    "Return strict JSON with style_summary, creative_outline[], shot_breakdown[], visual_language{}, music_and_rhythm, copyable_elements[], non_copyable_elements[], recommended_creator_types[], production_difficulty, copyright_risk_note, confidence, source_label, estimated_duration_seconds."
  ].join("\n");
}

export async function runReferenceAnalysis(input: ReferenceAnalysisInput): Promise<{
  report: ReferenceAnalysisReport;
  provider: "openai" | "template";
}> {
  const locale = input.locale ?? "zh";
  const platformLabel = referencePlatformLabel(input.referenceType, locale);
  const access = referenceAccessStatus(input.referenceType, input.inputKind);

  const userPrompt = [
    `Reference type: ${input.referenceType}`,
    `Input kind: ${input.inputKind}`,
    `Platform label: ${platformLabel}`,
    `Access status: ${access}`,
    `Source URL: ${input.sourceUrl}`,
    input.note ? `Brand note: ${input.note}` : "",
    input.brandContext ? `Brand context: ${input.brandContext}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  if (!aiGatewayService.isConfigured()) {
    return { report: buildTemplateReferenceReport(input), provider: "template" };
  }

  try {
    const result = await aiGatewayService.chatCompletion({
      system: analysisSystemPrompt(locale, input.inputKind),
      user: userPrompt,
      jsonMode: true,
      temperature: 0.35,
      language: locale === "zh" ? "zh-CN" : "en"
    });

    if (!result.content.trim()) {
      return { report: buildTemplateReferenceReport(input), provider: "template" };
    }

    const parsed = normalizeReport(parseJsonObject<Record<string, unknown>>(result.content), input);
    if (!parsed.style_summary) {
      return { report: buildTemplateReferenceReport(input), provider: "template" };
    }

    return { report: parsed, provider: "openai" };
  } catch (error) {
    logger.error("Reference analysis AI failed, using template fallback", {
      service: "reference-analysis.runner",
      referenceId: input.referenceId,
      error: error instanceof Error ? error.message : String(error)
    });
    return { report: buildTemplateReferenceReport(input), provider: "template" };
  }
}
