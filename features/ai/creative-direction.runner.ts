import { randomUUID } from "crypto";
import type { CreativeDirection } from "@/features/ai/creative-direction.types";
import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import { aiConfig } from "@/lib/core/config/ai";
import type { Campaign } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { WizardBriefSnapshot } from "@/lib/studioos/brand-wizard-brief-snapshot";

function buildTemplateDirections(campaign: Campaign, language = "en"): CreativeDirection[] {
  const platform = campaign.platform ?? "TikTok";
  const product = campaign.title.replace(/ Campaign$/i, "").trim() || "Product";
  const languageNote = language === "en" ? "" : ` Localize final copy for ${language}.`;

  if (language === "zh") {
    const zhProduct = /^Product$/i.test(product) || /^Campaign$/i.test(product) ? "产品" : product;
    return [
      {
        id: randomUUID(),
        title: "电影质感证明",
        coreIdea: `用高级质感的证明镜头呈现${zhProduct}的核心价值，让品牌一上来就显得更专业、更可信。`,
        hook: `开场 2 秒内用一个主视觉镜头展示${zhProduct}的动态质感。`,
        story: `从用户痛点切入，展示转折、揭示卖点、证明效果，最后落到品牌记忆点。`,
        visualStyle: "高级布光、浅景深、慢速推进、精致产品特写",
        tone: "自信、高级、有品牌感",
        shotList: [
          "动态产品特写开场",
          "生活方式场景展示核心使用方式",
          "证明镜头突出产品利益点",
          "干净的品牌收尾画面与行动引导"
        ],
        cta: "立即了解新品",
        recommendedCreatorType: "擅长灯光、产品特写和电影感画面的商业产品创作者",
        recommendedBudget: `$${Math.max(300, Math.round(Number(campaign.budget) || 300))}`,
        expectedOutcome: "在用户点击前提升产品价值感与品牌信任感。",
        rationale: `适合${platform}等平台中需要快速建立高级感和可信度的投放场景。`
      },
      {
        id: randomUUID(),
        title: "真实口碑证言",
        coreIdea: `让真实创作者在镜头前体验${zhProduct}，把用户的怀疑转化为信任。`,
        hook: `“我没想到${zhProduct}会有这个效果”作为真人开场。`,
        story: `创作者先提出疑问，再真实试用${zhProduct}，展示结果并解释为什么愿意推荐。`,
        visualStyle: "手持拍摄、自然光、快速剪辑、真实体验感",
        tone: "真实、亲近、有说服力",
        shotList: [
          "真人面对镜头提出好奇点",
          "开箱或首次接触产品",
          "使用前后或痛点解决演示",
          "创作者给出结论并引导行动"
        ],
        cta: "现在试试看",
        recommendedCreatorType: "镜头表达自然、擅长真实产品体验的口播型创作者",
        recommendedBudget: `$${Math.max(250, Math.round((Number(campaign.budget) || 300) * 0.9))}`,
        expectedOutcome: "用真实体验降低用户顾虑，提高考虑与转化意愿。",
        rationale: `适合${platform}等平台中依赖口碑、信任和真实使用场景驱动转化的产品。`
      },
      {
        id: randomUUID(),
        title: "破圈吸睛开场",
        coreIdea: `用反差感开场打断滑动，再快速把注意力连接到${zhProduct}的核心卖点。`,
        hook: "用意外视觉反差或趣味转场开场，再揭示产品利益点。",
        story: `先用强反差画面抓住注意力，再揭示${zhProduct}是解决方案，随后快速叠加利益证明。`,
        visualStyle: "醒目字幕、节奏剪辑、高饱和色彩、强对比画面",
        tone: "有趣、高能、节奏快",
        shotList: [
          "意外反差开场画面",
          "快速产品揭示并配合文字强化",
          "连续三个利益点快节奏展示",
          "高对比行动引导收尾"
        ],
        cta: "立即领取优惠",
        recommendedCreatorType: "懂短视频钩子、节奏剪辑和强字幕表达的效果型创作者",
        recommendedBudget: `$${Math.max(300, Math.round((Number(campaign.budget) || 300) * 1.05))}`,
        expectedOutcome: "提升停留率和开头观看时长，适合快节奏信息流。",
        rationale: `适合${platform}等平台中用户快速滑动、需要首帧强吸引力的投放环境。`
      }
    ];
  }

  return [
    {
      id: randomUUID(),
      title: "Cinematic Proof",
      coreIdea: `Make ${product} feel premium by showing the product benefit through polished proof moments.`,
      hook: `Open on a single hero shot — ${product} in motion within 2 seconds.`,
      story: `Show ${product} moving from problem to premium payoff: tension, reveal, proof, then brand moment.`,
      visualStyle: "Premium lighting, shallow depth of field, slow push-ins",
      tone: "Confident, aspirational",
      shotList: [
        "Macro product reveal with motion",
        "Lifestyle scene showing the core use case",
        "Proof shot highlighting the benefit",
        "Clean end card with offer and CTA"
      ],
      cta: "Shop the launch — link in bio",
      recommendedCreatorType: "Cinematic product filmmaker with strong lighting and macro detail work",
      recommendedBudget: `$${Math.max(300, Math.round(Number(campaign.budget) || 300))}`,
      expectedOutcome: "Increase perceived product value and brand trust before the first click.",
      rationale: `Strong for ${platform} when the product looks premium and needs instant credibility.${languageNote}`
    },
    {
      id: randomUUID(),
      title: "UGC Testimonial",
      coreIdea: `Turn skepticism into trust by letting a relatable creator experience ${product} on camera.`,
      hook: `"I didn't expect this from ${product}" — creator face-to-camera cold open.`,
      story: `A creator frames the doubt, tries ${product}, shows the result, then explains why it earned a spot in their routine.`,
      visualStyle: "Handheld, natural light, quick jump cuts",
      tone: "Authentic, conversational",
      shotList: [
        "Face-to-camera curiosity hook",
        "Unboxing or first-touch product moment",
        "Before/after or problem/solution demo",
        "Creator verdict with direct CTA"
      ],
      cta: "Try it today — limited offer",
      recommendedCreatorType: "UGC creator with strong face-to-camera delivery and natural product demos",
      recommendedBudget: `$${Math.max(250, Math.round((Number(campaign.budget) || 300) * 0.9))}`,
      expectedOutcome: "Drive consideration by making the offer feel peer-tested and approachable.",
      rationale: `Performs on ${platform} when social proof and relatability drive consideration.${languageNote}`
    },
    {
      id: randomUUID(),
      title: "Pattern Interrupt",
      coreIdea: `Stop the scroll with a surprising opening, then quickly connect the twist to ${product}.`,
      hook: "Unexpected visual gag or contrast cut before revealing the product benefit.",
      story: `Start with a thumb-stopping contradiction, reveal ${product} as the answer, then stack quick benefit proof.`,
      visualStyle: "Bold typography overlays, rhythmic editing, saturated color",
      tone: "Playful, high-energy",
      shotList: [
        "Unexpected cold-open visual",
        "Fast product reveal with text overlay",
        "Three rapid benefit beats",
        "High-contrast CTA frame"
      ],
      cta: "Tap to claim your discount",
      recommendedCreatorType: "Short-form performance editor who understands hooks, pacing, and punchy overlays",
      recommendedBudget: `$${Math.max(300, Math.round((Number(campaign.budget) || 300) * 1.05))}`,
      expectedOutcome: "Improve thumb-stop rate and initial watch time on fast-scrolling feeds.",
      rationale: `Best when ${platform} audiences scroll fast and you need thumb-stop in the first frame.${languageNote}`
    }
  ];
}

