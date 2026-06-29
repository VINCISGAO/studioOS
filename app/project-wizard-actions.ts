"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addProjectAsset,
  addProjectReference,
  ensureCreativeBrief,
  ensureCreativePack,
  getCreativeBrief,
  getPackItem,
  hasProductVisual,
  listAssetsForProject,
  listPackItems,
  listReferencesForProject,
  removeProjectAsset,
  removeProjectReference,
  updatePackItemContent
} from "@/lib/campaign-store";
import type { PackItemType } from "@/lib/campaign-types";
import { getCurrentClientEmail } from "@/lib/client-session";
import { DEMO_USERS } from "@/lib/demo-auth";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { campaignBridgeService } from "@/features/campaign/campaign-bridge.service";
import { campaignAssetService } from "@/features/campaign/campaign-asset.service";
import { getSessionUser } from "@/features/auth/session.service";
import {
  completeWizardStep,
  createProjectDraft,
  getProject,
  transitionProject,
  updateProject
} from "@/lib/project-service";
import type { CommercialObjective } from "@/lib/project-types";
import {
  emitWizardProgress,
  runAnalyzingProgress,
  runMatchingProgress
} from "@/lib/campaign/wizard-progress.service";

async function requireBrandClient() {
  const email = await getCurrentClientEmail();
  if (!email) {
    throw new Error("Unauthorized");
  }
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

function revalidateWizard(projectId: string) {
  revalidatePath("/brand");
  revalidatePath("/brand/projects");
  revalidatePath("/brand/projects/new");
  revalidatePath(`/brand/projects/${projectId}`);
}

export async function ensureProjectDraftAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const client = await requireBrandClient();
  const existingId = String(formData.get("project_id") ?? "");

  if (existingId) {
    const project = await requireProject(existingId, client.client_email);
    return { ok: true as const, projectId: project.id, wizardStep: project.wizard_step };
  }

  const project = await createProjectDraft({
    client_email: client.client_email,
    client_name: client.client_name,
    company_name: client.company_name,
    created_by: client.client_email
  });

  await campaignBridgeService.ensurePrismaCampaignOnDraft(project.id);

  revalidateWizard(project.id);
  return { ok: true as const, projectId: project.id, wizardStep: 1 };
}

export async function saveWizardBriefAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  await requireProject(projectId, client.client_email);

  const category = String(formData.get("category") ?? "").trim();
  const commercial_objective = String(formData.get("commercial_objective") ?? "") as CommercialObjective;
  const target_audience = String(formData.get("target_audience") ?? "").trim();

  if (!category || !commercial_objective) {
    return { ok: false as const, error: lang === "zh" ? "请填写必填项" : "Complete required fields" };
  }

  await updateProject(projectId, {
    category,
    commercial_objective,
    target_audience
  });

  await completeWizardStep(projectId, 1);
  await emitWizardProgress(projectId, { step: 1, phase: "idle" });
  revalidateWizard(projectId);
  return { ok: true as const, nextStep: 2 };
}

export async function saveWizardStep1Action(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  await requireProject(projectId, client.client_email);

  const product_name = String(formData.get("product_name") ?? "").trim();
  const product_url = String(formData.get("product_url") ?? "").trim();

  if (!product_name) {
    return { ok: false as const, error: lang === "zh" ? "请填写产品名称" : "Enter a product name" };
  }

  const hasProduct = await hasProductVisual(projectId);
  if (!hasProduct) {
    return {
      ok: false as const,
      error: lang === "zh" ? "请上传一张产品图" : "Upload a product photo"
    };
  }

  await updateProject(projectId, {
    product_name,
    product_url,
    title: `${product_name} Campaign`,
    campaign_goal: product_name
  });

  await completeWizardStep(projectId, 2);
  await emitWizardProgress(projectId, { step: 2, phase: "idle" });
  revalidateWizard(projectId);
  return { ok: true as const, nextStep: 3 };
}

export async function addReferenceAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  await requireProject(projectId, client.client_email);

  const url = String(formData.get("source_url") ?? "").trim();
  if (!url) {
    return { ok: false as const, error: lang === "zh" ? "请输入链接" : "Enter a URL" };
  }

  await addProjectReference({ project_id: projectId, source_url: url });
  revalidateWizard(projectId);
  return { ok: true as const };
}

export async function removeReferenceAction(formData: FormData) {
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  await requireProject(projectId, client.client_email);
  await removeProjectReference(String(formData.get("ref_id") ?? ""), projectId);
  revalidateWizard(projectId);
  return { ok: true as const };
}

