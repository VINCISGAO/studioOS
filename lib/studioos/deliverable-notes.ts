import type { Locale } from "@/lib/i18n";
import type { StoredDeliverable } from "@/lib/order-types";

export type DeliverableNotesView = {
  primary: string;
  secondary?: string;
  secondaryLabel?: string;
  showTranslationBadge: boolean;
};

export function deliverableNotesForViewer(
  deliverable: StoredDeliverable,
  role: "studio" | "brand" | "admin",
  viewerLocale: Locale
): DeliverableNotesView | null {
  const original = deliverable.notes?.trim() ?? "";
  const forClient = deliverable.notes_for_client?.trim() ?? "";

  if (!original && !forClient) {
    return null;
  }

  const translated = Boolean(forClient && original && forClient !== original);

  if (role === "studio") {
    return {
      primary: original || forClient,
      secondary: translated ? forClient : undefined,
      secondaryLabel: translated
        ? viewerLocale === "zh"
          ? "品牌看到的译文"
          : "Brand sees"
        : undefined,
      showTranslationBadge: translated
    };
  }

  const clientText = forClient || original;
  return {
    primary: clientText,
    secondary: translated ? original : undefined,
    secondaryLabel: translated
      ? viewerLocale === "zh"
        ? "创作者原文"
        : "Studio original"
      : undefined,
    showTranslationBadge: translated
  };
}
