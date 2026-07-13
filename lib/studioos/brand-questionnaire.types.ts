import type { CommercialObjective } from "@/lib/project-types";

export type BrandQuestionnaireInput = {
  projectTitle?: string;
  brandName?: string;
  productName?: string;
  productDescription: string;
  objective: CommercialObjective;
  objectiveLabel: string;
  audienceDescription: string;
  platforms: string[];
  extraNotes?: string;
  rawSummary: string;
  productUrl?: string;
  budgetRange?: string;
  audienceRegion?: string;
  creativeStyles?: string[];
  creativeStyleCustom?: string;
  brandWebsite?: string;
};

/** Authoritative brand label for optimizer output — never let AI rename the brand. */
export function resolveQuestionnaireBrandName(
  input: Pick<BrandQuestionnaireInput, "productName" | "brandName" | "projectTitle">
): string {
  return input.projectTitle?.trim() || input.brandName?.trim() || input.productName?.trim() || "";
}

function stripCampaignSuffix(name: string): string {
  return name.replace(/\s+campaign$/i, "").trim();
}

function isLoginPlaceholderBrandName(name: string, email: string): boolean {
  const trimmed = stripCampaignSuffix(name).toLowerCase();
  if (!trimmed) return true;
  const token = email.split("@")[0]?.toLowerCase() ?? "";
  if (!token) return false;
  return trimmed === token || trimmed.startsWith(token);
}

/** Form + brand profile — prefer profile when form still has login/email placeholder. */
export function resolveBriefBrandName(
  input: Pick<BrandQuestionnaireInput, "productName" | "brandName" | "projectTitle">,
  options?: {
    profileDisplayName?: string | null;
    profileCompanyName?: string | null;
    clientEmail?: string;
  }
): string {
  const email = options?.clientEmail?.trim().toLowerCase() ?? "";
  const fromForm = stripCampaignSuffix(resolveQuestionnaireBrandName(input));
  const fromProfile = stripCampaignSuffix(
    options?.profileDisplayName?.trim() || options?.profileCompanyName?.trim() || ""
  );

  if (fromProfile && (isLoginPlaceholderBrandName(fromForm, email) || !fromForm)) {
    return fromProfile;
  }

  return fromForm || fromProfile || (email ? email.split("@")[0] ?? "" : "");
}
