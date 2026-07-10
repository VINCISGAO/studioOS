import { creativeCollaborationService } from "@/features/creative-collaboration/creative-collaboration.service";
import type {
  CollaborationActor,
  CreativeCollaborationView
} from "@/features/creative-collaboration/creative-collaboration.types";
import type { Locale } from "@/lib/i18n";

export type CreativeCollaborationActionName =
  | "brandGenerate"
  | "brandSkip"
  | "brandDeepen"
  | "brandSend"
  | "brandConfirm"
  | "brandReject"
  | "brandDeepenCreator"
  | "brandSendFinal"
  | "creatorGenerate"
  | "creatorSend"
  | "creatorAck";

export type CreativeCollaborationActor = {
  role: CollaborationActor;
  userId: string;
  creatorId?: string;
  brandEmail?: string;
};

export async function runCreativeCollaborationAction(input: {
  projectId: string;
  action: CreativeCollaborationActionName;
  actor: CreativeCollaborationActor;
  locale: Locale;
  ideaId?: string;
  ideaIds?: string[];
}): Promise<CreativeCollaborationView> {
  const { projectId, action, actor, locale, ideaId, ideaIds } = input;

  switch (action) {
    case "brandGenerate":
      return creativeCollaborationService.brandGenerate(projectId, actor, locale);
    case "brandSkip":
      return creativeCollaborationService.brandSkip(projectId, actor);
    case "brandDeepen":
      if (!ideaId) throw new Error("ideaId is required");
      return creativeCollaborationService.brandDeepen(projectId, actor, locale, ideaId);
    case "brandSend":
      if (!ideaId) throw new Error("ideaId is required");
      return creativeCollaborationService.brandSendToCreator(projectId, actor, ideaId);
    case "brandConfirm":
      if (!ideaId) throw new Error("ideaId is required");
      return creativeCollaborationService.brandConfirmCreatorIdea(projectId, actor, ideaId);
    case "brandReject":
      if (!ideaId) throw new Error("ideaId is required");
      return creativeCollaborationService.brandRejectCreatorIdea(projectId, actor, ideaId);
    case "brandDeepenCreator":
      if (!ideaId) throw new Error("ideaId is required");
      return creativeCollaborationService.brandDeepenCreatorIdea(projectId, actor, locale, ideaId);
    case "brandSendFinal":
      if (!ideaId) throw new Error("ideaId is required");
      return creativeCollaborationService.brandSendFinalToCreator(projectId, actor, ideaId);
    case "creatorGenerate":
      return creativeCollaborationService.creatorGenerate(projectId, actor, locale);
    case "creatorSend":
      return creativeCollaborationService.creatorSendToBrand(projectId, actor, ideaIds ?? []);
    case "creatorAck":
      return creativeCollaborationService.creatorAcknowledgeBrandDirection(projectId, actor);
    default: {
      const exhaustive: never = action;
      throw new Error(`Unknown creative collaboration action: ${exhaustive}`);
    }
  }
}
