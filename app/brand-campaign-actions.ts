"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ensureCreativeBrief,
  ensureCreativePack,
  hasProductVisual,
  listReferencesForProject
} from "@/lib/campaign-store";
import { getCurrentClientEmail } from "@/lib/client-session";
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
  type BrandQuestionnaireInput
} from "@/lib/studioos/brand-brief-ai";
import {
  deadlineFromTimeline,
  defaultBrandBudget,
  defaultBrandTimeline,
  deliveryTimelineLabel,
  isValidBrandAspectRatio
} from "@/lib/studioos/brand-campaign-options";
import { upsertBrandProfileFromBrief } from "@/lib/brand-profile-service";
import { listOrdersForProject, updateOrderRequirements } from "@/lib/order-service";
import { buildConfirmedBriefSnapshot } from "@/lib/studioos/confirmed-brief";
import { campaignBridgeService } from "@/features/campaign/campaign-bridge.service";
import { creativeDirectionService } from "@/features/ai/creative-direction.service";
import { getSessionUser } from "@/features/auth/session.service";
import {
  emitWizardProgress,
  runAnalyzingProgress,
  runMatchingProgress
} from "@/lib/campaign/wizard-progress.service";

async function requireBrandClient() {
  const email = await getCurrentClientEmail();
  if (!email) throw new Error("Unauthorized");
  const demoUser = DEMO_USERS.find((user) => user.email === email.toLowerCase());
  return {
    client_email: email.toLowerCase(),
    client_name: demoUser?.label ?? email.split("@")[0],
    company_name: demoUser?.label ?? email.split("@")[0]
  };
}

async function requireProject(projectId: string, clientEmail: string) {
  const project = await getProject(projectId);
  if (!project || project.client_email.toLowerCase() !== clientEmail.toLowerCase()) {
    throw new Error("Project not found");
  }
  return project;
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
  revalidatePath(`/brand/projects/${projectId}`);
  revalidatePath(`/brand/projects/${projectId}/studios`);
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
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  await requireProject(projectId, client.client_email);

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
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  await requireProject(projectId, client.client_email);

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
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  await requireProject(projectId, client.client_email);

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
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  await requireProject(projectId, client.client_email);

  const refs = await listReferencesForProject(projectId);
  await updateProject(projectId, {
    reference_links: refs.map((item) => item.source_url).join("\n")
  });
  await completeWizardStep(projectId, 3);
  await emitWizardProgress(projectId, { step: 3, phase: "idle" });

  revalidateBrandCampaign(projectId);
  return { ok: true as const, nextStep: 4 };
}

/** @deprecated Use saveBrandCampaignBriefAction + saveBrandCampaignProductAction */
export async function saveBrandCampaignStep1Action(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  await requireProject(projectId, client.client_email);

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
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  const project = await requireProject(projectId, client.client_email);

  try {
    await runAnalyzingProgress(projectId, lang, async () => {
      const brief = await ensureCreativeBrief(project);
      if (!brief.executive_summary) {
        throw new Error(lang === "zh" ? "分析失败，请重试" : "Analysis failed — try again");
      }
      await completeWizardStep(projectId, 4);

      await updateProject(projectId, {
        style_presets: ["Apple Minimal"],
        video_lengths: ["30s"],
        aspect_ratios: ["9:16"],
        output_quantity: 1,
        ...(project.budget_range?.trim() ? {} : { budget_range: defaultBrandBudget() }),
        ...(project.deadline?.trim() ? {} : { deadline: defaultDeadlineIso() }),
        video_count: 1,
        video_format: "9:16",
        target_platform: project.target_platform || "TikTok, Meta",
        brand_style: "Apple Minimal"
      });

      await ensureCreativePack(project);
      await completeWizardStep(projectId, 5);

      const sessionUser = await getSessionUser();
      const prismaCampaignId = await campaignBridgeService.ensurePrismaCampaignOnDraft(projectId);
      if (prismaCampaignId && sessionUser && !sessionUser.id.startsWith("demo_")) {
        try {
          const directions = await creativeDirectionService.generate(prismaCampaignId, {
            id: sessionUser.id,
            role: sessionUser.role
          });
          if (directions[0]) {
            await creativeDirectionService.approve(
              prismaCampaignId,
              { id: sessionUser.id, role: sessionUser.role },
              directions[0].id
            );
          }
        } catch (error) {
          console.error("[prepareBrandCampaignAction] prisma creative sync failed", error);
        }
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : lang === "zh" ? "分析失败" : "Analysis failed";
    await emitWizardProgress(projectId, { phase: "idle", progressMessage: message });
    return { ok: false as const, error: message };
  }

  const updated = await getProject(projectId);
  const timelineId = String(
    (updated?.settings_json?.brand_questionnaire as { deliveryTimeline?: string } | undefined)?.deliveryTimeline ??
      defaultBrandTimeline()
  );
  revalidateBrandCampaign(projectId);
  return {
    ok: true as const,
    nextStep: 5,
    budget: updated?.budget_range ?? defaultBrandBudget(),
    delivery: deliveryTimelineLabel(timelineId, lang)
  };
}

/** @deprecated merged into saveBrandCampaignReferencesAction */
export async function confirmBrandCampaignAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  const confirmed = formData.get("confirmed") === "1";

  if (!confirmed) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请勾选确认后再继续" : "Check the certification box to continue"
    };
  }

  const project = await requireProject(projectId, client.client_email);
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
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  const project = await requireProject(projectId, client.client_email);

  const confirmedBrief = project.settings_json?.confirmed_brief as { full_text?: string } | undefined;
  if (!confirmedBrief?.full_text?.trim()) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请先确认需求表单" : "Confirm your brief before publishing"
    };
  }

  try {
    await runMatchingProgress(projectId, lang, async () => {
      await completeWizardStep(projectId, 7);

      const result = await transitionProject(projectId, "project.publish", {
        actor_role: "brand",
        actor_id: client.client_email
      });

      if (!result.ok) {
        throw new Error(result.message);
      }

      await campaignBridgeService.syncPublishToPrisma(projectId);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : lang === "zh" ? "发布失败" : "Publish failed";
    await emitWizardProgress(projectId, { phase: "idle", progressMessage: message });
    return { ok: false as const, error: message };
  }

  revalidateBrandCampaign(projectId);
  redirect(withLocale(`/brand/projects/${projectId}/studios`, lang));
}
