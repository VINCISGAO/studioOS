import type { MemoryFact } from "@prisma/client";
import { memoryRepository } from "@/features/memory/memory.repository";
import type { BrandDnaSnapshot } from "@/features/memory/memory.types";
import { prisma } from "@/lib/core/database/prisma";

function collect(facts: MemoryFact[], category: string, key?: string): string[] {
  return facts
    .filter((f) => f.category === category && (!key || f.factKey === key))
    .map((f) => f.factValue);
}

export class BrandDnaService {
  async buildSnapshot(brandUserId: string): Promise<BrandDnaSnapshot> {
    const profile = await prisma.brandProfile.findUnique({ where: { userId: brandUserId } });
    const facts = await memoryRepository.listFacts({ ownerType: "BRAND", brandId: brandUserId, limit: 200 });
    const legacy = (profile?.brandDnaJson ?? {}) as Record<string, unknown>;

    const styleReferences = [
      ...collect(facts, "style_reference"),
      ...(Array.isArray(legacy.styleReferences) ? (legacy.styleReferences as string[]) : [])
    ];

    const visualFacts = facts.filter((f) => f.category === "visual");
    const visualPreferences: Record<string, string> = {};
    for (const f of visualFacts) visualPreferences[f.factKey] = f.factValue;
    if (typeof legacy.background === "string") visualPreferences.background = legacy.background;

    return {
      version: 1,
      companyName: profile?.companyName,
      styleReferences: [...new Set(styleReferences)],
      visualPreferences,
      logoRules: collect(facts, "logo"),
      ctaRules: collect(facts, "cta"),
      brandColors: collect(facts, "color"),
      musicPreferences: collect(facts, "music"),
      subtitleRules: collect(facts, "subtitle"),
      voiceoverRules: collect(facts, "voiceover"),
      pacingNotes: collect(facts, "pacing"),
      updatedAt: new Date().toISOString()
    };
  }

  async syncToProfile(brandUserId: string) {
    const snapshot = await this.buildSnapshot(brandUserId);
    await prisma.brandProfile.updateMany({
      where: { userId: brandUserId },
      data: { brandDnaJson: snapshot }
    });
    return snapshot;
  }

  formatForPrompt(snapshot: BrandDnaSnapshot | null) {
    if (!snapshot) return "";
    const lines: string[] = [];
    if (snapshot.styleReferences.length) lines.push(`Style refs: ${snapshot.styleReferences.join(", ")}`);
    if (Object.keys(snapshot.visualPreferences).length) {
      lines.push(`Visual: ${JSON.stringify(snapshot.visualPreferences)}`);
    }
    if (snapshot.logoRules.length) lines.push(`Logo: ${snapshot.logoRules.join("; ")}`);
    if (snapshot.pacingNotes.length) lines.push(`Pacing: ${snapshot.pacingNotes.join("; ")}`);
    if (snapshot.subtitleRules.length) lines.push(`Subtitles: ${snapshot.subtitleRules.join("; ")}`);
    if (snapshot.voiceoverRules.length) lines.push(`Voiceover: ${snapshot.voiceoverRules.join("; ")}`);
    if (snapshot.ctaRules.length) lines.push(`CTA: ${snapshot.ctaRules.join("; ")}`);
    if (snapshot.brandColors.length) lines.push(`Colors: ${snapshot.brandColors.join(", ")}`);
    if (snapshot.musicPreferences.length) lines.push(`Music: ${snapshot.musicPreferences.join("; ")}`);
    return lines.join("\n");
  }
}

export const brandDnaService = new BrandDnaService();
