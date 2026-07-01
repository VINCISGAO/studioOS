import "server-only";

import { ensureCreativeBrief, ensureCreativePack } from "@/lib/campaign-store";
import { emitWizardProgress } from "@/lib/campaign/wizard-progress.service";
import type { Locale } from "@/lib/i18n";
import { completeWizardStep, getProject, updateProject } from "@/lib/project-service";
import {
  defaultBrandBudget,
  defaultBrandTimeline,
  deliveryTimelineLabel
} from "@/lib/studioos/brand-campaign-options";

function defaultDeadlineIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Instant mock prepare — no delays, for wizard step transitions. */
export async function runBrandWizardDemoPrepareInstant(projectId: string, lang: Locale) {
  const project = await getProject(projectId);
  if (!project) {
    throw new Error(lang === "zh" ? "项目不存在" : "Project not found");
  }

  const brief = await ensureCreativeBrief(project);
  if (!brief.executive_summary) {
    throw new Error(lang === "zh" ? "演示方案生成失败" : "Demo plan generation failed");
  }

  await completeWizardStep(projectId, 4);

  await updateProject(projectId, {
    style_presets: project.style_presets?.length ? project.style_presets : ["Apple Minimal"],
    video_lengths: project.video_lengths?.length ? project.video_lengths : ["30s"],
    aspect_ratios: project.aspect_ratios?.length ? project.aspect_ratios : ["9:16"],
    output_quantity: project.output_quantity || 1,
    ...(project.budget_range?.trim() ? {} : { budget_range: defaultBrandBudget() }),
    ...(project.deadline?.trim() ? {} : { deadline: defaultDeadlineIso() }),
    video_count: project.video_count || 1,
    video_format: project.video_format || "9:16",
    target_platform: project.target_platform || "TikTok, Meta",
    brand_style: project.brand_style || "Apple Minimal"
  });

  await ensureCreativePack(project);
  await completeWizardStep(projectId, 5);

  await emitWizardProgress(projectId, {
    step: 5,
    phase: "idle",
    progressMessage: lang === "zh" ? "演示方案已就绪" : "Demo plan ready",
    progressPercent: 85
  });

  const updated = await getProject(projectId);
  const timelineId = String(
    (updated?.settings_json?.brand_questionnaire as { deliveryTimeline?: string } | undefined)?.deliveryTimeline ??
      defaultBrandTimeline()
  );

  return {
    budget: updated?.budget_range ?? defaultBrandBudget(),
    delivery: deliveryTimelineLabel(timelineId, lang)
  };
}

/** Fast mock analysis — template brief + pack, no OpenAI / Prisma. */
export async function runBrandWizardDemoPrepare(projectId: string, lang: Locale) {
  const project = await getProject(projectId);
  if (!project) {
    throw new Error(lang === "zh" ? "项目不存在" : "Project not found");
  }

  const steps =
    lang === "zh"
      ? ["读取需求…", "分析产品…", "整理参考…", "生成创意方案…"]
      : ["Reading brief…", "Analyzing product…", "Reviewing references…", "Building creative plan…"];

  for (let i = 0; i < steps.length; i++) {
    await emitWizardProgress(projectId, {
      step: 4,
      phase: "analyzing",
      progressMessage: steps[i],
      progressPercent: 15 + i * 18
    });
    await delay(280);
  }

  const brief = await ensureCreativeBrief(project);
  if (!brief.executive_summary) {
    throw new Error(lang === "zh" ? "演示方案生成失败" : "Demo plan generation failed");
  }

  await completeWizardStep(projectId, 4);

  await updateProject(projectId, {
    style_presets: project.style_presets?.length ? project.style_presets : ["Apple Minimal"],
    video_lengths: project.video_lengths?.length ? project.video_lengths : ["30s"],
    aspect_ratios: project.aspect_ratios?.length ? project.aspect_ratios : ["9:16"],
    output_quantity: project.output_quantity || 1,
    ...(project.budget_range?.trim() ? {} : { budget_range: defaultBrandBudget() }),
    ...(project.deadline?.trim() ? {} : { deadline: defaultDeadlineIso() }),
    video_count: project.video_count || 1,
    video_format: project.video_format || "9:16",
    target_platform: project.target_platform || "TikTok, Meta",
    brand_style: project.brand_style || "Apple Minimal"
  });

  await ensureCreativePack(project);
  await completeWizardStep(projectId, 5);

  await emitWizardProgress(projectId, {
    step: 5,
    phase: "idle",
    progressMessage: lang === "zh" ? "演示方案已就绪" : "Demo plan ready",
    progressPercent: 85
  });

  const updated = await getProject(projectId);
  const timelineId = String(
    (updated?.settings_json?.brand_questionnaire as { deliveryTimeline?: string } | undefined)?.deliveryTimeline ??
      defaultBrandTimeline()
  );

  return {
    budget: updated?.budget_range ?? defaultBrandBudget(),
    delivery: deliveryTimelineLabel(timelineId, lang)
  };
}

/** Fast mock publish — skip Prisma sync when unavailable. */
export async function runBrandWizardDemoPublish(
  projectId: string,
  lang: Locale,
  actorId: string,
  publish: () => Promise<void>
) {
  const steps =
    lang === "zh"
      ? ["提交广告…", "创建托管订单…", "等待付款…"]
      : ["Submitting ad…", "Creating escrow order…", "Awaiting payment…"];

  for (let i = 0; i < steps.length; i++) {
    await emitWizardProgress(projectId, {
      step: 7,
      phase: "publishing",
      progressMessage: steps[i],
      progressPercent: 90 + i * 3
    });
    await delay(350);
  }

  await publish();

  await emitWizardProgress(projectId, {
    phase: "idle",
    progressMessage: lang === "zh" ? "发布成功，请完成付款" : "Published — complete payment",
    progressPercent: 100
  });
}
