import { normalizeBriefResolution } from "@/lib/studioos/brand-creative-brief-form";

/** Client/server-safe brief payload for wizard AI prefetch (no DB round-trip). */
export type WizardBriefSnapshot = {
  projectTitle: string;
  adOneLiner: string;
  industry: string;
  brandName: string;
  brandWebsite: string;
  productName: string;
  productUrl: string;
  productDescription: string;
  objective: string;
  audienceDescription: string;
  platforms: string[];
  extraNotes: string;
  rawSummary: string;
  budgetRange: string;
  aspectRatio: string;
  aspectRatioCustom: string;
  videoDuration: string;
  videoDurationCustom: string;
  estimatedShotCount: number;
  creativeStyles: string[];
  creativeStyleCustom: string;
  resolution: string;
  frameRate: string;
  videoQuantity: number;
  mustInclude: string[];
  mustIncludeCustom: string;
  mustAvoid: string[];
  mustAvoidCustom: string;
  deliveryTimeline: string;
  scheduleStart: string;
  scheduleDelivery: string;
  campaignGoal: string;
  targetAudience: string;
  title: string;
  notes: string;
};

export type BriefFormSnapshotInput = {
  projectTitle?: string;
  adOneLiner?: string;
  industry?: string;
  brandName?: string;
  brandWebsite?: string;
  productName?: string;
  productUrl?: string;
  productDescription?: string;
  objective?: string;
  audienceDescription?: string;
  platforms?: string[];
  extraNotes?: string;
  rawSummary?: string;
  budgetRange?: string;
  aspectRatio?: string;
  aspectRatioCustom?: string;
  videoDuration?: string;
  videoDurationCustom?: string;
  estimatedShotCount?: number;
  creativeStyles?: string[];
  creativeStyleCustom?: string;
  resolution?: string;
  frameRate?: string;
  videoQuantity?: number;
  mustInclude?: string[];
  mustIncludeCustom?: string;
  mustAvoid?: string[];
  mustAvoidCustom?: string;
  deliveryTimeline?: string;
  scheduleStart?: string;
  scheduleDelivery?: string;
  refined?: {
    campaign_goal: string;
    product_name?: string;
    target_audience: string;
    title: string;
    notes: string;
  } | null;
};

export function snapshotFromBriefForm(form: BriefFormSnapshotInput): WizardBriefSnapshot {
  const productName =
    (form.productName ?? "").trim() ||
    (form.brandName ?? "").trim() ||
    (form.projectTitle ?? "").trim() ||
    form.refined?.product_name?.trim() ||
    "";
  const campaignGoal =
    form.refined?.campaign_goal?.trim() ||
    (form.productDescription ?? "").trim() ||
    (form.rawSummary ?? "").trim() ||
    "";
  const targetAudience =
    form.refined?.target_audience?.trim() || (form.audienceDescription ?? "").trim() || "";
  const title =
    form.refined?.title?.trim() ||
    (form.projectTitle ?? "").trim() ||
    (productName ? `${productName} Campaign` : "Campaign");
  const notes =
    form.refined?.notes?.trim() ||
    [(form.productDescription ?? ""), (form.extraNotes ?? ""), (form.rawSummary ?? "")].filter(Boolean).join("\n\n");

  return {
    projectTitle: (form.projectTitle ?? "").trim(),
    adOneLiner: (form.adOneLiner ?? "").trim(),
    industry: (form.industry ?? "").trim(),
    brandName: (form.brandName ?? "").trim(),
    brandWebsite: (form.brandWebsite ?? "").trim(),
    productName,
    productUrl: (form.productUrl ?? "").trim(),
    productDescription: (form.productDescription ?? "").trim(),
    objective: form.objective ?? "",
    audienceDescription: (form.audienceDescription ?? "").trim(),
    platforms: form.platforms ?? [],
    extraNotes: (form.extraNotes ?? "").trim(),
    rawSummary: (form.rawSummary ?? "").trim(),
    budgetRange: form.budgetRange ?? "",
    aspectRatio: form.aspectRatio ?? "",
    aspectRatioCustom: (form.aspectRatioCustom ?? "").trim(),
    videoDuration: form.videoDuration ?? "",
    videoDurationCustom: (form.videoDurationCustom ?? "").trim(),
    estimatedShotCount: Math.max(0, Number(form.estimatedShotCount ?? 0) || 0),
    creativeStyles: form.creativeStyles ?? [],
    creativeStyleCustom: (form.creativeStyleCustom ?? "").trim(),
    resolution: normalizeBriefResolution(form.resolution),
    frameRate: form.frameRate ?? "",
    videoQuantity: form.videoQuantity ?? 1,
    mustInclude: form.mustInclude ?? [],
    mustIncludeCustom: (form.mustIncludeCustom ?? "").trim(),
    mustAvoid: form.mustAvoid ?? [],
    mustAvoidCustom: (form.mustAvoidCustom ?? "").trim(),
    deliveryTimeline: form.deliveryTimeline ?? "",
    scheduleStart: (form.scheduleStart ?? "").trim(),
    scheduleDelivery: (form.scheduleDelivery ?? "").trim(),
    campaignGoal,
    targetAudience,
    title,
    notes
  };
}

