import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import type { Locale } from "@/lib/i18n";
import { normalizeCustomBudgetInput } from "@/lib/studioos/brand-campaign-options";
import { validateBriefScheduleDates, validateBriefVideoDuration } from "@/lib/studioos/brand-creative-brief-form";
import { BRIEF_FIELD_TARGETS } from "@/lib/studioos/brand-creative-brief-scroll";

export type BriefContinueBlocker = {
  error: string;
  targetId: string;
};

export function getBriefContinueBlocker(input: {
  locale: Locale;
  form: BriefFormState;
  productReady: boolean;
  budgetCustom: string;
  copy: {
    needInput: string;
    aspectRatioError: string;
  };
}): BriefContinueBlocker | null {
  const { locale, form, productReady, budgetCustom, copy } = input;
  const productDescription = form.productDescription.trim() || form.rawSummary.trim();

  if (!form.projectTitle.trim()) {
    return {
      error: locale === "zh" ? "请填写项目名称" : "Enter a project name",
      targetId: BRIEF_FIELD_TARGETS.projectTitle
    };
  }

  if (!form.adOneLiner.trim() && !productDescription) {
    return {
      error: locale === "zh" ? "请用一句话描述您的广告需求" : "Describe your ad need in one sentence",
      targetId: BRIEF_FIELD_TARGETS.adOneLiner
    };
  }

  const hasVisual =
    productReady || Boolean(form.productUrl.trim() || form.brandWebsite.trim());
  if (!hasVisual) {
    return { error: copy.needInput, targetId: BRIEF_FIELD_TARGETS.productImage };
  }

  const hasBrief =
    Boolean(productDescription) ||
    Boolean(form.adOneLiner.trim()) ||
    Boolean(form.productName.trim());
  if (!hasBrief) {
    return { error: copy.needInput, targetId: BRIEF_FIELD_TARGETS.productDescription };
  }

  if (!form.aspectRatio) {
    return { error: copy.aspectRatioError, targetId: BRIEF_FIELD_TARGETS.aspectRatio };
  }

  const durationValidation = validateBriefVideoDuration(
    form.videoDuration,
    form.videoDurationCustom,
    locale
  );
  if (!durationValidation.ok) {
    return { error: durationValidation.error, targetId: BRIEF_FIELD_TARGETS.videoDuration };
  }

  if (budgetCustom.trim()) {
    const budgetResult = normalizeCustomBudgetInput(budgetCustom, locale);
    if (!budgetResult.ok) {
      return { error: budgetResult.message, targetId: BRIEF_FIELD_TARGETS.budget };
    }
  }

  if (!form.scheduleStart.trim()) {
    return {
      error: locale === "zh" ? "请选择开始时间" : "Select a start date",
      targetId: BRIEF_FIELD_TARGETS.scheduleStart
    };
  }

  if (!form.scheduleDelivery.trim()) {
    return {
      error: locale === "zh" ? "请选择交付时间" : "Select a delivery date",
      targetId: BRIEF_FIELD_TARGETS.scheduleDelivery
    };
  }

  const scheduleValidation = validateBriefScheduleDates(
    form.scheduleStart,
    form.scheduleDelivery,
    locale
  );
  if (!scheduleValidation.ok) {
    const needsDelivery =
      scheduleValidation.error.includes("交付") ||
      scheduleValidation.error.toLowerCase().includes("delivery");
    return {
      error: scheduleValidation.error,
      targetId: needsDelivery
        ? BRIEF_FIELD_TARGETS.scheduleDelivery
        : BRIEF_FIELD_TARGETS.scheduleStart
    };
  }

  return null;
}
