"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  hasProductVisual,
  listReferencesForProject
} from "@/lib/campaign-store";
import { requireBrandPortalClientEmail } from "@/lib/client-session";
import { DEMO_USERS } from "@/lib/demo-auth";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  completeWizardStep,
  getProject,
  transitionProject,
  updateProject
} from "@/lib/project-service";
import type { CommercialObjective } from "@/lib/project-types";
import {
  objectiveOptions,
  reorganizeBrandBriefWithAI,
  templateReorganizeBrandBrief,
  type BrandQuestionnaireInput
} from "@/lib/studioos/brand-brief-ai";
import {
  deadlineFromTimeline,
  defaultBrandAspectRatio,
  defaultBrandBudget,
  defaultBrandTimeline,
  isValidBrandAspectRatio
} from "@/lib/studioos/brand-campaign-options";
import { upsertBrandProfileFromBrief } from "@/lib/brand-profile-service";
import { listOrdersForProject, updateOrderRequirements } from "@/lib/order-service";
import { buildConfirmedBriefSnapshot } from "@/lib/studioos/confirmed-brief";
import { campaignBridgeService } from "@/features/campaign/campaign-bridge.service";
import { emitWizardProgress } from "@/lib/campaign/wizard-progress.service";
import { runBrandWizardDemoPrepareInstant, runBrandWizardDemoPublish } from "@/lib/campaign/brand-wizard-demo-prepare";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { preparePublishedCampaignCheckout } from "@/lib/studioos/brand-checkout-service";
import {
  WIZARD_EPHEMERAL_KEY,
  WIZARD_SAVED_AT_KEY
} from "@/lib/studioos/brand-wizard-session";

async function requireBrandClient(): Promise<
  | { ok: true; client_email: string; client_name: string; company_name: string }
  | { ok: false; error: string }
> {
  try {
    const email = await requireBrandPortalClientEmail();
    const demoUser = DEMO_USERS.find((user) => user.email === email);
    return {
      ok: true,
      client_email: email,
      client_name: demoUser?.label ?? email.split("@")[0],
      company_name: demoUser?.label ?? email.split("@")[0]
    };
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
}

async function requireProject(projectId: string, clientEmail: string) {
  const project = await getProject(projectId);
  if (!project || project.client_email.toLowerCase() !== clientEmail.toLowerCase()) {
    return { ok: false as const, error: "Project not found" };
  }
  return { ok: true as const, project };
}

async function resolveBrandCampaignContext(projectId: string, lang: Locale) {
  const client = await requireBrandClient();
  if (!client.ok) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请重新登录广告主账号" : "Please sign in again as a brand"
    };
  }

  const projectResult = await requireProject(projectId, client.client_email);
  if (!projectResult.ok) {
    return {
      ok: false as const,
      error: lang === "zh" ? "项目不存在或无权访问" : "Project not found or access denied"
    };
  }

  return { ok: true as const, client, project: projectResult.project };
}

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return raw === "zh" ? "zh" : "en";
}

function deriveProductName(productUrl: string, fallback: string): string {
  if (!productUrl) return fallback;
  try {
    const host = new URL(productUrl).hostname.replace(/^www\./, "");
    const segment = host.split(".")[0] ?? fallback;
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  } catch {
    return fallback;
  }
}

function defaultDeadlineIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function revalidateBrandCampaign(projectId: string) {
  revalidatePath("/brand");
  revalidatePath("/brand/profile");
  revalidatePath("/brand/projects");
  revalidatePath("/brand/projects/new");
  revalidatePath(brandPortalRoutes.projectCheckout(projectId));
  revalidatePath("/brand/messages");
  revalidatePath(`/brand/projects/${projectId}`);
  revalidatePath(`/brand/projects/${projectId}/studios`);
  revalidatePath("/studio/invitations");
}

function parseObjective(raw: FormDataEntryValue | null): CommercialObjective {
  const value = String(raw ?? "");
  if (["launch", "scale", "test", "seasonal", "other"].includes(value)) {
    return value as CommercialObjective;
  }
  return "launch";
}