export function isWizardBriefReady(snapshot: WizardBriefSnapshot, hasProductVisual: boolean) {
  const hasProduct = hasProductVisual || Boolean(snapshot.productUrl);
  const hasBrief =
    Boolean(snapshot.campaignGoal) ||
    Boolean(snapshot.rawSummary) ||
    Boolean(snapshot.productName) ||
    Boolean(snapshot.productDescription);
  return hasProduct && hasBrief;
}

export function parseWizardBriefSnapshot(raw: string | null | undefined): WizardBriefSnapshot | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<WizardBriefSnapshot>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      projectTitle: String(parsed.projectTitle ?? ""),
      adOneLiner: String(parsed.adOneLiner ?? ""),
      industry: String(parsed.industry ?? ""),
      brandName: String(parsed.brandName ?? ""),
      brandWebsite: String(parsed.brandWebsite ?? ""),
      productName: String(parsed.productName ?? ""),
      productUrl: String(parsed.productUrl ?? ""),
      productDescription: String(parsed.productDescription ?? ""),
      objective: String(parsed.objective ?? ""),
      audienceDescription: String(parsed.audienceDescription ?? ""),
      platforms: Array.isArray(parsed.platforms) ? parsed.platforms.map(String) : [],
      extraNotes: String(parsed.extraNotes ?? ""),
      rawSummary: String(parsed.rawSummary ?? ""),
      budgetRange: String(parsed.budgetRange ?? ""),
      aspectRatio: String(parsed.aspectRatio ?? ""),
      aspectRatioCustom: String(parsed.aspectRatioCustom ?? ""),
      videoDuration: String(parsed.videoDuration ?? ""),
      videoDurationCustom: String(parsed.videoDurationCustom ?? ""),
      estimatedShotCount: Math.max(0, Number(parsed.estimatedShotCount ?? 0) || 0),
      creativeStyles: Array.isArray(parsed.creativeStyles) ? parsed.creativeStyles.map(String) : [],
      creativeStyleCustom: String(parsed.creativeStyleCustom ?? ""),
      resolution: normalizeBriefResolution(parsed.resolution),
      frameRate: String(parsed.frameRate ?? ""),
      videoQuantity: Number(parsed.videoQuantity ?? 1) || 1,
      mustInclude: Array.isArray(parsed.mustInclude) ? parsed.mustInclude.map(String) : [],
      mustIncludeCustom: String(parsed.mustIncludeCustom ?? ""),
      mustAvoid: Array.isArray(parsed.mustAvoid) ? parsed.mustAvoid.map(String) : [],
      mustAvoidCustom: String(parsed.mustAvoidCustom ?? ""),
      deliveryTimeline: String(parsed.deliveryTimeline ?? ""),
      scheduleStart: String(parsed.scheduleStart ?? ""),
      scheduleDelivery: String(parsed.scheduleDelivery ?? ""),
      campaignGoal: String(parsed.campaignGoal ?? ""),
      targetAudience: String(parsed.targetAudience ?? ""),
      title: String(parsed.title ?? ""),
      notes: String(parsed.notes ?? "")
    };
  } catch {
    return null;
  }
}

export function appendWizardBriefSnapshot(formData: FormData, snapshot: WizardBriefSnapshot) {
  formData.set("brief_snapshot", JSON.stringify(snapshot));
}
