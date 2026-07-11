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
      rationale: d.rationale || d.whyAiRecommendsThis || `Tailored for ${campaign.platform ?? "TikTok"}.`,
      creativeStrategy: d.creativeStrategy || d.title || fallback[index]?.title || "",
      coreInsight: d.coreInsight || d.coreIdea || fallback[index]?.coreIdea || "",
      bigIdea: d.bigIdea || d.coreIdea || fallback[index]?.coreIdea || "",
      openingHook: d.openingHook || d.hook || fallback[index]?.hook || "",
      storyStructure: Array.isArray(d.storyStructure) ? d.storyStructure : [],
      cameraLanguage: d.cameraLanguage || "",
      colorPalette: d.colorPalette || "",
      musicDirection: d.musicDirection || "",
      creatorRequirements: d.creatorRequirements || d.recommendedCreatorType || "",
      aiProductionDifficulty: d.aiProductionDifficulty || "",
      estimatedPerformance: d.estimatedPerformance || d.expectedOutcome || "",
      whyAiRecommendsThis: d.whyAiRecommendsThis || d.rationale || "",
      audienceMatch: typeof d.audienceMatch === "number" ? d.audienceMatch : undefined,
      emotionalResonance: typeof d.emotionalResonance === "number" ? d.emotionalResonance : undefined,
      productIntegration: typeof d.productIntegration === "number" ? d.productIntegration : undefined,
      estimatedCtr: d.estimatedCtr || "",
      recommendedDuration: d.recommendedDuration || "",
      suitableIndustries: Array.isArray(d.suitableIndustries) ? d.suitableIndustries.map(String) : [],
      suitablePlatforms: Array.isArray(d.suitablePlatforms) ? d.suitablePlatforms.map(String) : []
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

function buildCreativeStrategyInput(campaign: Campaign, snapshot?: WizardBriefSnapshot | null) {
  return {
    product: {
      projectTitle: snapshot?.projectTitle || campaign.title,
      brandName: snapshot?.brandName,
      productName: snapshot?.productName || campaign.title,
      industry: snapshot?.industry,
      brandWebsite: snapshot?.brandWebsite,
      productUrl: snapshot?.productUrl,
      oneLiner: snapshot?.adOneLiner,
      description: snapshot?.productDescription || campaign.description,
      rawBrief: snapshot?.rawSummary,
      campaignGoal: snapshot?.campaignGoal
    },
    audience: {
      targetAudience: snapshot?.targetAudience || snapshot?.audienceDescription,
      objective: snapshot?.objective
    },
    production: {
      platforms: snapshot?.platforms?.length ? snapshot.platforms : [campaign.platform].filter(Boolean),
      aspectRatio: snapshot?.aspectRatio || campaign.aspectRatio,
      videoDuration: snapshot?.videoDurationCustom || snapshot?.videoDuration,
      creativeStyles: snapshot?.creativeStyles,
      creativeStyleCustom: snapshot?.creativeStyleCustom,
      resolution: snapshot?.resolution,
      frameRate: snapshot?.frameRate,
      videoQuantity: snapshot?.videoQuantity,
      mustInclude: snapshot?.mustInclude,
      mustIncludeCustom: snapshot?.mustIncludeCustom,
      mustAvoid: snapshot?.mustAvoid,
      mustAvoidCustom: snapshot?.mustAvoidCustom,
      deliveryTimeline: snapshot?.deliveryTimeline,
      scheduleStart: snapshot?.scheduleStart,
      scheduleDelivery: snapshot?.scheduleDelivery
    },
    commercial: {
      budget: Number(campaign.budget),
      budgetRange: snapshot?.budgetRange
    }
  };
}