function parsePlatforms(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readQuestionnaire(formData: FormData, lang: Locale): BrandQuestionnaireInput {
  const objective = parseObjective(formData.get("objective"));
  const objectiveLabel =
    objectiveOptions(lang).find((item) => item.id === objective)?.label ?? objective;

  return {
    productName: String(formData.get("product_name") ?? "").trim(),
    productUrl: String(formData.get("product_url") ?? "").trim(),
    productDescription: String(formData.get("product_description") ?? "").trim(),
    objective,
    objectiveLabel,
    audienceDescription: String(formData.get("audience_description") ?? "").trim(),
    platforms: parsePlatforms(formData.get("platforms")),
    extraNotes: String(formData.get("extra_notes") ?? "").trim(),
    rawSummary: String(formData.get("raw_summary") ?? "").trim()
  };
}

export async function refineBrandBriefAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const ctx = await resolveBrandCampaignContext(projectId, lang);
  if (!ctx.ok) return ctx;

  const input = readQuestionnaire(formData, lang);
  const hasText =
    input.rawSummary ||
    input.productDescription ||
    input.audienceDescription ||
    input.extraNotes;

  if (!hasText) {
    return {
      ok: false as const,
      error: lang === "zh" ? "先写几句你的想法，AI 才能帮你整理" : "Write a few lines first so AI can polish them"
    };
  }

  const brief = await reorganizeBrandBriefWithAI(input, lang);
  return { ok: true as const, brief };
}

export async function saveBrandCampaignBriefAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const ctx = await resolveBrandCampaignContext(projectId, lang);
  if (!ctx.ok) return ctx;

  const product_url = String(formData.get("product_url") ?? "").trim();
  const input = readQuestionnaire(formData, lang);

  const hasBrief =
    input.rawSummary ||
    input.productDescription ||
    String(formData.get("campaign_goal") ?? "").trim();

  if (!hasBrief) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请描述你想做的广告，或使用 AI 整理" : "Describe your campaign or use AI polish"
    };
  }

  const refinedGoal = String(formData.get("campaign_goal") ?? "").trim();
  const refinedAudience = String(formData.get("target_audience") ?? "").trim();
  const refinedTitle = String(formData.get("title") ?? "").trim();
  const refinedNotes = String(formData.get("notes") ?? "").trim();

  const brief =
    refinedGoal
      ? {
          campaign_goal: refinedGoal,
          product_name: input.productName || deriveProductName(product_url, "My Product"),
          target_audience: refinedAudience || input.audienceDescription || "25-40",
          title: refinedTitle || `${input.productName || deriveProductName(product_url, "My Product")} Campaign`,
          notes: refinedNotes || [input.productDescription, input.extraNotes, input.rawSummary].filter(Boolean).join("\n\n"),
          source: "openai" as const
        }
      : await reorganizeBrandBriefWithAI(input, lang);

  const category = "CPG";
  const target_platform = input.platforms.length ? input.platforms.join(", ") : "TikTok, Meta";
  const budget_range = String(formData.get("budget_range") ?? "").trim() || defaultBrandBudget();
  const delivery_timeline = String(formData.get("delivery_timeline") ?? "").trim() || defaultBrandTimeline();
  const aspect_ratio_raw = String(formData.get("aspect_ratio") ?? "").trim();
  if (!isValidBrandAspectRatio(aspect_ratio_raw)) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请选择视频比例" : "Select a video aspect ratio"
    };
  }

  const deadline = deadlineFromTimeline(delivery_timeline);
  const existingProject = await getProject(projectId);
  const priorSettings = existingProject?.settings_json ?? {};
  const { confirmed_brief: _removed, ...priorWithoutConfirm } = priorSettings as Record<string, unknown>;

  await updateProject(projectId, {
    commercial_objective: input.objective,
    commercial_objective_note: input.extraNotes,
    target_audience: brief.target_audience,
    target_platform,
    title: brief.title,
    campaign_goal: brief.campaign_goal,
    notes: brief.notes,
    budget_range,
    deadline,
    video_format: aspect_ratio_raw,
    aspect_ratios: [aspect_ratio_raw],
    settings_json: {
      ...priorWithoutConfirm,
      brand_questionnaire: {
        ...input,
        budgetRange: budget_range,
        deliveryTimeline: delivery_timeline,
        aspectRatio: aspect_ratio_raw,
        refined_brief: brief,
        refined_at: new Date().toISOString()
      }
    }
  });

  await completeWizardStep(projectId, 1);
  await emitWizardProgress(projectId, { step: 1, phase: "idle", progressMessage: lang === "zh" ? "Brief 已保存" : "Brief saved" });

  revalidateBrandCampaign(projectId);
  return { ok: true as const, nextStep: 2 };
}

