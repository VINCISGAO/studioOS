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
      hook: `Open on a single hero shot — ${product} in motion within 2 seconds.`,
      visualStyle: "Premium lighting, shallow depth of field, slow push-ins",
      tone: "Confident, aspirational",
      cta: "Shop the launch — link in bio",
      rationale: `Strong for ${platform} when the product looks premium and needs instant credibility.`
    },
    {
      id: randomUUID(),
      title: "UGC Testimonial",
      hook: `"I didn't expect this from ${product}" — creator face-to-camera cold open.`,
      visualStyle: "Handheld, natural light, quick jump cuts",
      tone: "Authentic, conversational",
      cta: "Try it today — limited offer",
      rationale: `Performs on ${platform} when social proof and relatability drive consideration.`
    },
    {
      id: randomUUID(),
      title: "Pattern Interrupt",
      hook: "Unexpected visual gag or contrast cut before revealing the product benefit.",
      visualStyle: "Bold typography overlays, rhythmic editing, saturated color",
      tone: "Playful, high-energy",
      cta: "Tap to claim your discount",
      rationale: `Best when ${platform} audiences scroll fast and you need thumb-stop in the first frame.`
    }
  ];
}

function parseDirectionsFromJson(raw: string, campaign: Campaign): CreativeDirection[] | null {
  try {
    const parsed = JSON.parse(raw) as { directions?: CreativeDirection[] };
    if (!Array.isArray(parsed.directions) || parsed.directions.length < 3) return null;
    return parsed.directions.slice(0, 3).map((d) => ({
      id: d.id || randomUUID(),
      title: d.title,
      hook: d.hook,
      visualStyle: d.visualStyle,
      tone: d.tone,
      cta: d.cta,
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
      "You are StudioOS Creative Director. Generate exactly 3 distinct creative directions for a paid social video campaign. Return JSON: { directions: [{ title, hook, visualStyle, tone, cta, rationale }] }. Keep hooks under 25 words. No markdown.",
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
