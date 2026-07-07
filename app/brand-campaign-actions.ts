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
  completeWizardSteps,
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
import { getOrderForProject, listOrdersForProject, updateOrderRequirements } from "@/lib/order-service";
import { isOrderPaymentEscrowed } from "@/lib/order-types";
import { buildConfirmedBriefSnapshot } from "@/lib/studioos/confirmed-brief";
import { creativeDirectionService } from "@/features/ai/creative-direction.service";
import { aiJobRepository } from "@/features/ai/ai-job.repository";
import { aiLearningEventRepository } from "@/features/ai/ai-learning-event.repository";
import type { CreativeDirection } from "@/features/ai/creative-direction.types";
import { brandCampaignRepository } from "@/features/campaign/brand-campaign/brand-campaign.repository";
import { mapCampaignToStoredProject } from "@/features/campaign/brand-campaign/brand-campaign.mapper";
import type { BrandProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.types";
import { campaignService } from "@/features/campaign/campaign.service";
import { CampaignEvent, CampaignState } from "@/features/campaign/campaign.state-machine";
import { campaignBridgeService } from "@/features/campaign/campaign-bridge.service";
import { emitWizardProgress } from "@/lib/campaign/wizard-progress.service";
import { runBrandWizardDemoPrepareInstant, runBrandWizardDemoPublish } from "@/lib/campaign/brand-wizard-demo-prepare";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { preparePublishedCampaignCheckout } from "@/lib/studioos/brand-checkout-service";
import { parseBudgetMidpoint } from "@/lib/studioos/brand-checkout-utils";
import {
  WIZARD_EPHEMERAL_KEY,
  WIZARD_SAVED_AT_KEY
} from "@/lib/studioos/brand-wizard-session";
import {
  parseWizardBriefSnapshot,
} from "@/lib/studioos/brand-wizard-brief-snapshot";

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
  const normalizedEmail = clientEmail.toLowerCase();
  if (project?.client_email.toLowerCase() === normalizedEmail) {
    return { ok: true as const, project };
  }

  try {
    const campaign = await brandCampaignRepository.findByLegacyProjectId(projectId);
    const campaignEmail = campaign?.brand?.email?.toLowerCase();
    if (campaign && campaignEmail === normalizedEmail) {
      return { ok: true as const, project: mapCampaignToStoredProject(campaign) };
    }
  } catch {
    // Fall through to the standard access-denied response below.
  }

  if (!project || project.client_email.toLowerCase() !== normalizedEmail) {
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

async function recordAiCreativeGenerationClick(input: {
  campaignId: string;
  projectId: string;
  userId: string;
  language: Locale;
  source: string;
}) {
  await aiLearningEventRepository.append({
    eventType: "CreativeDirectionGenerationRequested",
    entityType: "Campaign",
    entityId: input.campaignId,
    payload: {
      campaignId: input.campaignId,
      legacy_project_id: input.projectId,
      requested_by: input.userId,
      language: input.language,
      source: input.source
    },
    learningType: "creative_generation_click",
    after: {
      manual_trigger: true,
      source: input.source
    },
    confidence: 0.9
  });
}

async function assertAiTokensAllowedAfterPayment(projectId: string, lang: Locale) {
  const order = await getOrderForProject(projectId);
  if (!order || !isOrderPaymentEscrowed(order.payment_status)) {
    return {
      ok: false as const,
      error:
        lang === "zh"
          ? "付款成功后才能使用 AI 生成。请先提交需求并完成托管付款。"
          : "AI generation is available after escrow payment. Submit the brief and complete payment first."
    };
  }
  return { ok: true as const };
}

async function requireBrandCampaignUser(email: string) {
  const user = await brandCampaignRepository.findBrandUserByEmail(email);
  if (!user) {
    throw new Error("Brand user not found");
  }
  return { id: user.id, role: user.role };
}

async function syncBrandCampaignBriefToPrisma(input: {
  projectId: string;
  title: string;
  description: string;
  productName: string;
  productUrl: string;
  category: string;
  objective: CommercialObjective;
  objectiveNotes: string;
  audience: string;
  goal: string;
  notes: string;
  questionnaire: BrandQuestionnaireInput;
  budgetRange: string;
  deadline: string;
  platform: string;
  aspectRatio: string;
}) {
  const campaign = await brandCampaignRepository.findByLegacyProjectId(input.projectId).catch(() => null);
  if (!campaign) return;

  const existingBrief = (campaign.productionBrief ?? {}) as BrandProductionBrief;
  await brandCampaignRepository.updateCampaign(campaign.id, {
    title: input.title,
    description: input.description,
    budget: parseBudgetMidpoint(input.budgetRange),
    deadline: new Date(input.deadline),
    platform: input.platform,
    aspectRatio: input.aspectRatio,
    productionBrief: {
      ...existingBrief,
      legacy_project_id: existingBrief.legacy_project_id ?? input.projectId,
      product: {
        ...(existingBrief.product ?? {}),
        name: input.productName,
        url: input.productUrl,
        category: input.category
      },
      objective: {
        type: input.objective,
        notes: input.objectiveNotes
      },
      audience: input.audience,
      goal: input.goal,
      notes: input.notes,
      questionnaire: {
        ...input.questionnaire,
        budgetRange: input.budgetRange,
        aspectRatio: input.aspectRatio
      },
      budget: {
        ...(existingBrief.budget ?? {}),
        range: input.budgetRange
      }
    }
  });
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
  const aiGate = await assertAiTokensAllowedAfterPayment(projectId, lang);
  if (!aiGate.ok) return aiGate;

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
      : templateReorganizeBrandBrief(input, lang);

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
  const { confirmed_brief: confirmedBrief, ...priorWithoutConfirm } = priorSettings as Record<string, unknown>;
  void confirmedBrief;

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
  await syncBrandCampaignBriefToPrisma({
    projectId,
    title: brief.title,
    description: brief.notes,
    productName: brief.product_name,
    productUrl: product_url,
    category,
    objective: input.objective,
    objectiveNotes: input.extraNotes ?? "",
    audience: brief.target_audience,
    goal: brief.campaign_goal,
    notes: brief.notes,
    questionnaire: input,
    budgetRange: budget_range,
    deadline,
    platform: target_platform,
    aspectRatio: aspect_ratio_raw
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
  const { confirmed_brief: confirmedBrief, ...priorWithoutConfirm } = priorSettings as Record<string, unknown>;
  void confirmedBrief;
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

  try {
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
      String(formData.get("campaign_goal") ?? "").trim() ||
      product_name;

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
    await syncBrandCampaignBriefToPrisma({
      projectId,
      title: brief.title,
      description: brief.notes,
      productName: resolvedName,
      productUrl: product_url,
      category,
      objective: input.objective,
      objectiveNotes: input.extraNotes ?? "",
      audience: brief.target_audience,
      goal: brief.campaign_goal,
      notes: brief.notes,
      questionnaire: input,
      budgetRange: budget_range,
      deadline,
      platform: target_platform,
      aspectRatio: aspect_ratio
    });

    await completeWizardStep(projectId, 1);
    await emitWizardProgress(projectId, {
      step: 1,
      phase: "idle",
      progressMessage: lang === "zh" ? "需求已保存" : "Campaign details saved"
    });

    void upsertBrandProfileFromBrief(client.client_email, {
      company_name: existingProject?.company_name || client.company_name,
      product_name: resolvedName,
      product_url,
      industry: category,
      campaign_goal: brief.campaign_goal
    }).catch(() => undefined);

    revalidateBrandCampaign(projectId);

    return { ok: true as const, nextStep: 2, prepared: false as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return {
      ok: false as const,
      error:
        lang === "zh"
          ? message.includes("Campaign not found") || message.includes("not found")
            ? "项目不存在或无权访问"
            : "保存失败，请重试"
          : message.includes("Campaign not found")
            ? "Project not found or access denied"
            : "Save failed — try again"
    };
  }
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
      : templateReorganizeBrandBrief(input, lang);

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
  await syncBrandCampaignBriefToPrisma({
    projectId,
    title: brief.title,
    description: brief.notes,
    productName: product_name,
    productUrl: product_url,
    category,
    objective: input.objective,
    objectiveNotes: input.extraNotes ?? "",
    audience: brief.target_audience,
    goal: brief.campaign_goal,
    notes: brief.notes,
    questionnaire: input,
    budgetRange: budget_range,
    deadline,
    platform: target_platform,
    aspectRatio: aspect_ratio
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
  const aiGate = await assertAiTokensAllowedAfterPayment(projectId, lang);
  if (!aiGate.ok) return aiGate;

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

async function finalizeBrandCreativeDirections(
  projectId: string,
  lang: Locale,
  directions: CreativeDirection[],
  options?: { wizardFastPath?: boolean }
) {
  await completeWizardStep(projectId, 2);
  if (!options?.wizardFastPath) {
    await emitWizardProgress(projectId, {
      step: 2,
      phase: "idle",
      progressMessage: lang === "zh" ? "AI 已生成 3 个创意方向" : "AI generated 3 creative directions"
    });
    revalidateBrandCampaign(projectId);
  }
  return directions;
}

/** Returns cached directions or starts async AI generation (non-blocking). */
export async function startBrandCreativeDirectionsAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const wizardFastPath = formData.get("wizard_fast_path") === "1";
  const briefSnapshot = parseWizardBriefSnapshot(String(formData.get("brief_snapshot") ?? ""));
  const ctx = await resolveBrandCampaignContext(projectId, lang);
  if (!ctx.ok) return ctx;
  const aiGate = await assertAiTokensAllowedAfterPayment(projectId, lang);
  if (!aiGate.ok) return aiGate;

  const campaignId = await campaignBridgeService.resolvePrismaCampaignId(projectId);
  if (!campaignId) {
    return {
      ok: false as const,
      error: lang === "zh" ? "Campaign 尚未连接到 AI 创意流程" : "Campaign is not connected to the AI creative flow"
    };
  }

  try {
    const user = await requireBrandCampaignUser(ctx.client.client_email);
    const existing = await creativeDirectionService.listDirections(campaignId, user);
    if (existing.length >= 3) {
      const directions = await finalizeBrandCreativeDirections(projectId, lang, existing, { wizardFastPath });
      return { ok: true as const, status: "ready" as const, directions };
    }

    const activeJob = await aiJobRepository.findActiveForCampaign(campaignId, "CREATIVE_DIRECTION");
    if (activeJob) {
      if (briefSnapshot && activeJob.status === "QUEUED") {
        const input = (activeJob.inputJson ?? {}) as Record<string, unknown>;
        await aiJobRepository.updateInputJson(activeJob.id, {
          ...input,
          briefSnapshot
        });
      }
      return { ok: true as const, status: "pending" as const, jobId: activeJob.id };
    }

    await recordAiCreativeGenerationClick({
      campaignId,
      projectId,
      userId: user.id,
      language: lang,
      source: wizardFastPath ? "wizard_fast_path" : "brand_manual_click"
    });
    const started = await creativeDirectionService.generateAsync(campaignId, user, {
      wizardFastPath,
      briefSnapshot: briefSnapshot ?? undefined,
      language: lang
    });
    return { ok: true as const, status: "pending" as const, jobId: started.jobId };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : lang === "zh" ? "创意方向生成失败" : "Creative directions failed"
    };
  }
}

/** Poll async AI job — returns directions when 3 schemes are ready. */
export async function pollBrandCreativeDirectionsAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const jobId = String(formData.get("job_id") ?? "").trim();
  const wizardFastPath = formData.get("wizard_fast_path") === "1";
  const ctx = await resolveBrandCampaignContext(projectId, lang);
  if (!ctx.ok) return ctx;
  const aiGate = await assertAiTokensAllowedAfterPayment(projectId, lang);
  if (!aiGate.ok) return aiGate;

  const campaignId = await campaignBridgeService.resolvePrismaCampaignId(projectId);
  if (!campaignId) {
    return {
      ok: false as const,
      error: lang === "zh" ? "Campaign 尚未连接到 AI 创意流程" : "Campaign is not connected to the AI creative flow"
    };
  }

  try {
    const user = await requireBrandCampaignUser(ctx.client.client_email);
    const directions = await creativeDirectionService.listDirections(campaignId, user);
    if (directions.length >= 3) {
      const ready = await finalizeBrandCreativeDirections(projectId, lang, directions, { wizardFastPath });
      return { ok: true as const, status: "ready" as const, directions: ready };
    }

    if (jobId) {
      const job = await aiJobRepository.findById(jobId);
      if (job?.status === "FAILED" || job?.status === "DEAD") {
        return {
          ok: false as const,
          error: lang === "zh" ? "AI 创意生成失败，请返回上一步重试" : "AI creative generation failed — go back and try again"
        };
      }
    }

    return { ok: true as const, status: "pending" as const, directions: [] as CreativeDirection[] };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : lang === "zh" ? "创意方向加载失败" : "Creative directions failed to load"
    };
  }
}

/** @deprecated Prefer start + poll for progressive Step 2 loading. */
export async function generateBrandCreativeDirectionsAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const ctx = await resolveBrandCampaignContext(projectId, lang);
  if (!ctx.ok) return ctx;
  const aiGate = await assertAiTokensAllowedAfterPayment(projectId, lang);
  if (!aiGate.ok) return aiGate;

  const campaignId = await campaignBridgeService.resolvePrismaCampaignId(projectId);
  if (!campaignId) {
    return {
      ok: false as const,
      error: lang === "zh" ? "Campaign 尚未连接到 AI 创意流程" : "Campaign is not connected to the AI creative flow"
    };
  }

  try {
    const user = await requireBrandCampaignUser(ctx.client.client_email);
    await recordAiCreativeGenerationClick({
      campaignId,
      projectId,
      userId: user.id,
      language: lang,
      source: "brand_manual_click_sync"
    });
    const directions = await creativeDirectionService.generate(campaignId, user);
    await finalizeBrandCreativeDirections(projectId, lang, directions);
    return { ok: true as const, directions };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : lang === "zh" ? "创意方向生成失败" : "Creative directions failed"
    };
  }
}

export async function approveBrandCreativeDirectionAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const directionId = String(formData.get("direction_id") ?? "");
  const ctx = await resolveBrandCampaignContext(projectId, lang);
  if (!ctx.ok) return ctx;

  if (!directionId) {
    return { ok: false as const, error: lang === "zh" ? "请选择一个创意方向" : "Choose a creative direction" };
  }

  const campaignId = await campaignBridgeService.resolvePrismaCampaignId(projectId);
  if (!campaignId) {
    return {
      ok: false as const,
      error: lang === "zh" ? "Campaign 尚未连接到 AI 创意流程" : "Campaign is not connected to the AI creative flow"
    };
  }

  try {
    const user = await requireBrandCampaignUser(ctx.client.client_email);
    const selected = await creativeDirectionService.approve(campaignId, user, directionId, { language: lang });
    const campaign = await brandCampaignRepository.findByLegacyProjectId(projectId);
    const brief = (campaign?.productionBrief ?? {}) as BrandProductionBrief;
    const frozen = brief.frozen_production_brief;
    if (!frozen?.full_text?.trim()) {
      throw new Error("Frozen Production Brief was not generated");
    }

    await updateProject(projectId, {
      settings_json: {
        ...ctx.project.settings_json,
        frozen_production_brief: frozen,
        selected_direction_id: directionId,
        confirmed_brief: {
          confirmed_at: frozen.frozen_at,
          fields: [
            {
              section: lang === "zh" ? "创意" : "Creative",
              label: lang === "zh" ? "开场钩子" : "Hook",
              value: frozen.hook
            },
            {
              section: lang === "zh" ? "创意" : "Creative",
              label: lang === "zh" ? "故事结构" : "Story",
              value: frozen.story
            },
            {
              section: lang === "zh" ? "创意" : "Creative",
              label: lang === "zh" ? "语气" : "Tone",
              value: frozen.tone
            },
            {
              section: lang === "zh" ? "创意" : "Creative",
              label: lang === "zh" ? "行动引导" : "CTA",
              value: frozen.cta
            }
          ],
          full_text: frozen.full_text
        }
      }
    });

    const linkedOrders = await listOrdersForProject(projectId);
    await Promise.all(linkedOrders.map((order) => updateOrderRequirements(order.id, frozen.full_text)));

    await completeWizardSteps(projectId, [3, 4, 5, 6]);
    await emitWizardProgress(projectId, {
      step: 6,
      phase: "idle",
      progressMessage: lang === "zh" ? "Production Brief 已冻结" : "Production Brief frozen"
    });

    revalidateBrandCampaign(projectId);
    return { ok: true as const, selected, frozen };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : lang === "zh" ? "创意确认失败" : "Creative approval failed"
    };
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

  const confirmedBrief = buildConfirmedBriefSnapshot(project, lang);
  const priorSettings = project.settings_json ?? {};
  await updateProject(projectId, {
    settings_json: {
      ...priorSettings,
      confirmed_brief: priorSettings.confirmed_brief ?? confirmedBrief,
      [WIZARD_EPHEMERAL_KEY]: false
    }
  });

  try {
    await runBrandWizardDemoPublish(projectId, lang, client.client_email, async () => {
      await completeWizardSteps(projectId, [1, 2, 3, 4, 5, 6]);

      const result = await transitionProject(projectId, "project.publish", {
        actor_role: "brand",
        actor_id: client.client_email
      });

      if (!result.ok) {
        throw new Error(result.message);
      }

      await completeWizardStep(projectId, 7);
    });

    const campaign = await brandCampaignRepository.findByLegacyProjectId(projectId).catch(() => null);
    const publishableStatuses = new Set<string>([
      CampaignState.DRAFT,
      CampaignState.CREATIVE_READY,
      CampaignState.CREATIVE_APPROVED
    ]);
    if (campaign && publishableStatuses.has(campaign.status)) {
      const user = await requireBrandCampaignUser(client.client_email);
      await campaignService.transition(campaign.id, CampaignEvent.PUBLISH, {
        id: user.id,
        role: user.role
      });
    }
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
