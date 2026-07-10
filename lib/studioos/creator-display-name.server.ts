import "server-only";

import { getCreatorById, getCreatorByIdSync } from "@/lib/creator-service";
import { creators } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import {
  isUserFacingInternalId,
  sanitizeCreatorDisplayName
} from "@/lib/studioos/creator-display-name";

export function resolveCreatorDisplayNameSync(
  creatorId: string,
  options?: { hint?: string | null; locale?: Locale | "en" | "zh" }
) {
  const locale = options?.locale;
  if (options?.hint?.trim() && !isUserFacingInternalId(options.hint)) {
    return options.hint.trim();
  }

  const seedName =
    getCreatorByIdSync(creatorId)?.name ?? creators.find((item) => item.id === creatorId)?.name;
  return sanitizeCreatorDisplayName(seedName, locale);
}

export async function resolveCreatorDisplayName(
  creatorId: string,
  options?: { hint?: string | null; locale?: Locale | "en" | "zh" }
) {
  const locale = options?.locale;
  if (options?.hint?.trim() && !isUserFacingInternalId(options.hint)) {
    return options.hint.trim();
  }

  const creator = await getCreatorById(creatorId);
  return sanitizeCreatorDisplayName(creator?.name, locale);
}
