import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import { memoryRepository } from "@/features/memory/memory.repository";
import { brandDnaService } from "@/features/memory/brand-dna.service";
import { creatorDnaService } from "@/features/memory/creator-dna.service";
import type { ExtractedMemoryFact } from "@/features/memory/memory.types";
import { memoryConfig } from "@/lib/core/config/memory";
import type { MemoryOwnerType } from "@prisma/client";

function heuristicExtract(content: string, senderRole: string): ExtractedMemoryFact[] {
  const facts: ExtractedMemoryFact[] = [];
  const lower = content.toLowerCase();

  const styleMatch = content.match(/(?:like|style of|风格(?:像|如)?)\s*([A-Za-z\u4e00-\u9fff][\w\s.-]{1,40})/i);
  if (styleMatch?.[1]) {
    facts.push({
      category: "style_reference",
      key: "reference_brand",
      value: styleMatch[1].trim(),
      confidence: 0.85,
      ownerType: senderRole === "CREATOR" ? "CREATOR" : "BRAND"
    });
  }

  if (/apple|极简|minimalist|minimal/i.test(content)) {
    facts.push({
      category: "style_reference",
      key: "aesthetic",
      value: "Apple minimalist — clean, white space, slow rhythm",
      confidence: 0.9,
      ownerType: "BRAND"
    });
    facts.push({ category: "visual", key: "background", value: "White background", confidence: 0.85, ownerType: "BRAND" });
    facts.push({ category: "pacing", key: "tempo", value: "Slow, deliberate pacing", confidence: 0.8, ownerType: "BRAND" });
    facts.push({ category: "subtitle", key: "style", value: "Black and white subtitles", confidence: 0.8, ownerType: "BRAND" });
    facts.push({ category: "voiceover", key: "gender", value: "Female voiceover", confidence: 0.75, ownerType: "BRAND" });
  }

  if (/logo.*(右下|bottom.?right|lower.?right)/i.test(content) || /右下角.*logo/i.test(content)) {
    facts.push({ category: "logo", key: "placement", value: "Bottom-right corner", confidence: 0.95, ownerType: "BRAND" });
  }

  if (/快节奏|fast.?paced|quick cuts/i.test(content)) {
    facts.push({ category: "pacing", key: "tempo", value: "Fast-paced editing", confidence: 0.85, ownerType: "BRAND" });
  }
  if (/黑人|black model/i.test(content)) {
    facts.push({ category: "model_casting", key: "talent", value: "Prefer Black models", confidence: 0.85, ownerType: "BRAND" });
  }
  if (/电影感|cinematic/i.test(content)) {
    facts.push({ category: "visual", key: "look", value: "Cinematic look", confidence: 0.85, ownerType: "BRAND" });
  }
  if (/字幕.*大|large subtitle|big caption/i.test(content)) {
    facts.push({ category: "subtitle", key: "size", value: "Large subtitles required", confidence: 0.9, ownerType: "BRAND" });
  }
  if (/logo.*(最后|end|final)/i.test(content)) {
    facts.push({ category: "logo", key: "timing", value: "Logo appears at end", confidence: 0.9, ownerType: "BRAND" });
  }
  if (/cta.*(\d+\s*秒|within \d+ sec)/i.test(content)) {
    const m = content.match(/(\d+)\s*秒|within (\d+)/i);
    facts.push({
      category: "cta",
      key: "timing",
      value: `CTA within ${m?.[1] ?? m?.[2] ?? "5"} seconds`,
      confidence: 0.9,
      ownerType: "BRAND"
    });
  }
  if (/#[0-9a-fA-F]{3,8}/.test(content)) {
    const colors = content.match(/#[0-9a-fA-F]{3,8}/g) ?? [];
    for (const c of colors) {
      facts.push({ category: "color", key: c, value: `Brand color ${c}`, confidence: 0.95, ownerType: "BRAND" });
    }
  }
  if (/电子|electronic music/i.test(content)) {
    facts.push({ category: "music", key: "genre", value: "Electronic music", confidence: 0.85, ownerType: "BRAND" });
  }

  if (/premiere/i.test(lower)) {
    facts.push({ category: "editing_software", key: "primary", value: "Adobe Premiere", confidence: 0.9, ownerType: "CREATOR" });
  }
  if (/中文字幕|chinese subtitle/i.test(content)) {
    facts.push({ category: "subtitle", key: "language", value: "Chinese subtitles", confidence: 0.9, ownerType: "CREATOR" });
  }
  if (/runway/i.test(lower)) {
    facts.push({ category: "ai_video", key: "runway", value: "Runway", confidence: 0.9, ownerType: "CREATOR" });
  }
  if (/veo/i.test(lower)) {
    facts.push({ category: "ai_video", key: "veo", value: "Google Veo", confidence: 0.9, ownerType: "CREATOR" });
  }

  return facts;
}

function parseAiFacts(raw: string): ExtractedMemoryFact[] {
  try {
    const parsed = JSON.parse(raw) as { facts?: ExtractedMemoryFact[] };
    if (!Array.isArray(parsed.facts)) return [];
    return parsed.facts.filter((f) => f.category && f.key && f.value);
  } catch {
    return [];
  }
}

export class MemoryExtractionService {
  async extractFromMessage(input: {
    content: string;
    senderRole: string;
    brandId?: string | null;
    creatorId?: string | null;
    campaignId?: string | null;
    sourceRefId?: string;
  }) {
    let facts = heuristicExtract(input.content, input.senderRole);

    if (aiGatewayService.isConfigured()) {
      try {
        const result = await aiGatewayService.chatCompletion({
          system: `Extract durable brand/creator preferences from ad collaboration messages. Output JSON only: {"facts":[{"category":"...","key":"...","value":"...","confidence":0.9,"ownerType":"BRAND|CREATOR"}]}. Categories: ${memoryConfig.factCategories.join(", ")}. Skip one-off task details; keep reusable DNA.`,
          user: JSON.stringify({ message: input.content, senderRole: input.senderRole }),
          jsonMode: true,
          temperature: 0.2
        });
        facts = [...facts, ...parseAiFacts(result.content)];
      } catch {
        // heuristic only
      }
    }

    const saved = [];
    for (const fact of facts) {
      const ownerType = (fact.ownerType ?? (input.senderRole === "CREATOR" ? "CREATOR" : "BRAND")) as MemoryOwnerType;
      const brandId = ownerType === "CREATOR" ? input.brandId : input.brandId;
      const creatorId = ownerType === "CREATOR" ? input.creatorId : null;

      const row = await memoryRepository.upsertFact({
        ownerType,
        brandId: brandId ?? undefined,
        creatorId: creatorId ?? undefined,
        campaignId: input.campaignId ?? undefined,
        category: fact.category,
        factKey: fact.key,
        factValue: fact.value,
        confidence: fact.confidence,
        sourceType: "message",
        sourceRefId: input.sourceRefId
      });
      saved.push(row);
    }

    if (input.brandId && facts.some((f) => (f.ownerType ?? "BRAND") === "BRAND")) {
      await brandDnaService.syncToProfile(input.brandId);
    }
    if (input.creatorId && facts.some((f) => f.ownerType === "CREATOR")) {
      await creatorDnaService.syncToProfile(input.creatorId);
    }

    return saved;
  }
}

export const memoryExtractionService = new MemoryExtractionService();
