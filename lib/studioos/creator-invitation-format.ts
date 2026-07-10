import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";
import type { Locale } from "@/lib/i18n";
import type { StoredProject } from "@/lib/project-types";
import { formatCurrency } from "@/lib/utils";

const categoryLabels: Record<string, Record<Locale, string>> = {
  CPG: { en: "Tech & electronics", zh: "科技电子" },
  tech: { en: "Tech & electronics", zh: "科技电子" },
  beauty: { en: "Beauty & fashion", zh: "时尚美妆" },
  fashion: { en: "Beauty & fashion", zh: "时尚美妆" }
};

const demoBudgetLabels: Record<string, Record<Locale, string>> = {
  inv_demo_pending_01: { en: "$1,800 USD", zh: "$1,800 USD" },
  inv_demo_pending_03: { en: "$300 USD", zh: "$300 USD" }
};

export function localizeInvitationCategory(category: string | null | undefined, locale: Locale) {
  const key = category?.trim().toLowerCase() ?? "";
  if (!key) return locale === "zh" ? "综合类目" : "General";
  const mapped = categoryLabels[key];
  if (mapped) return mapped[locale];
  return category ?? (locale === "zh" ? "综合类目" : "General");
}

export function formatInvitationDeadline(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: locale === "zh" ? "long" : "short",
    day: "numeric"
  });
}

export function buildInvitationBudgetLabel(
  project: StoredProject | null,
  invitation: CreatorPortalInvitationView,
  locale: Locale = "en"
) {
  const demoBudget = demoBudgetLabels[invitation.id]?.[locale];
  if (demoBudget) return demoBudget;
  if (project?.budget_range?.trim()) {
    return project.budget_range;
  }
  return `${formatCurrency(invitation.budget)} ${invitation.currency}`;
}