function parseDirectionsFromJson(raw: string, campaign: Campaign, language: string): CreativeDirection[] | null {
  try {
    const parsed = JSON.parse(raw) as { directions?: CreativeDirection[] };
    if (!Array.isArray(parsed.directions) || parsed.directions.length < 3) return null;
    const fallback = buildTemplateDirections(campaign, language);
    return parsed.directions.slice(0, 3).map((d, index) => ({
      id: d.id || randomUUID(),
      title: d.title || fallback[index]?.title || `Direction ${index + 1}`,
      coreIdea: d.coreIdea || fallback[index]?.coreIdea || "",
      hook: d.hook || fallback[index]?.hook || "",
      story: d.story || fallback[index]?.story || "",
      visualStyle: d.visualStyle || fallback[index]?.visualStyle || "",
      tone: d.tone || fallback[index]?.tone || "",
      shotList: Array.isArray(d.shotList) && d.shotList.length
        ? d.shotList.map(String)
        : fallback[index]?.shotList ?? [],
      cta: d.cta || fallback[index]?.cta || "",
      recommendedCreatorType: d.recommendedCreatorType || fallback[index]?.recommendedCreatorType || "",
      recommendedBudget: d.recommendedBudget || fallback[index]?.recommendedBudget || "",
      expectedOutcome: d.expectedOutcome || fallback[index]?.expectedOutcome || "",
      rationale: d.rationale || `Tailored for ${campaign.platform ?? "TikTok"}.`
    }));
  } catch {
    return null;
  }
}