export async function saveWizardStep2Action(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  await requireProject(projectId, client.client_email);

  const refs = await listReferencesForProject(projectId);
  if (!refs.length) {
    return { ok: false as const, error: lang === "zh" ? "至少添加 1 条参考" : "Add at least one reference" };
  }

  await updateProject(projectId, {
    reference_links: refs.map((item) => item.source_url).join("\n")
  });
  await completeWizardStep(projectId, 3);
  await emitWizardProgress(projectId, { step: 3, phase: "idle" });
  revalidateWizard(projectId);
  return { ok: true as const, nextStep: 4 };
}

export async function saveWizardStep3Action(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  const project = await requireProject(projectId, client.client_email);

  let brief = await getCreativeBrief(projectId);

  try {
    await runAnalyzingProgress(projectId, lang, async () => {
      brief = await ensureCreativeBrief(project);
      if (!brief.executive_summary) {
        throw new Error(lang === "zh" ? "Brief 生成失败" : "Brief generation failed");
      }
      await completeWizardStep(projectId, 4);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : lang === "zh" ? "分析失败" : "Analysis failed";
    return { ok: false as const, error: message };
  }

  revalidateWizard(projectId);
  return { ok: true as const, nextStep: 5, brief };
}

export async function saveWizardStep4Action(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  await requireProject(projectId, client.client_email);

  const style_presets = formData.getAll("style_presets").map(String);
  const video_lengths = formData.getAll("video_lengths").map(String);
  const aspect_ratios = formData.getAll("aspect_ratios").map(String);
  const output_quantity = Number(formData.get("output_quantity") ?? 0);
  const budget_range = String(formData.get("budget_range") ?? "").trim();
  const deadline = String(formData.get("deadline") ?? "").trim();

  if (!style_presets.length || !video_lengths.length || !aspect_ratios.length || !output_quantity || !budget_range) {
    return { ok: false as const, error: lang === "zh" ? "请完成制作选项" : "Complete production options" };
  }

  await updateProject(projectId, {
    style_presets,
    video_lengths,
    aspect_ratios,
    output_quantity,
    budget_range,
    deadline,
    video_count: output_quantity,
    video_format: aspect_ratios[0] ?? "",
    target_platform: aspect_ratios.includes("9:16") ? "TikTok, Meta" : "YouTube, Meta"
  });

  await completeWizardStep(projectId, 5);
  await emitWizardProgress(projectId, { step: 5, phase: "idle" });
  revalidateWizard(projectId);
  return { ok: true as const, nextStep: 6 };
}

export async function saveWizardStep5Action(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  const project = await requireProject(projectId, client.client_email);

  const scriptEdit = String(formData.get("script_edit") ?? "").trim();
  await ensureCreativePack(project);

  if (scriptEdit) {
    const script = await getPackItem(projectId, "script");
    if (script) {
      await updatePackItemContent(projectId, "script", {
        ...script.content_json,
        lines: [{ speaker: "VO", text: scriptEdit, timing: "0:00-0:10" }]
      });
    }
  }

  const pack = await listPackItems(projectId);
  const hasCore = ["brief", "storyboard", "script"].every((type) => pack.some((item) => item.type === type));
  if (!hasCore) {
    return { ok: false as const, error: lang === "zh" ? "Creative Pack 不完整" : "Creative pack incomplete" };
  }

  await completeWizardStep(projectId, 6);
  await emitWizardProgress(projectId, { step: 6, phase: "idle" });
  revalidateWizard(projectId);
  return { ok: true as const, nextStep: 7, pack };
}

export async function publishProjectAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  const project = await requireProject(projectId, client.client_email);
  const title = String(formData.get("title") ?? "").trim();
  const confirmed = formData.get("confirmed") === "1";

  if (!confirmed) {
    return { ok: false as const, error: lang === "zh" ? "请确认发布" : "Confirm before publishing" };
  }

  if (title) {
    await updateProject(projectId, { title });
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
    return { ok: false as const, error: message };
  }

  revalidateWizard(projectId);
  redirect(withLocale(`/brand/projects/${projectId}?tab=match`, lang));
}

export async function saveDraftAction(formData: FormData) {
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  await requireProject(projectId, client.client_email);
  revalidateWizard(projectId);
  return { ok: true as const };
}

export async function removeAssetAction(formData: FormData) {
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  await requireProject(projectId, client.client_email);
  await removeProjectAsset(String(formData.get("asset_id") ?? ""), projectId);
  revalidateWizard(projectId);
  return { ok: true as const };
}

export async function uploadLogoAssetAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  await requireProject(projectId, client.client_email);

  const file = formData.get("image_file");
  if (!(file instanceof File)) {
    return { ok: false as const, error: lang === "zh" ? "请选择图片" : "Choose an image file" };
  }

  const { saveProjectAssetUpload } = await import("@/lib/studioos/project-asset-upload");
  const saved = await saveProjectAssetUpload(projectId, file, "logo");
  if (!saved.ok) {
    return { ok: false as const, error: saved.error };
  }

  const asset = await addProjectAsset({
    project_id: projectId,
    type: "logo",
    file_url: saved.url,
    file_name: saved.file_name
  });

  const sessionUser = await getSessionUser();
  const prismaCampaignId = await campaignBridgeService.ensurePrismaCampaignOnDraft(projectId);
  if (prismaCampaignId && sessionUser && !sessionUser.id.startsWith("demo_")) {
    try {
      await campaignAssetService.uploadLogo(
        prismaCampaignId,
        { id: sessionUser.id, role: sessionUser.role },
        file
      );
    } catch (error) {
      console.error("[uploadLogoAssetAction] prisma logo sync failed", error);
    }
  }

  revalidateWizard(projectId);
  return { ok: true as const, asset };
}

