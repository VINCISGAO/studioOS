import { readPrismaCampaignId } from "@/features/campaign/campaign-bridge.service";
import { wizardDraftService } from "@/features/campaign/wizard-draft.service";
import type { FrozenProductionBrief } from "@/features/ai/creative-direction.types";
import { emptyWizardDraft, type WizardDraftState } from "@/lib/campaign/wizard-steps";
import type { ConfirmedBriefSnapshot } from "@/lib/studioos/confirmed-brief";
import type { Locale } from "@/lib/i18n";
import { updateProject } from "@/lib/project-service";
import type { StoredProject } from "@/lib/project-types";

const PROGRESS_KEY = "wizard_progress";
const FREEZE_WIZARD_STEPS = [2, 3, 4, 5, 6] as const;

export function buildConfirmedBriefFromFrozen(frozen: FrozenProductionBrief, lang: Locale) {
  const zh = lang === "zh";
  return {
    confirmed_at: frozen.frozen_at,
    fields: [
      {
        section: zh ? "创意" : "Creative",
        label: zh ? "开场钩子" : "Hook",
        value: frozen.hook
      },
      {
        section: zh ? "创意" : "Creative",
        label: zh ? "故事结构" : "Story",
        value: frozen.story
      },
      {
        section: zh ? "创意" : "Creative",
        label: zh ? "语气" : "Tone",
        value: frozen.tone
      },
      {
        section: zh ? "创意" : "Creative",
        label: zh ? "行动引导" : "CTA",
        value: frozen.cta
      }
    ],
    full_text: frozen.full_text
  };
}

export async function persistFrozenBriefOnProject(input: {
  projectId: string;
  project: StoredProject;
  frozen: FrozenProductionBrief;
  directionId: string;
  lang: Locale;
  progressMessage: string;
  confirmedBrief?: ConfirmedBriefSnapshot;
  extraSettings?: Record<string, unknown>;
}) {
  const completed = new Set([...(input.project.wizard_completed_steps ?? []), ...FREEZE_WIZARD_STEPS]);
  const maxStep = Math.max(...FREEZE_WIZARD_STEPS);
  const wizard_step = Math.max(input.project.wizard_step, Math.min(7, maxStep + 1));

  const settings = (input.project.settings_json ?? {}) as Record<string, unknown>;
  const prevProgress = settings[PROGRESS_KEY] as WizardDraftState | undefined;
  const wizardProgress: WizardDraftState = {
    ...emptyWizardDraft(6),
    ...prevProgress,
    step: 6,
    phase: "idle",
    progressMessage: input.progressMessage,
    updatedAt: new Date().toISOString()
  };

  const confirmed_brief =
    input.confirmedBrief ?? buildConfirmedBriefFromFrozen(input.frozen, input.lang);

  await updateProject(
    input.projectId,
    {
      wizard_completed_steps: [...completed].sort((a, b) => a - b),
      wizard_step,
      settings_json: {
        ...settings,
        frozen_production_brief: input.frozen,
        selected_direction_id: input.directionId,
        confirmed_brief,
        [PROGRESS_KEY]: wizardProgress,
        ...input.extraSettings
      }
    },
    { skipActivity: true }
  );

  const campaignId = readPrismaCampaignId(input.project);
  if (campaignId) {
    void wizardDraftService
      .saveDraft(campaignId, {
        step: 6,
        phase: "idle",
        progressMessage: input.progressMessage
      })
      .catch(() => undefined);
  }
}
