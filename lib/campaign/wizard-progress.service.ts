import { readPrismaCampaignId } from "@/features/campaign/campaign-bridge.service";
import { wizardDraftService } from "@/features/campaign/wizard-draft.service";
import {
  emptyWizardDraft,
  type WizardDraftState,
  type WizardPhase
} from "@/lib/campaign/wizard-steps";
import { getProject, updateProject } from "@/lib/project-service";

const PROGRESS_KEY = "wizard_progress";

function readStoredProgress(settings: Record<string, unknown> | undefined): WizardDraftState | null {
  const raw = settings?.[PROGRESS_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as WizardDraftState;
}

export async function readWizardProgress(projectId: string): Promise<WizardDraftState | null> {
  const project = await getProject(projectId);
  if (!project) return null;
  return readStoredProgress(project.settings_json as Record<string, unknown> | undefined);
}

export async function emitWizardProgress(
  projectId: string,
  patch: Partial<WizardDraftState>
): Promise<WizardDraftState> {
  const project = await getProject(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const prev = readStoredProgress(project.settings_json as Record<string, unknown> | undefined);
  const next: WizardDraftState = {
    ...emptyWizardDraft(patch.step ?? prev?.step ?? project.wizard_step ?? 1),
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString()
  };

  await updateProject(projectId, {
    settings_json: {
      ...(project.settings_json ?? {}),
      [PROGRESS_KEY]: next
    }
  });

  const campaignId = readPrismaCampaignId(project);
  if (campaignId) {
    try {
      await wizardDraftService.saveDraft(campaignId, patch);
    } catch {
      // Prisma optional — file store is source of truth for wizard UI
    }
  }

  return next;
}

export async function runAnalyzingProgress(
  projectId: string,
  locale: "en" | "zh",
  task: () => Promise<void>
): Promise<void> {
  const messages =
    locale === "zh"
      ? ["读取 Brief…", "分析产品视觉…", "研究参考视频…", "撰写创意方向…", "生成分镜与脚本…"]
      : [
          "Reading your brief…",
          "Analyzing product visuals…",
          "Studying reference videos…",
          "Drafting creative direction…",
          "Building storyboard & script…"
        ];

  await emitWizardProgress(projectId, {
    step: 4,
    phase: "analyzing",
    progressMessage: messages[0],
    progressPercent: 10
  });

  for (let i = 0; i < messages.length - 1; i++) {
    await delay(450);
    await emitWizardProgress(projectId, {
      phase: "analyzing",
      progressMessage: messages[i + 1],
      progressPercent: 10 + Math.round(((i + 1) / (messages.length - 1)) * 70)
    });
  }

  await task();

  await emitWizardProgress(projectId, {
    step: 5,
    phase: "idle",
    progressMessage: locale === "zh" ? "分析完成" : "Analysis complete",
    progressPercent: 85
  });
}

export async function runMatchingProgress(
  projectId: string,
  locale: "en" | "zh",
  task: () => Promise<void>
): Promise<void> {
  const messages =
    locale === "zh"
      ? ["发布 Campaign…", "扫描创作者网络…", "评估风格匹配…", "排序最佳匹配…"]
      : [
          "Publishing campaign…",
          "Scanning creator network…",
          "Scoring style fit…",
          "Ranking top matches…"
        ];

  await emitWizardProgress(projectId, {
    step: 7,
    phase: "matching",
    progressMessage: messages[0],
    progressPercent: 92
  });

  for (let i = 0; i < messages.length - 1; i++) {
    await delay(700);
    await emitWizardProgress(projectId, {
      phase: "matching" as WizardPhase,
      progressMessage: messages[i + 1],
      progressPercent: 92 + Math.round(((i + 1) / messages.length) * 7)
    });
  }

  await task();

  await emitWizardProgress(projectId, {
    phase: "idle",
    progressMessage: locale === "zh" ? "匹配完成" : "Matching complete",
    progressPercent: 100
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