export async function saveBrandCampaignProductAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const ctx = await resolveBrandCampaignContext(projectId, lang);
  if (!ctx.ok) return ctx;

  const product_url = String(formData.get("product_url") ?? "").trim();
  const product_name = String(formData.get("product_name") ?? "").trim();
  const hasProduct = await hasProductVisual(projectId);

  if (!product_url && !hasProduct) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请上传产品图，或填写产品链接" : "Upload a product photo or add a product link"
    };
  }

  const resolvedName = product_name || deriveProductName(product_url, "My Product");

  await updateProject(projectId, {
    product_name: resolvedName,
    product_url
  });

  await completeWizardStep(projectId, 2);
  await emitWizardProgress(projectId, { step: 2, phase: "idle" });

  revalidateBrandCampaign(projectId);
  return { ok: true as const, nextStep: 3 };
}

export async function saveBrandCampaignReferencesAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const ctx = await resolveBrandCampaignContext(projectId, lang);
  if (!ctx.ok) return ctx;

  const refs = await listReferencesForProject(projectId);
  await updateProject(projectId, {
    reference_links: refs.map((item) => item.source_url).join("\n")
  });
  await completeWizardStep(projectId, 3);
  await emitWizardProgress(projectId, { step: 3, phase: "idle" });

  revalidateBrandCampaign(projectId);
  return { ok: true as const, nextStep: 4 };
}

/** Persists wizard form fields and promotes ephemeral session to a visible draft. */
export async function saveBrandCampaignDraftAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const ctx = await resolveBrandCampaignContext(projectId, lang);
  if (!ctx.ok) return ctx;

  const product_url = String(formData.get("product_url") ?? "").trim();
  const product_name = String(formData.get("product_name") ?? "").trim();
  const input = readQuestionnaire(formData, lang);
  const refinedGoal = String(formData.get("campaign_goal") ?? "").trim();
  const refinedAudience = String(formData.get("target_audience") ?? "").trim();
  const refinedTitle = String(formData.get("title") ?? "").trim();
  const refinedNotes = String(formData.get("notes") ?? "").trim();

  const brief =
    refinedGoal
      ? {
          campaign_goal: refinedGoal,
          product_name: input.productName || deriveProductName(product_url, "My Product"),
          target_audience: refinedAudience || input.audienceDescription || "25-40",
          title: refinedTitle || `${input.productName || deriveProductName(product_url, "My Product")} Campaign`,
          notes: refinedNotes || [input.productDescription, input.extraNotes, input.rawSummary].filter(Boolean).join("\n\n"),
          source: "openai" as const
        }
      : templateReorganizeBrandBrief(input, lang);

  const resolvedName = product_name || brief.product_name || deriveProductName(product_url, "My Product");
  const category = "CPG";
  const target_platform = input.platforms.length ? input.platforms.join(", ") : "TikTok, Meta";
  const budget_range = String(formData.get("budget_range") ?? "").trim() || defaultBrandBudget();
  const delivery_timeline = String(formData.get("delivery_timeline") ?? "").trim() || defaultBrandTimeline();
  const aspect_ratio_raw = String(formData.get("aspect_ratio") ?? "").trim();
  const aspect_ratio = isValidBrandAspectRatio(aspect_ratio_raw)
    ? aspect_ratio_raw
    : defaultBrandAspectRatio();

  const deadline = deadlineFromTimeline(delivery_timeline);
  const existingProject = await getProject(projectId);
  const priorSettings = existingProject?.settings_json ?? {};
  const { confirmed_brief: _removed, ...priorWithoutConfirm } = priorSettings as Record<string, unknown>;
  const refs = await listReferencesForProject(projectId);

  await updateProject(projectId, {
    product_name: resolvedName,
    product_url,
    category,
    commercial_objective: input.objective,
    commercial_objective_note: input.extraNotes,
    target_audience: brief.target_audience,
    target_platform,
    title: brief.title,
    campaign_goal: brief.campaign_goal,
    notes: brief.notes,
    budget_range,
    deadline,
    video_format: aspect_ratio,
    aspect_ratios: [aspect_ratio],
    reference_links: refs.map((item) => item.source_url).join("\n"),
    settings_json: {
      ...priorWithoutConfirm,
      [WIZARD_EPHEMERAL_KEY]: false,
      [WIZARD_SAVED_AT_KEY]: new Date().toISOString(),
      brand_questionnaire: {
        ...input,
        budgetRange: budget_range,
        deliveryTimeline: delivery_timeline,
        aspectRatio: aspect_ratio,
        refined_brief: brief,
        refined_at: new Date().toISOString()
      }
    }
  });

  revalidateBrandCampaign(projectId);
  return { ok: true as const };
}

