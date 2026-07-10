import type { StoredProject } from "@/lib/project-types";
import {
  CREATIVE_COLLABORATION_SETTINGS_KEY,
  type CreativeCollaborationState,
  type CreativeCollaborationView
} from "@/features/creative-collaboration/creative-collaboration.types";

function defaultState(): CreativeCollaborationState {
  return {
    ideas: [],
    brandGenerationCount: 0,
    creatorDerivativeCount: 0
  };
}

export function readCreativeCollaboration(project: StoredProject): CreativeCollaborationState {
  const raw = project.settings_json?.[CREATIVE_COLLABORATION_SETTINGS_KEY];
  if (!raw || typeof raw !== "object") {
    return defaultState();
  }
  const value = raw as Partial<CreativeCollaborationState>;
  return {
    ideas: Array.isArray(value.ideas) ? value.ideas : [],
    brandSentIdeaId: typeof value.brandSentIdeaId === "string" ? value.brandSentIdeaId : undefined,
    creatorSentIdeaIds: Array.isArray(value.creatorSentIdeaIds)
      ? value.creatorSentIdeaIds.filter((id): id is string => typeof id === "string")
      : undefined,
    brandSkippedAt: typeof value.brandSkippedAt === "string" ? value.brandSkippedAt : undefined,
    brandGenerationCount: Number(value.brandGenerationCount ?? 0),
    creatorDerivativeCount: Number(value.creatorDerivativeCount ?? 0),
    finalCreativeDirection:
      value.finalCreativeDirection && typeof value.finalCreativeDirection === "object"
        ? value.finalCreativeDirection
        : undefined
  };
}

export function buildCreativeCollaborationView(state: CreativeCollaborationState): CreativeCollaborationView {
  const brandIdeas = state.ideas.filter((idea) => idea.actor === "brand");
  const creatorIdeas = state.ideas.filter((idea) => idea.actor === "creator");
  const brandSentIdea = state.brandSentIdeaId
    ? state.ideas.find((idea) => idea.id === state.brandSentIdeaId)
    : undefined;
  const pendingCreatorIdeas = creatorIdeas.filter(
    (idea) => idea.status === "sent" && !state.finalCreativeDirection
  );

  return {
    ...state,
    hasConfirmedDirection: Boolean(state.finalCreativeDirection),
    brandIdeas,
    creatorIdeas,
    brandSentIdea,
    pendingCreatorIdeas
  };
}

export function patchCreativeCollaborationSettings(
  project: StoredProject,
  state: CreativeCollaborationState
): Record<string, unknown> {
  return {
    ...(project.settings_json ?? {}),
    [CREATIVE_COLLABORATION_SETTINGS_KEY]: state,
    final_creative_direction: state.finalCreativeDirection?.fullText ?? null,
    confirmed_creative_direction: state.finalCreativeDirection
      ? {
          idea_id: state.finalCreativeDirection.ideaId,
          title: state.finalCreativeDirection.title,
          confirmed_at: state.finalCreativeDirection.confirmedAt,
          confirmed_by: state.finalCreativeDirection.confirmedBy
        }
      : null
  };
}