export async function runCreativeDirectionJob(
  campaign: Campaign,
  options: { language?: string; briefSnapshot?: WizardBriefSnapshot | null; wizardFastPath?: boolean } = {}
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
    throw new Error("OPENAI_API_KEY is required to generate creative directions");
  }

  const result = await aiGatewayService.chatCompletion({
    system:
      [
        "You are the VINCIS Executive Creative Director. Your output is a premium agency Creative Strategy pitch deck, not copywriting, not a student essay, and not a story draft.",
        "Think like Nike, Apple, Meta, Google Creative Lab, Ogilvy, TBWA, and Wieden+Kennedy preparing three strategic routes for a client.",
        "Generate exactly 3 distinct Creative Strategy routes for a paid social video campaign based ONLY on the provided brand brief.",
        "The routes must be strategically different: A may be emotional life moment, B may be product proof/demonstration, C may be cultural tension or platform-native behavior. Do not create three versions of the same story.",
        "Order the three routes by AI recommendation strength: direction A should be the strongest recommendation for the current brief.",
        "Do not open with generic demographic prose such as 'in modern life' or '25-40 year-old consumers'. Start from a sharp consumer insight, tension, or category truth.",
        "Do not write generic filler such as convenient, efficient, enhance experience, premium lifestyle, build trust, or drive conversion unless you immediately explain the specific product truth, audience tension, scene, and proof mechanism.",
        "For each direction, explicitly reference the actual product, category, target user, usage context, platform behavior, budget/timeline constraints, must-include elements, and avoid-list when provided.",
        "Return JSON only with this exact structure: { directions: [{ title, creativeStrategy, coreInsight, bigIdea, openingHook, storyStructure, visualStyle, cameraLanguage, colorPalette, musicDirection, creatorRequirements, aiProductionDifficulty, recommendedBudget, expectedPerformance, whyAiRecommendsThis, audienceMatch, emotionalResonance, productIntegration, estimatedCtr, recommendedDuration, suitableIndustries, suitablePlatforms, coreIdea, hook, story, tone, shotList, cta, recommendedCreatorType, expectedOutcome, rationale }] }.",
        "Field requirements:",
        "- title / creativeStrategy: short agency route name, e.g. 'Everyday Moments', not a generic format label.",
        "- coreInsight: a sharp consumer or category insight. It should sound like a pitch deck page, not an essay.",
        "- bigIdea: the single strategic idea that turns the product into a reason to care.",
        "- openingHook: the first 3 seconds. Give a concrete visual or spoken setup plus the line if relevant.",
        "- storyStructure: exactly 5 stages as objects: { label, title, purpose }. Use labels such as Scene 01, Scene 02. Titles can be Problem, Discovery, Transformation, Proof, CTA or better route-specific labels.",
        "- visualStyle: art direction: composition, environment, lighting, editing rhythm, typography, texture.",
        "- cameraLanguage: lens/framing/movement rules for creators.",
        "- colorPalette: specific color mood and why it fits the strategy.",
        "- musicDirection: music/sound design direction and pacing.",
        "- creatorRequirements: what kind of creator can execute this route, including performance style and production capability.",
        "- aiProductionDifficulty: Low, Medium, or High with a short reason.",
        "- estimatedPerformance: qualitative expectation, not fake percentage math.",
        "- whyAiRecommendsThis: 3-5 bullet-like reasons in one string explaining strategic fit.",
        "- audienceMatch, emotionalResonance, productIntegration: integer 0-100 based on the brief logic. These are strategy-fit scores, not fabricated performance claims.",
        "- estimatedCtr: Low, Medium, or High.",
        "- recommendedDuration: e.g. 15-30s.",
        "- suitableIndustries and suitablePlatforms: arrays.",
        "- legacy fields coreIdea, hook, story, tone, shotList, cta, recommendedCreatorType, expectedOutcome, rationale must mirror the strategy so existing UI and PDF remain compatible.",
        language === "zh"
          ? "All user-facing copy must be Simplified Chinese only, except route labels like Creative Strategy / Core Insight if they are used as UI concepts. Write like a senior Chinese advertising strategist presenting to a brand founder. Avoid childish phrases, essay tone, and empty slogans."
          : "All user-facing copy must be English only. Use concise but senior-level advertising language."
      ].join("\n"),
    user: JSON.stringify({
      creativeStrategyInput: buildCreativeStrategyInput(ctx, options.briefSnapshot),
      language
    }),
    language,
    jsonMode: true,
    temperature: 0.65
  });

  const parsed = parseDirectionsFromJson(result.content, ctx, language);
  if (!parsed) {
    throw new Error("AI returned invalid creative directions JSON");
  }

  return {
    directions: parsed,
    provider: result.provider,
    tokenInput: result.tokenInput,
    tokenOutput: result.tokenOutput,
    cost: result.cost,
    latencyMs: result.latencyMs
  };
}

export { buildTemplateDirections };
