import { prisma } from "@/lib/core/database/prisma";
import {
  emptyWizardDraft,
  type WizardDraftState
} from "@/lib/campaign/wizard-steps";

type ProductionBrief = Record<string, unknown> & {
  wizard?: WizardDraftState;
};

function readBrief(raw: unknown): ProductionBrief {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as ProductionBrief;
  }
  return {};
}

export class WizardDraftService {
  async getDraft(campaignId: string): Promise<WizardDraftState | null> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { productionBrief: true }
    });
    if (!campaign) return null;
    const brief = readBrief(campaign.productionBrief);
    return brief.wizard ?? null;
  }

  async saveDraft(campaignId: string, draft: Partial<WizardDraftState>): Promise<WizardDraftState> {
    const campaign = await prisma.campaign.findUniqueOrThrow({
      where: { id: campaignId },
      select: { productionBrief: true }
    });
    const brief = readBrief(campaign.productionBrief);
    const next: WizardDraftState = {
      ...emptyWizardDraft(draft.step ?? brief.wizard?.step ?? 1),
      ...brief.wizard,
      ...draft,
      updatedAt: new Date().toISOString()
    };

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        productionBrief: {
          ...brief,
          wizard: next
        }
      }
    });

    return next;
  }

  async emitProgress(
    campaignId: string,
    phase: WizardDraftState["phase"],
    progressMessage: string
  ): Promise<WizardDraftState> {
    return this.saveDraft(campaignId, { phase, progressMessage });
  }
}

export const wizardDraftService = new WizardDraftService();