/** Brand 3-step wizard — saves brief, product, and references in one submit. */
export async function saveBrandCampaignSetupAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const ctx = await resolveBrandCampaignContext(projectId, lang);
  if (!ctx.ok) return ctx;
  const { client } = ctx;

  const product_url = String(formData.get("product_url") ?? "").trim();
  const product_name = String(formData.get("product_name") ?? "").trim();
  const hasProduct = await hasProductVisual(projectId);
  const input = readQuestionnaire(formData, lang);

  if (!product_url && !hasProduct) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请上传产品图，或填写产品链接" : "Upload a product photo or add a product link"
    };
  }

  const hasBrief =
    input.rawSummary ||
    input.productDescription ||
    String(formData.get("campaign_goal") ?? "").trim();

  if (!hasBrief) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请描述你想做的广告，或使用 AI 整理" : "Describe your campaign or use AI polish"
    };
  }

  const refinedGoal = String(formData.get("campaign_goal") ?? "").trim();
  const refinedAudience = String(formData.get("target_audience") ?? "").trim();
  const refinedTitle = String(formData.get("title") ?? "").trim();
  const refinedNotes = String(formData.get("notes") ?? "").trim();

  const brief =
    refinedGoal
      ? {
          campaign_goal: refinedGoal,
          product_name: input.productName || deriveProductName(product_url, "My Product"),
          target_audience: refinedAudience || input.audienceDescription || "25-40",
          title: refinedTitle || `${input.productName || deriveProductName(product_url, "My Product")} Campaign`,
          notes: refinedNotes || [input.productDescription, input.extraNotes, input.rawSummary].filter(Boolean).join("\n\n"),
          source: "openai" as const
        }
      : templateReorganizeBrandBrief(input, lang);

  const resolvedName = product_name || brief.product_name || deriveProductName(product_url, "My Product");
  const category = "CPG";
  const target_platform = input.platforms.length ? input.platforms.join(", ") : "TikTok, Meta";
  const budget_range = String(formData.get("budget_range") ?? "").trim() || defaultBrandBudget();
  const delivery_timeline = String(formData.get("delivery_timeline") ?? "").trim() || defaultBrandTimeline();
  const aspect_ratio_raw = String(formData.get("aspect_ratio") ?? "").trim();
  if (!isValidBrandAspectRatio(aspect_ratio_raw)) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请选择视频比例" : "Select a video aspect ratio"
    };
  }

  const deadline = deadlineFromTimeline(delivery_timeline);
  const existingProject = await getProject(projectId);
  const priorSettings = existingProject?.settings_json ?? {};
  const { confirmed_brief: _removed, ...priorWithoutConfirm } = priorSettings as Record<string, unknown>;
  const refs = await listReferencesForProject(projectId);

  await updateProject(projectId, {
    product_name: resolvedName,
    product_url,
    category,
    commercial_objective: input.objective,
    commercial_objective_note: input.extraNotes,
    target_audience: brief.target_audience,
    target_platform,
    title: brief.title,
    campaign_goal: brief.campaign_goal,
    notes: brief.notes,
    budget_range,
    deadline,
    video_format: aspect_ratio_raw,
    aspect_ratios: [aspect_ratio_raw],
    reference_links: refs.map((item) => item.source_url).join("\n"),
    settings_json: {
      ...priorWithoutConfirm,
      brand_questionnaire: {
        ...input,
        budgetRange: budget_range,
        deliveryTimeline: delivery_timeline,
        aspectRatio: aspect_ratio_raw,
        refined_brief: brief,
        refined_at: new Date().toISOString()
      }
    }
  });

  await completeWizardStep(projectId, 1);
  await completeWizardStep(projectId, 2);
  await completeWizardStep(projectId, 3);
  await emitWizardProgress(projectId, {
    step: 3,
    phase: "idle",
    progressMessage: lang === "zh" ? "需求已保存" : "Campaign details saved"
  });

  const project = await getProject(projectId);
  if (project) {
    const profile = await upsertBrandProfileFromBrief(client.client_email, {
      company_name: project.company_name || client.company_name,
      product_name: resolvedName,
      product_url,
      industry: category,
      campaign_goal: brief.campaign_goal
    });
    revalidatePath(`/brands/${profile.id}`);
  }

  revalidateBrandCampaign(projectId);

  try {
    await runBrandWizardDemoPrepareInstant(projectId, lang);
  } catch (error) {
    const message = error instanceof Error ? error.message : lang === "zh" ? "方案生成失败" : "Plan generation failed";
    return { ok: false as const, error: message };
  }

  revalidateBrandCampaign(projectId);
  return { ok: true as const, nextStep: 2, prepared: true as const };
}

