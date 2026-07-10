import type { Locale } from "@/lib/i18n";
import { creators } from "@/lib/data";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_INLINE_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

export function isUserFacingInternalId(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return true;
  if (UUID_RE.test(trimmed)) return true;
  if (/^creator_[\w-]+$/i.test(trimmed)) return true;
  return false;
}

export function fallbackCreatorDisplayName(locale?: Locale | "en" | "zh") {
  return locale === "zh" ? "创作者" : "Creator";
}

/** Strip internal IDs before showing creator names in product UI or notifications. */
export function sanitizeCreatorDisplayName(
  value: string | null | undefined,
  locale?: Locale | "en" | "zh"
) {
  const trimmed = value?.trim();
  if (!trimmed || isUserFacingInternalId(trimmed)) {
    return fallbackCreatorDisplayName(locale);
  }
  return trimmed;
}

export function resolveCreatorDisplayNameFromSeed(
  creatorId: string,
  options?: { hint?: string | null; locale?: Locale | "en" | "zh" }
) {
  const locale = options?.locale;
  if (options?.hint?.trim() && !isUserFacingInternalId(options.hint)) {
    return options.hint.trim();
  }

  const seedName = creators.find((item) => item.id === creatorId)?.name;
  return sanitizeCreatorDisplayName(seedName, locale);
}

export function sanitizeUserFacingNotificationText(
  text: string,
  locale?: Locale | "en" | "zh"
) {
  const label = fallbackCreatorDisplayName(locale);
  return text
    .replace(UUID_INLINE_RE, label)
    .replace(/\bcreator_[\w-]+\b/gi, label);
}
