import type { MemoryFact } from "@prisma/client";
import { memoryRepository } from "@/features/memory/memory.repository";
import type { CreatorDnaSnapshot } from "@/features/memory/memory.types";
import { prisma } from "@/lib/core/database/prisma";

function collect(facts: MemoryFact[], category: string): string[] {
  return facts.filter((f) => f.category === category).map((f) => f.factValue);
}

export class CreatorDnaService {
  async buildSnapshot(creatorUserId: string): Promise<CreatorDnaSnapshot> {
    const profile = await prisma.creatorProfile.findUnique({ where: { userId: creatorUserId } });
    const facts = await memoryRepository.listFacts({ ownerType: "CREATOR", creatorId: creatorUserId, limit: 200 });
    const legacy = (profile?.creatorDnaJson ?? {}) as { style?: string[]; strength?: string[]; tools?: string[] };

    return {
      version: 1,
      displayName: profile?.displayName,
      tools: [...new Set([...collect(facts, "tools"), ...(legacy.tools ?? [])])],
      formats: collect(facts, "format"),
      aiVideoTools: collect(facts, "ai_video"),
      subtitleStyle: collect(facts, "subtitle"),
      editingSoftware: collect(facts, "editing_software"),
      strengths: [...new Set([...(legacy.strength ?? []), ...(legacy.style ?? [])])],
      updatedAt: new Date().toISOString()
    };
  }

  async syncToProfile(creatorUserId: string) {
    const snapshot = await this.buildSnapshot(creatorUserId);
    await prisma.creatorProfile.updateMany({
      where: { userId: creatorUserId },
      data: { creatorDnaJson: snapshot }
    });
    return snapshot;
  }

  formatForPrompt(snapshot: CreatorDnaSnapshot | null) {
    if (!snapshot) return "";
    const lines: string[] = [];
    if (snapshot.editingSoftware.length) lines.push(`Editing: ${snapshot.editingSoftware.join(", ")}`);
    if (snapshot.aiVideoTools.length) lines.push(`AI video: ${snapshot.aiVideoTools.join(", ")}`);
    if (snapshot.subtitleStyle.length) lines.push(`Subtitles: ${snapshot.subtitleStyle.join("; ")}`);
    if (snapshot.tools.length) lines.push(`Tools: ${snapshot.tools.join(", ")}`);
    if (snapshot.strengths.length) lines.push(`Strengths: ${snapshot.strengths.join(", ")}`);
    return lines.join("\n");
  }
}

export const creatorDnaService = new CreatorDnaService();