function parseBudgetFromRange(raw: string | undefined, fallback: number) {
  const match = raw?.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : fallback;
}

function campaignWithBriefSnapshot(campaign: Campaign, snapshot?: WizardBriefSnapshot | null): Campaign {
  if (!snapshot) return campaign;
  const fallbackBudget = Number(campaign.budget) || 300;
  const budget = parseBudgetFromRange(snapshot.budgetRange, fallbackBudget);
  return {
    ...campaign,
    title: snapshot.title || snapshot.productName || campaign.title,
    description: snapshot.campaignGoal || snapshot.notes || snapshot.productDescription || campaign.description,
    platform: snapshot.platforms.length ? snapshot.platforms.join(", ") : campaign.platform,
    aspectRatio: snapshot.aspectRatio || campaign.aspectRatio,
    budget: new Prisma.Decimal(budget)
  };
}

export async function runCreativeDirectionJob(
  campaign: Campaign,
  options: { language?: string; briefSnapshot?: WizardBriefSnapshot | null } = {}
): Promise<{
  directions: CreativeDirection[];
  provider: string;
  tokenInput: number;
  tokenOutput: number;
  cost: number;
  latencyMs: number;
}> {
  const language = options.language ?? "en";
  const ctx = campaignWithBriefSnapshot(campaign, options.briefSnapshot);
  if (!aiGatewayService.isConfigured()) {
    const directions = buildTemplateDirections(ctx, language);
    return {
      directions,
      provider: "template",
      tokenInput: 0,
      tokenOutput: 0,
      cost: 0,
      latencyMs: 0
    };
  }

  const result = await aiGatewayService.chatCompletion({
    system:
      `You are VINCIS Creative Director. Generate exactly 3 distinct creative directions for a paid social video campaign. Return JSON only: { directions: [{ title, coreIdea, hook, story, visualStyle, tone, shotList, cta, recommendedCreatorType, recommendedBudget, expectedOutcome, rationale }] }. shotList must be an array of 4 concise shots. Keep hooks under 25 words. No markdown. All user-facing copy must be written in ${language === "zh" ? "Simplified Chinese only. Do not mix English words except unavoidable brand or platform names." : "English only."}`,
    user: JSON.stringify({
      title: ctx.title,
      platform: ctx.platform,
      aspectRatio: ctx.aspectRatio,
      budget: Number(ctx.budget),
      description: ctx.description,
      productName: options.briefSnapshot?.productName,
      audience: options.briefSnapshot?.targetAudience,
      objective: options.briefSnapshot?.objective,
      notes: options.briefSnapshot?.notes,
      language
    }),
    language,
    jsonMode: true,
    temperature: 0.5
  });

  const parsed = parseDirectionsFromJson(result.content, ctx, language);
  const directions = parsed ?? buildTemplateDirections(ctx, language);
  const provider = parsed ? result.provider : "template-fallback";

  return {
    directions,
    provider,
    tokenInput: result.tokenInput,
    tokenOutput: result.tokenOutput,
    cost: result.cost,
    latencyMs: result.latencyMs
  };
}

export { buildTemplateDirections };
