import { brandDnaService } from "@/features/memory/brand-dna.service";
import type { BrandDnaSnapshot } from "@/features/memory/memory.types";
import { memoryConfig } from "@/lib/core/config/memory";

function isSameAsLastTime(content: string) {
  return memoryConfig.sameAsLastTimePatterns.some((p) => p.test(content));
}

function expandBrandDna(snapshot: BrandDnaSnapshot): string[] {
  const lines: string[] = [];
  if (snapshot.styleReferences.length) {
    lines.push(`Apply previous style references: ${snapshot.styleReferences.join(", ")}`);
  }
  for (const [k, v] of Object.entries(snapshot.visualPreferences)) {
    lines.push(`Visual ${k}: ${v}`);
  }
  for (const rule of snapshot.logoRules) lines.push(`Logo: ${rule}`);
  for (const note of snapshot.pacingNotes) lines.push(`Pacing: ${note}`);
  for (const rule of snapshot.subtitleRules) lines.push(`Subtitles: ${rule}`);
  for (const rule of snapshot.voiceoverRules) lines.push(`Voiceover: ${rule}`);
  for (const rule of snapshot.ctaRules) lines.push(`CTA: ${rule}`);
  for (const c of snapshot.brandColors) lines.push(`Color: ${c}`);
  for (const m of snapshot.musicPreferences) lines.push(`Music: ${m}`);
  return lines;
}

export class MemoryResolutionService {
  isReferenceToPriorWork(content: string) {
    return isSameAsLastTime(content);
  }

  async resolveMessage(content: string, brandUserId: string) {
    if (!isSameAsLastTime(content)) {
      return { resolved: content, expanded: false, hints: [] as string[] };
    }

    const brandDna = await brandDnaService.buildSnapshot(brandUserId);
    const hints = expandBrandDna(brandDna);
    if (!hints.length) {
      return {
        resolved: content,
        expanded: false,
        hints: ["No prior brand memory on file yet — ask brand for specifics"]
      };
    }

    const resolved = [
      content,
      "",
      "[AI expanded from Brand DNA / prior campaigns]",
      ...hints.map((h) => `• ${h}`)
    ].join("\n");

    return { resolved, expanded: true, hints, brandDna };
  }
}

export const memoryResolutionService = new MemoryResolutionService();