export async function uploadProductImageAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));

  try {
    const client = await requireBrandClient();
    const projectId = String(formData.get("project_id") ?? "");
    const file = formData.get("image_file");

    if (!(file instanceof File) || !file.size) {
      return { ok: false as const, error: lang === "zh" ? "请选择图片" : "Choose an image file" };
    }

    const { uploadBrandProductImage } = await import("@/lib/studioos/brand-product-image-service");
    const result = await uploadBrandProductImage({
      projectId,
      clientEmail: client.client_email,
      file,
      locale: lang
    });

    if (!result.ok) {
      return { ok: false as const, error: result.error };
    }

    revalidateWizard(projectId);
    return { ok: true as const, original: result.original, preview_url: result.preview_url };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return {
      ok: false as const,
      error:
        lang === "zh"
          ? message.includes("Unauthorized")
            ? "上传失败，请确认已登录 Brand 账号"
            : `上传失败：${message || "请稍后重试"}`
          : message.includes("Unauthorized")
            ? "Upload failed — sign in as a brand user"
            : `Upload failed: ${message || "try again"}`
    };
  }
}

export async function refineProductImageAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const client = await requireBrandClient();
  const projectId = String(formData.get("project_id") ?? "");
  const project = await requireProject(projectId, client.client_email);
  const prompt = String(formData.get("prompt") ?? "").trim();

  if (!prompt) {
    return { ok: false as const, error: lang === "zh" ? "请输入精修提示词" : "Enter a refinement prompt" };
  }

  const assets = await listAssetsForProject(projectId);
  const original = assets.find((item) => item.type === "product_image_original");
  if (!original) {
    return { ok: false as const, error: lang === "zh" ? "请先上传产品图" : "Upload a product image first" };
  }

  const { refineProductImageWithAI } = await import("@/lib/studioos/product-image-ai");
  const aiResult = await refineProductImageWithAI({
    projectId,
    originalUrl: original.file_url,
    prompt,
    locale: lang,
    category: project.category
  });

  let fileUrl = "";
  let fileName = "";
  let mimeType = "image/jpeg";
  let sizeBytes = 0;
  let source: "openai" | "local" = "local";

  if (aiResult.ok) {
    fileUrl = aiResult.url;
    fileName = aiResult.file_name;
    mimeType = aiResult.mime_type;
    sizeBytes = aiResult.size_bytes;
    source = aiResult.source;
  } else if (aiResult.code === "NO_OPENAI") {
    const refinedFile = formData.get("refined_file");
    if (!(refinedFile instanceof File) || !refinedFile.size) {
      return {
        ok: false as const,
        error:
          lang === "zh"
            ? "未检测到 OPENAI_API_KEY，已无法使用本地精修"
            : "OPENAI_API_KEY not configured"
      };
    }

    const { saveProjectAssetUpload } = await import("@/lib/studioos/project-asset-upload");
    const saved = await saveProjectAssetUpload(projectId, refinedFile, "product_refined");
    if (!saved.ok) {
      return { ok: false as const, error: saved.error };
    }

    fileUrl = saved.url;
    fileName = saved.file_name;
    mimeType = saved.mime_type;
    sizeBytes = saved.size_bytes;
    source = "local";
  } else {
    return {
      ok: false as const,
      error:
        lang === "zh"
          ? `OpenAI 精修失败：${aiResult.error}。请确认 API Key 有效、账户有余额，并重启 dev 服务器后重试。`
          : `OpenAI refinement failed: ${aiResult.error}. Verify your API key, billing, and restart the dev server.`
    };
  }

  const asset = await addProjectAsset({
    project_id: projectId,
    type: "product_image",
    file_url: fileUrl,
    file_name: fileName
  });

  revalidateWizard(projectId);
  return { ok: true as const, asset, source };
}

export async function loadWizardDataAction(projectId: string) {
  const client = await requireBrandClient();
  const project = await requireProject(projectId, client.client_email);
  const [assets, references, brief, pack] = await Promise.all([
    listAssetsForProject(projectId),
    listReferencesForProject(projectId),
    getCreativeBrief(projectId),
    listPackItems(projectId)
  ]);

  return { project, assets, references, brief, pack };
}