/** @deprecated Use saveBrandCampaignSetupAction */
export async function saveBrandCampaignStep1Action(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const ctx = await resolveBrandCampaignContext(projectId, lang);
  if (!ctx.ok) return ctx;
  const { client } = ctx;

  const product_url = String(formData.get("product_url") ?? "").trim();
  const hasProduct = await hasProductVisual(projectId);
  const input = readQuestionnaire(formData, lang);

  if (!product_url && !hasProduct) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请上传产品图，或填写产品链接（选填）" : "Upload a product photo, or add a product link (optional)"
    };
  }

  const hasBrief =
    input.rawSummary ||
    input.productDescription ||
    String(formData.get("campaign_goal") ?? "").trim();

  if (!hasBrief) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请描述你想做的广告，或使用 AI 整理" : "Describe your campaign or use AI polish"
    };
  }

  const refinedGoal = String(formData.get("campaign_goal") ?? "").trim();
  const refinedAudience = String(formData.get("target_audience") ?? "").trim();
  const refinedTitle = String(formData.get("title") ?? "").trim();
  const refinedNotes = String(formData.get("notes") ?? "").trim();

  const brief =
    refinedGoal
      ? {
          campaign_goal: refinedGoal,
          product_name: input.productName || deriveProductName(product_url, "My Product"),
          target_audience: refinedAudience || input.audienceDescription || "25-40",
          title: refinedTitle || `${input.productName || deriveProductName(product_url, "My Product")} Campaign`,
          notes: refinedNotes || [input.productDescription, input.extraNotes, input.rawSummary].filter(Boolean).join("\n\n"),
          source: "openai" as const
        }
      : await reorganizeBrandBriefWithAI(input, lang);

  const product_name = brief.product_name || deriveProductName(product_url, "My Product");
  const category = "CPG";
  const target_platform = input.platforms.length ? input.platforms.join(", ") : "TikTok, Meta";
  const budget_range = String(formData.get("budget_range") ?? "").trim() || defaultBrandBudget();
  const delivery_timeline = String(formData.get("delivery_timeline") ?? "").trim() || defaultBrandTimeline();
  const aspect_ratio_raw = String(formData.get("aspect_ratio") ?? "").trim();
  if (!isValidBrandAspectRatio(aspect_ratio_raw)) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请选择视频比例" : "Select a video aspect ratio"
    };
  }
  const aspect_ratio = aspect_ratio_raw;

  const deadline = deadlineFromTimeline(delivery_timeline);

  const existingProject = await getProject(projectId);
  const priorSettings = existingProject?.settings_json ?? {};
  const { confirmed_brief: _removed, ...priorWithoutConfirm } = priorSettings as Record<string, unknown>;

  await updateProject(projectId, {
    product_name,
    product_url,
    category,
    commercial_objective: input.objective,
    commercial_objective_note: input.extraNotes,
    target_audience: brief.target_audience,
    target_platform,
    title: brief.title,
    campaign_goal: brief.campaign_goal,
    notes: brief.notes,
    budget_range,
    deadline,
    video_format: aspect_ratio,
    aspect_ratios: [aspect_ratio],
    settings_json: {
      ...priorWithoutConfirm,
      brand_questionnaire: {
        ...input,
        budgetRange: budget_range,
        deliveryTimeline: delivery_timeline,
        aspectRatio: aspect_ratio,
        refined_brief: brief,
        refined_at: new Date().toISOString()
      }
    }
  });

  const refs = await listReferencesForProject(projectId);

  await updateProject(projectId, {
    reference_links: refs.map((item) => item.source_url).join("\n")
  });
  await completeWizardStep(projectId, 1);
  await completeWizardStep(projectId, 2);

  const project = await getProject(projectId);
  if (project) {
    const profile = await upsertBrandProfileFromBrief(client.client_email, {
      company_name: project.company_name || client.company_name,
      product_name,
      product_url,
      industry: category,
      campaign_goal: brief.campaign_goal
    });
    revalidatePath(`/brands/${profile.id}`);
  }

  revalidateBrandCampaign(projectId);
  return { ok: true as const, nextStep: 2 };
}

