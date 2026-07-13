import type { FrozenProductionBrief } from "@/features/ai/creative-direction.types";
import type { Locale } from "@/lib/i18n";
import {
  formatMoneyFromUsd,
  formatStoredBudgetRange,
  settlementUsdNote
} from "@/lib/money/display-money";
import type { StoredProject } from "@/lib/project-types";
import { parseBudgetMidpoint } from "@/lib/studioos/brand-checkout-utils";
import { isCreatorSubmittedCreativeDirection } from "@/lib/studioos/creative-direction-selection";

export type BrandPublishConfirmationFallback = {
  schemeTitle: string;
  schemeSummary: string;
};

export type BrandPublishConfirmationSummary = {
  schemeTitle: string;
  schemeSummary: string;
  /** Localized label shown to the brand (e.g. ¥1,800). */
  budgetRange: string;
  /** Canonical USD amount used for escrow settlement. */
  escrowAmountUsd: number;
  /** Localized escrow invoice label (matches budget display currency). */
  escrowAmountLabel: string;
  settlementNote: string | null;
  productLabel: string;
  isCreatorSubmission: boolean;
};

function resolveStoredBudgetRange(
  project: StoredProject,
  budgetOverride?: string | null
): string {
  const questionnaire = project.settings_json?.brand_questionnaire as
    | { budgetRange?: string }
    | undefined;
  return (
    budgetOverride?.trim() ||
    project.budget_range?.trim() ||
    questionnaire?.budgetRange?.trim() ||
    ""
  );
}

export function resolveBrandPublishConfirmationSummary(
  project: StoredProject,
  locale: Locale,
  fallback?: BrandPublishConfirmationFallback | null,
  budgetOverride?: string | null
): BrandPublishConfirmationSummary {
  const settings = (project.settings_json ?? {}) as Record<string, unknown>;
  const frozen = settings.frozen_production_brief as FrozenProductionBrief | undefined;
  const directionId = String(settings.selected_direction_id ?? frozen?.source_direction_id ?? "");
  const isCreatorSubmission = isCreatorSubmittedCreativeDirection(directionId);
  const storedBudget = resolveStoredBudgetRange(project, budgetOverride);
  const escrowAmountUsd = parseBudgetMidpoint(storedBudget);
  const productLabel =
    project.product_name?.trim() ||
    project.title?.trim() ||
    project.company_name?.trim() ||
    (locale === "zh" ? "广告项目" : "Campaign");

  return {
    schemeTitle:
      frozen?.title?.trim() ||
      fallback?.schemeTitle?.trim() ||
      (locale === "zh" ? "已选创意方案" : "Selected creative plan"),
    schemeSummary:
      frozen?.core_idea?.trim() ||
      fallback?.schemeSummary?.trim() ||
      "",
    budgetRange: storedBudget
      ? formatStoredBudgetRange(storedBudget, locale)
      : locale === "zh"
        ? "未填写"
        : "Not set",
    escrowAmountUsd,
    escrowAmountLabel: formatMoneyFromUsd(escrowAmountUsd, locale),
    settlementNote: settlementUsdNote(locale),
    productLabel,
    isCreatorSubmission
  };
}
