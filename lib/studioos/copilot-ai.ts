import type { CopilotAction, CopilotContext } from "@/lib/studioos/copilot";
import { generateCopilotOutput } from "@/lib/studioos/copilot";
import { hasOpenAI, openAIModel } from "@/lib/studioos/config";
import type { Locale } from "@/lib/i18n";

const ACTION_PROMPTS: Record<CopilotAction, { en: string; zh: string }> = {
  brief: {
    en: "Write a structured creative brief for a paid social video ad. Include product, goal, audience, style, key message, deliverables (9:16 TikTok + 1:1 cutdown), and success metrics.",
    zh: "撰写一份付费社交视频广告的 Creative Brief。包含产品、目标、受众、风格、核心信息、交付物（9:16 TikTok + 1:1 精简版）和成功指标。"
  },
  script: {
    en: "Write a 15-second video ad script with timestamped VO and scene directions. Hook in first 2 seconds, 3 benefit beats, clear CTA end card.",
    zh: "写一条 15 秒视频广告脚本，带时间戳旁白和场景指导。前 2 秒钩子，3 个利益点，明确 CTA 尾帧。"
  },
  storyboard: {
    en: "Create a 5-frame storyboard with timestamp, visual description, and motion notes for each frame.",
    zh: "创建 5 帧分镜，每帧含时间戳、画面描述和运镜说明。"
  },
  shot_list: {
    en: "Create a shot list table: shot #, duration, shot type, camera notes, assets needed.",
    zh: "创建镜头表：镜号、时长、镜头类型、机位说明、所需素材。"
  },
  prompt: {
    en: "Write AI video generation prompts (Runway/Kling style) for each scene. Photorealistic, 9:16, brand-safe.",
    zh: "为每个场景写 AI 视频生成 Prompt（Runway/Kling 风格）。照片级真实、9:16、品牌安全。"
  },
  subtitle: {
    en: "Write timed subtitles with in/out timestamps. Note safe area: bottom 20%, max 2 lines.",
    zh: "写带入出点的时间轴字幕。注明安全区：底部 20%，最多 2 行。"
  },
  voice: {
    en: "Write voice direction: profile, pacing, emphasis words, and a sample read.",
    zh: "写配音指导：声线档案、节奏、重音词和示例朗读稿。"
  },
  cta: {
    en: "Write CTA copy variants, placement, timing, and A/B test suggestions for end card.",
    zh: "写 CTA 文案变体、位置、时长和尾帧 A/B 测试建议。"
  }
};

function buildUserMessage(action: CopilotAction, ctx: CopilotContext, locale: Locale): string {
  const lines = [
    locale === "zh" ? "语言：中文" : "Language: English",
    ctx.projectTitle ? `${locale === "zh" ? "项目" : "Project"}: ${ctx.projectTitle}` : "",
    ctx.brandName ? `${locale === "zh" ? "品牌" : "Brand"}: ${ctx.brandName}` : "",
    ctx.productUrl ? `${locale === "zh" ? "产品链接" : "Product URL"}: ${ctx.productUrl}` : "",
    ctx.campaignGoal ? `${locale === "zh" ? "Campaign 目标" : "Campaign goal"}: ${ctx.campaignGoal}` : "",
    ctx.audience ? `${locale === "zh" ? "目标受众" : "Target audience"}: ${ctx.audience}` : "",
    ctx.platform ? `${locale === "zh" ? "投放平台" : "Platforms"}: ${ctx.platform}` : "",
    ctx.style ? `${locale === "zh" ? "风格参考" : "Style reference"}: ${ctx.style}` : "",
    ctx.budgetRange ? `${locale === "zh" ? "预算" : "Budget"}: ${ctx.budgetRange}` : "",
    ctx.requirements
      ? `${locale === "zh" ? "客户要求" : "Client requirements"}:\n${ctx.requirements}`
      : "",
    "",
    ACTION_PROMPTS[action][locale]
  ];
  return lines.filter(Boolean).join("\n");
}

export type CopilotResult = {
  output: string;
  source: "openai" | "template";
};

export async function generateCopilotWithAI(
  action: CopilotAction,
  ctx: CopilotContext,
  locale: Locale
): Promise<CopilotResult> {
  const fallback = generateCopilotOutput(action, ctx, locale);

  if (!hasOpenAI()) {
    return { output: fallback, source: "template" };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: openAIModel(),
        temperature: 0.65,
        messages: [
          {
            role: "system",
            content:
              locale === "zh"
                ? "你是 VINCIS Production Copilot，专为商业广告制作生成 Brief、脚本、分镜等生产资产。输出简洁、可执行，不要闲聊。"
                : "You are VINCIS Production Copilot. Generate production-ready commercial ad assets. Be concise and actionable. No small talk."
          },
          {
            role: "user",
            content: buildUserMessage(action, ctx, locale)
          }
        ]
      }),
      signal: AbortSignal.timeout(45_000)
    });

    if (!response.ok) {
      return { output: fallback, source: "template" };
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return { output: fallback, source: "template" };
    }

    return { output: content, source: "openai" };
  } catch {
    return { output: fallback, source: "template" };
  }
}
