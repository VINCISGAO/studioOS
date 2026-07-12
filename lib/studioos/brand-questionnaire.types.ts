import type { CommercialObjective } from "@/lib/project-types";

export type BrandQuestionnaireInput = {
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
