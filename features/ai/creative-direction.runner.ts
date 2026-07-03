import { randomUUID } from "crypto";
import type { CreativeDirection } from "@/features/ai/creative-direction.types";
import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import { aiConfig } from "@/lib/core/config/ai";
import type { Campaign } from "@prisma/client";

function buildTemplateDirections(campaign: Campaign): CreativeDirection[] {
  const platform = campaign.platform ?? "TikTok";
  const product = campaign.title.replace(/ Campaign$/i, "").trim() || "Product";

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
      rationale: `Strong for ${platform} when the product looks premium and needs instant credibility.`
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
      rationale: `Performs on ${platform} when social proof and relatability drive consideration.`
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
      rationale: `Best when ${platform} audiences scroll fast and you need thumb-stop in the first frame.`
    }
  ];
}

function parseDirectionsFromJson(raw: string, campaign: Campaign): CreativeDirection[] | null {
  try {
    const parsed = JSON.parse(raw) as { directions?: CreativeDirection[] };
    if (!Array.isArray(parsed.directions) || parsed.directions.length < 3) return null;
    const fallback = buildTemplateDirections(campaign);
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

export async function runCreativeDirectionJob(campaign: Campaign): Promise<{
  directions: CreativeDirection[];
  provider: string;
  tokenInput: number;
  tokenOutput: number;
  cost: number;
  latencyMs: number;
}> {
  if (!aiGatewayService.isConfigured()) {
    const directions = buildTemplateDirections(campaign);
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
      "You are StudioOS Creative Director. Generate exactly 3 distinct creative directions for a paid social video campaign. Return JSON only: { directions: [{ title, coreIdea, hook, story, visualStyle, tone, shotList, cta, recommendedCreatorType, recommendedBudget, expectedOutcome, rationale }] }. shotList must be an array of 4 concise shots. Keep hooks under 25 words. No markdown.",
    user: JSON.stringify({
      title: campaign.title,
      platform: campaign.platform,
      aspectRatio: campaign.aspectRatio,
      budget: Number(campaign.budget),
      description: campaign.description
    }),
    jsonMode: true,
    temperature: 0.5
  });

  const parsed = parseDirectionsFromJson(result.content, campaign);
  const directions = parsed ?? buildTemplateDirections(campaign);
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
