/** Client/server-safe brief payload for wizard AI prefetch (no DB round-trip). */
export type WizardBriefSnapshot = {
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
  campaignGoal: string;
  targetAudience: string;
  title: string;
  notes: string;
};

export type BriefFormSnapshotInput = {
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
  refined?: {
    campaign_goal: string;
    product_name?: string;
    target_audience: string;
    title: string;
    notes: string;
  } | null;
};

export function snapshotFromBriefForm(form: BriefFormSnapshotInput): WizardBriefSnapshot {
  const productName = (form.productName ?? "").trim() || form.refined?.product_name?.trim() || "";
  const campaignGoal =
    form.refined?.campaign_goal?.trim() ||
    (form.productDescription ?? "").trim() ||
    (form.rawSummary ?? "").trim() ||
    "";
  const targetAudience =
    form.refined?.target_audience?.trim() || (form.audienceDescription ?? "").trim() || "";
  const title = form.refined?.title?.trim() || (productName ? `${productName} Campaign` : "Campaign");
  const notes =
    form.refined?.notes?.trim() ||
    [(form.productDescription ?? ""), (form.extraNotes ?? ""), (form.rawSummary ?? "")].filter(Boolean).join("\n\n");

  return {
    productName,
    productUrl: (form.productUrl ?? "").trim(),
    productDescription: (form.productDescription ?? "").trim(),
    objective: form.objective ?? "launch",
    audienceDescription: (form.audienceDescription ?? "").trim(),
    platforms: form.platforms ?? [],
    extraNotes: (form.extraNotes ?? "").trim(),
    rawSummary: (form.rawSummary ?? "").trim(),
    budgetRange: form.budgetRange ?? "",
    aspectRatio: form.aspectRatio ?? "",
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
      productName: String(parsed.productName ?? ""),
      productUrl: String(parsed.productUrl ?? ""),
      productDescription: String(parsed.productDescription ?? ""),
      objective: String(parsed.objective ?? "launch"),
      audienceDescription: String(parsed.audienceDescription ?? ""),
      platforms: Array.isArray(parsed.platforms) ? parsed.platforms.map(String) : [],
      extraNotes: String(parsed.extraNotes ?? ""),
      rawSummary: String(parsed.rawSummary ?? ""),
      budgetRange: String(parsed.budgetRange ?? ""),
      aspectRatio: String(parsed.aspectRatio ?? ""),
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