export async function saveBrandCampaignStep2Action(formData: FormData) {
  return saveBrandCampaignReferencesAction(formData);
}

/** Runs hidden AI steps (brief, specs, creative pack) — Brand never sees prompts. */
export async function prepareBrandCampaignAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const ctx = await resolveBrandCampaignContext(projectId, lang);
  if (!ctx.ok) return ctx;

  try {
    const result = await runBrandWizardDemoPrepareInstant(projectId, lang);
    revalidateBrandCampaign(projectId);
    return { ok: true as const, nextStep: 2, budget: result.budget, delivery: result.delivery, prepared: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : lang === "zh" ? "分析失败" : "Analysis failed";
    await emitWizardProgress(projectId, { phase: "idle", progressMessage: message });
    return { ok: false as const, error: message };
  }
}

/** @deprecated merged into saveBrandCampaignReferencesAction */
export async function confirmBrandCampaignAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const ctx = await resolveBrandCampaignContext(projectId, lang);
  if (!ctx.ok) return ctx;
  const { project } = ctx;
  const confirmed = formData.get("confirmed") === "1";

  if (!confirmed) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请勾选确认后再继续" : "Check the certification box to continue"
    };
  }

  const snapshot = buildConfirmedBriefSnapshot(project, lang);

  await updateProject(projectId, {
    settings_json: {
      ...project.settings_json,
      confirmed_brief: snapshot
    }
  });

  const linkedOrders = await listOrdersForProject(projectId);
  await Promise.all(
    linkedOrders.map((order) => updateOrderRequirements(order.id, snapshot.full_text))
  );

  await completeWizardStep(projectId, 6);
  await emitWizardProgress(projectId, { step: 6, phase: "idle" });

  revalidateBrandCampaign(projectId);
  return { ok: true as const };
}

export async function publishBrandCampaignAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const ctx = await resolveBrandCampaignContext(projectId, lang);
  if (!ctx.ok) return ctx;
  const { client, project } = ctx;

  const confirmedBrief = project.settings_json?.confirmed_brief as { full_text?: string } | undefined;
  if (!confirmedBrief?.full_text?.trim()) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请先确认需求表单" : "Confirm your brief before publishing"
    };
  }

  const priorSettings = project.settings_json ?? {};
  await updateProject(projectId, {
    settings_json: {
      ...priorSettings,
      [WIZARD_EPHEMERAL_KEY]: false
    }
  });

  try {
    await runBrandWizardDemoPublish(projectId, lang, client.client_email, async () => {
      await completeWizardStep(projectId, 7);

      const result = await transitionProject(projectId, "project.publish", {
        actor_role: "brand",
        actor_id: client.client_email
      });

      if (!result.ok) {
        throw new Error(result.message);
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : lang === "zh" ? "发布失败" : "Publish failed";
    await emitWizardProgress(projectId, { phase: "idle", progressMessage: message });
    return { ok: false as const, error: message };
  }

  revalidateBrandCampaign(projectId);
  const published = (await getProject(projectId)) ?? project;

  await preparePublishedCampaignCheckout({
    project: published,
    client: {
      client_name: client.client_name,
      client_email: client.client_email,
      company_name: client.company_name
    },
    locale: lang
  });

  return {
    ok: true as const,
    checkoutPath: withLocale(brandPortalRoutes.projectCheckout(projectId), lang)
  };
}

/** Form-friendly wrapper — `<form action>` handlers must return void. */
export async function publishBrandCampaignFormAction(formData: FormData): Promise<void> {
  const result = await publishBrandCampaignAction(formData);
  if (result && "ok" in result && !result.ok) {
    const lang = normalizeLang(formData.get("lang"));
    const projectId = String(formData.get("project_id") ?? "");
    redirect(
      withLocale(
        `/brand/projects/new?project=${encodeURIComponent(projectId)}&step=3&error=${encodeURIComponent(result.error ?? "publish")}`,
        lang
      )
    );
  }
  if (result.ok) {
    redirect(result.checkoutPath);
  }
}
