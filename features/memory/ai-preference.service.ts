import { memoryRepository } from "@/features/memory/memory.repository";
import type { AuthUser } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import type { AiTonePreference } from "@prisma/client";

const DEFAULTS = {
  alwaysTranslate: true,
  neverUseEmojis: false,
  tone: "PROFESSIONAL" as AiTonePreference
};

export class AiPreferenceService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  async getForUser(userId: string) {
    this.assertDb();
    const pref = await memoryRepository.getPreference(userId);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { language: true } });
    return {
      preferredLanguage: pref?.preferredLanguage ?? user?.language ?? "en",
      alwaysTranslate: pref?.alwaysTranslate ?? DEFAULTS.alwaysTranslate,
      neverUseEmojis: pref?.neverUseEmojis ?? DEFAULTS.neverUseEmojis,
      tone: pref?.tone ?? DEFAULTS.tone
    };
  }

  async updateForUser(user: AuthUser, data: {
    preferredLanguage?: string;
    alwaysTranslate?: boolean;
    neverUseEmojis?: boolean;
    tone?: AiTonePreference;
  }) {
    this.assertDb();
    const updated = await memoryRepository.upsertPreference(user.id, {
      preferredLanguage: data.preferredLanguage,
      alwaysTranslate: data.alwaysTranslate,
      neverUseEmojis: data.neverUseEmojis,
      tone: data.tone
    });

    if (data.preferredLanguage) {
      await prisma.user.update({
        where: { id: user.id },
        data: { language: data.preferredLanguage }
      });
    }

    return {
      preferredLanguage: updated.preferredLanguage ?? "en",
      alwaysTranslate: updated.alwaysTranslate,
      neverUseEmojis: updated.neverUseEmojis,
      tone: updated.tone
    };
  }
}

export const aiPreferenceService = new AiPreferenceService();
