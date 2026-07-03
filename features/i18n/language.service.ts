import type { Language, Prisma } from "@prisma/client";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import {
  DEFAULT_LANGUAGE_CODE,
  SUPPORTED_LANGUAGE_SEEDS,
  normalizeLanguageCode
} from "@/features/i18n/language.constants";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { appError } from "@/lib/core/errors";

export type TranslationUpsertInput = {
  namespace: string;
  key: string;
  description?: string | null;
  translations: Record<string, string | null | undefined>;
};

function assertDb() {
  if (!hasDatabaseUrl()) {
    throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }
}

function splitFullKey(fullKey: string) {
  const normalized = fullKey.trim();
  const separator = normalized.indexOf(".");
  if (separator <= 0 || separator === normalized.length - 1) {
    throw appError("VALIDATION_ERROR", "Translation key must use namespace.key format");
  }
  return {
    namespace: normalized.slice(0, separator),
    key: normalized.slice(separator + 1)
  };
}

export class LanguageService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  async ensureSeedLanguages() {
    assertDb();
    for (const seed of SUPPORTED_LANGUAGE_SEEDS) {
      await prisma.language.upsert({
        where: { code: seed.code },
        update: {
          locale: seed.locale,
          nativeName: seed.nativeName,
          englishName: seed.englishName,
          isDefault: seed.isDefault,
          isEnabled: seed.isEnabled,
          sortOrder: seed.sortOrder
        },
        create: seed
      });
    }
  }

  async listLanguages(options: { includeDisabled?: boolean } = {}) {
    assertDb();
    await this.ensureSeedLanguages();
    return prisma.language.findMany({
      where: options.includeDisabled ? undefined : { isEnabled: true },
      orderBy: [{ sortOrder: "asc" }, { englishName: "asc" }]
    });
  }

  async setLanguageEnabled(user: AuthUser, code: string, isEnabled: boolean): Promise<Language> {
    PermissionService.assert(user, "admin.language.manage");
    assertDb();
    const languageCode = normalizeLanguageCode(code);
    if (languageCode === DEFAULT_LANGUAGE_CODE && !isEnabled) {
      throw appError("VALIDATION_ERROR", "Default language cannot be disabled");
    }
    return prisma.language.update({
      where: { code: languageCode },
      data: { isEnabled }
    });
  }

  async setDefaultLanguage(user: AuthUser, code: string): Promise<Language> {
    PermissionService.assert(user, "admin.language.manage");
    assertDb();
    const languageCode = normalizeLanguageCode(code);
    return prisma.$transaction(async (tx) => {
      await tx.language.updateMany({ data: { isDefault: false } });
      return tx.language.update({
        where: { code: languageCode },
        data: { isDefault: true, isEnabled: true }
      });
    });
  }

  async upsertTranslation(user: AuthUser, input: TranslationUpsertInput) {
    PermissionService.assert(user, "admin.language.manage");
    assertDb();
    const namespace = input.namespace.trim();
    const key = input.key.trim();
    if (!namespace || !key) {
      throw appError("VALIDATION_ERROR", "namespace and key are required");
    }

    const languageKey = await prisma.languageKey.upsert({
      where: { namespace_key: { namespace, key } },
      update: { description: input.description ?? null },
      create: { namespace, key, description: input.description ?? null }
    });

    for (const [rawLanguageCode, rawValue] of Object.entries(input.translations)) {
      const value = rawValue?.trim();
      if (!value) continue;
      const languageCode = normalizeLanguageCode(rawLanguageCode);
      await prisma.languageTranslation.upsert({
        where: { keyId_languageCode: { keyId: languageKey.id, languageCode } },
        update: { value },
        create: { keyId: languageKey.id, languageCode, value }
      });
    }

    return this.getTranslationKey(languageKey.id);
  }

  async getTranslationKey(id: string) {
    assertDb();
    return prisma.languageKey.findUnique({
      where: { id },
      include: {
        translations: {
          include: { language: true },
          orderBy: { language: { sortOrder: "asc" } }
        }
      }
    });
  }

  async listTranslationKeys(input: {
    namespace?: string | null;
    search?: string | null;
    limit?: number;
  } = {}) {
    assertDb();
    const search = input.search?.trim();
    const where: Prisma.LanguageKeyWhereInput = {
      ...(input.namespace ? { namespace: input.namespace } : {}),
      ...(search
        ? {
            OR: [
              { namespace: { contains: search, mode: "insensitive" } },
              { key: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { translations: { some: { value: { contains: search, mode: "insensitive" } } } }
            ]
          }
        : {})
    };

    return prisma.languageKey.findMany({
      where,
      include: {
        translations: {
          include: { language: true },
          orderBy: { language: { sortOrder: "asc" } }
        }
      },
      orderBy: [{ namespace: "asc" }, { key: "asc" }],
      take: input.limit ?? 100
    });
  }

  async getTranslationBundle(languageCodeInput: string, namespace?: string | null) {
    assertDb();
    const languageCode = normalizeLanguageCode(languageCodeInput);
    const keys = await prisma.languageKey.findMany({
      where: namespace ? { namespace } : undefined,
      include: {
        translations: {
          where: { languageCode: { in: [languageCode, DEFAULT_LANGUAGE_CODE] } }
        }
      },
      orderBy: [{ namespace: "asc" }, { key: "asc" }]
    });

    const bundle: Record<string, string> = {};
    for (const item of keys) {
      const fullKey = `${item.namespace}.${item.key}`;
      const exact = item.translations.find((translation) => translation.languageCode === languageCode);
      const fallback = item.translations.find(
        (translation) => translation.languageCode === DEFAULT_LANGUAGE_CODE
      );
      bundle[fullKey] = exact?.value ?? fallback?.value ?? fullKey;
    }
    return { languageCode, bundle };
  }

  async translate(fullKey: string, languageCodeInput: string) {
    const { namespace, key } = splitFullKey(fullKey);
    const { bundle } = await this.getTranslationBundle(languageCodeInput, namespace);
    return bundle[`${namespace}.${key}`] ?? fullKey;
  }
}

export const languageService = new LanguageService();
