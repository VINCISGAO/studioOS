import { aiLearningEventRepository } from "@/features/ai/ai-learning-event.repository";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { buildCollaborationTemplateIdeas } from "@/features/creative-collaboration/creative-collaboration.idea-generator";
import {
  buildCreativeCollaborationView,
  patchCreativeCollaborationSettings,
  readCreativeCollaboration
} from "@/features/creative-collaboration/creative-collaboration.repository";
import type {
  CollaborationActor,
  CollaborationIdea,
  CreativeCollaborationView,
  FinalCreativeDirection
} from "@/features/creative-collaboration/creative-collaboration.types";
import { appError } from "@/lib/core/errors";
import type { Locale } from "@/lib/i18n";
import { getOrderForProject } from "@/lib/order-service";
import { assertProjectFundedForAi } from "@/features/payment/escrow-guards";
import { getProject, updateProject } from "@/lib/project-service";
import type { StoredProject } from "@/lib/project-types";

type ActorContext = {
  role: CollaborationActor;
  userId: string;
  creatorId?: string;
  brandEmail?: string;
};

function ideaFullText(idea: CollaborationIdea): string {
  return [
    idea.title,
    idea.coreIdea,
    idea.hook,
    idea.story,
    idea.visualStyle,
    idea.tone,
    `Shot list: ${idea.shotList.join(" · ")}`,
    idea.cta,
    idea.rationale
  ].join("\n\n");
}

async function assertEscrowFundedForProject(
  projectId: string,
  orderPaymentStatus?: import("@/lib/order-types").OrderPaymentStatus
) {
  await assertProjectFundedForAi(projectId, orderPaymentStatus);
}

async function recordLearningEvent(input: {
  projectId: string;
  eventType: string;
  learningType: string;
  payload: Record<string, unknown>;
  after: Record<string, unknown>;
}) {
  await aiLearningEventRepository.append({
    eventType: input.eventType,
    entityType: "Campaign",
    entityId: input.projectId,
    payload: input.payload,
    learningType: input.learningType,
    after: input.after,
    confidence: 0.85
  });
}

async function loadProjectContext(projectId: string, actor: ActorContext) {
  const project = await getProject(projectId);
  if (!project) {
    throw appError("NOT_FOUND", "Project not found");
  }

  const order = await getOrderForProject(projectId);
  if (!order?.creator_id) {
    throw appError("INVALID_TRANSITION", "Active project required before creative collaboration");
  }

  if (actor.role === "brand") {
    const email = actor.brandEmail?.toLowerCase();
    if (!email || project.client_email.toLowerCase() !== email) {
      throw appError("FORBIDDEN", "Not allowed for this project");
    }
  }

  if (actor.role === "creator") {
    if (!actor.creatorId || order.creator_id !== actor.creatorId) {
      throw appError("FORBIDDEN", "Not allowed for this project");
    }
  }

  return { project, order };
}

async function persistState(project: StoredProject, state: ReturnType<typeof readCreativeCollaboration>) {
  const updated = await updateProject(project.id, {
    settings_json: patchCreativeCollaborationSettings(project, state)
  });
  if (!updated) {
    throw appError("SYSTEM_ERROR", "Failed to save creative collaboration");
  }
  return buildCreativeCollaborationView(state);
}

function findIdea(state: ReturnType<typeof readCreativeCollaboration>, ideaId: string) {
  const idea = state.ideas.find((item) => item.id === ideaId);
  if (!idea) {
    throw appError("NOT_FOUND", "Creative idea not found");
  }
  return idea;
}

function confirmDirection(
  idea: CollaborationIdea,
  confirmedBy: CollaborationActor
): FinalCreativeDirection {
  return {
    ideaId: idea.id,
    title: idea.title,
    summary: idea.summary,
    confirmedBy,
    confirmedAt: new Date().toISOString(),
    fullText: ideaFullText(idea)
  };
}

export class CreativeCollaborationService {
  async getView(projectId: string, actor: ActorContext): Promise<CreativeCollaborationView> {
    const { project } = await loadProjectContext(projectId, actor);
    return buildCreativeCollaborationView(readCreativeCollaboration(project));
  }

  async brandGenerate(projectId: string, actor: ActorContext, locale: Locale) {
    const { project, order } = await loadProjectContext(projectId, actor);
    await assertEscrowFundedForProject(projectId, order.payment_status);

    const state = readCreativeCollaboration(project);
    const existingBrandIdeas = state.ideas.filter((idea) => idea.actor === "brand");
    if (state.brandGenerationCount >= 3 && existingBrandIdeas.length) {
      return buildCreativeCollaborationView(state);
    }

    await recordLearningEvent({
      projectId,
      eventType: "brand_ai_idea_clicked",
      learningType: "creative_collaboration",
      payload: { projectId, role: "brand", trigger_source: "brand_project_form" },
      after: { action: "generate" }
    });

    const ideas = buildCollaborationTemplateIdeas({ project, locale, actor: "brand" });
    const next = {
      ...state,
      ideas: [...state.ideas, ...ideas],
      brandGenerationCount: state.brandGenerationCount + 1
    };

    await recordLearningEvent({
      projectId,
      eventType: "brand_ai_idea_generated",
      learningType: "creative_collaboration",
      payload: { projectId, idea_ids: ideas.map((item) => item.id), count: ideas.length },
      after: { brand_generation_count: next.brandGenerationCount }
    });

    return persistState(project, next);
  }

  async brandDeepen(projectId: string, actor: ActorContext, locale: Locale, parentIdeaId: string) {
    const { project, order } = await loadProjectContext(projectId, actor);
    await assertEscrowFundedForProject(projectId, order.payment_status);

    const state = readCreativeCollaboration(project);
    const parent = findIdea(state, parentIdeaId);
    if (parent.actor !== "brand") {
      throw appError("INVALID_TRANSITION", "Can only deepen brand ideas");
    }

    const ideas = buildCollaborationTemplateIdeas({
      project,
      locale,
      actor: "brand",
      parentIdea: parent,
      count: 1
    });

    const next = {
      ...state,
      ideas: [...state.ideas, ...ideas]
    };

    await recordLearningEvent({
      projectId,
      eventType: "brand_ai_idea_deepened",
      learningType: "creative_collaboration",
      payload: { projectId, parent_idea_id: parentIdeaId, idea_ids: ideas.map((item) => item.id) },
      after: { parent_idea_id: parentIdeaId }
    });

    return persistState(project, next);
  }

  async brandSendToCreator(projectId: string, actor: ActorContext, ideaId: string) {
    const { project } = await loadProjectContext(projectId, actor);
    const state = readCreativeCollaboration(project);
    const idea = findIdea(state, ideaId);

    const next = {
      ...state,
      brandSentIdeaId: ideaId,
      ideas: state.ideas.map((item) =>
        item.id === ideaId ? { ...item, status: "sent" as const } : item
      )
    };

    await recordLearningEvent({
      projectId,
      eventType: "brand_ai_idea_selected",
      learningType: "brand_creative_preference",
      payload: { projectId, idea_id: ideaId, title: idea.title },
      after: { brand_sent_idea_id: ideaId, preference: idea.summary }
    });
    await recordLearningEvent({
      projectId,
      eventType: "brand_ai_idea_sent_to_creator",
      learningType: "creative_collaboration",
      payload: { projectId, idea_id: ideaId },
      after: { brand_sent_idea_id: ideaId }
    });

    return persistState(project, next);
  }

  async brandSkip(projectId: string, actor: ActorContext) {
    const { project } = await loadProjectContext(projectId, actor);
    const state = readCreativeCollaboration(project);
    const next = { ...state, brandSkippedAt: new Date().toISOString() };

    await recordLearningEvent({
      projectId,
      eventType: "brand_ai_idea_skipped",
      learningType: "creative_collaboration",
      payload: { projectId },
      after: { brand_skipped_at: next.brandSkippedAt }
    });

    return persistState(project, next);
  }

  async creatorGenerate(projectId: string, actor: ActorContext, locale: Locale) {
    const { project, order } = await loadProjectContext(projectId, actor);
    await assertEscrowFundedForProject(projectId, order.payment_status);

    const state = readCreativeCollaboration(project);
    const brandSent = state.brandSentIdeaId
      ? state.ideas.find((item) => item.id === state.brandSentIdeaId)
      : undefined;

    if (brandSent && state.creatorDerivativeCount >= 3) {
      throw appError("INVALID_TRANSITION", "Creator may generate up to 3 derivative attempts");
    }

    await recordLearningEvent({
      projectId,
      eventType: "creator_ai_idea_clicked",
      learningType: "creative_collaboration",
      payload: {
        projectId,
        role: "creator",
        trigger_source: brandSent ? "brand_direction" : "creator_initiated"
      },
      after: { action: "generate" }
    });

    const ideas = buildCollaborationTemplateIdeas({
      project,
      locale,
      actor: "creator",
      parentIdea: brandSent
    });

    const next = {
      ...state,
      ideas: [...state.ideas, ...ideas],
      creatorDerivativeCount: brandSent ? state.creatorDerivativeCount + 1 : state.creatorDerivativeCount
    };

    await recordLearningEvent({
      projectId,
      eventType: "creator_ai_idea_generated",
      learningType: "creative_collaboration",
      payload: {
        projectId,
        idea_ids: ideas.map((item) => item.id),
        parent_idea_id: brandSent?.id ?? null
      },
      after: { creator_derivative_count: next.creatorDerivativeCount }
    });

    return persistState(project, next);
  }

  async creatorSendToBrand(projectId: string, actor: ActorContext, ideaIds: string[]) {
    const { project } = await loadProjectContext(projectId, actor);
    const state = readCreativeCollaboration(project);

    if (!ideaIds.length) {
      throw appError("INVALID_TRANSITION", "Select at least one creative direction");
    }

    const next = {
      ...state,
      creatorSentIdeaIds: ideaIds,
      ideas: state.ideas.map((item) =>
        ideaIds.includes(item.id) ? { ...item, status: "sent" as const } : item
      )
    };

    await recordLearningEvent({
      projectId,
      eventType: "creator_ai_idea_selected",
      learningType: "creative_collaboration",
      payload: { projectId, idea_ids: ideaIds },
      after: { creator_sent_idea_ids: ideaIds }
    });
    await recordLearningEvent({
      projectId,
      eventType: "creator_idea_sent_to_brand",
      learningType: "creative_collaboration",
      payload: { projectId, idea_ids: ideaIds },
      after: { creator_sent_idea_ids: ideaIds }
    });

    return persistState(project, next);
  }

  async creatorAcknowledgeBrandDirection(projectId: string, actor: ActorContext) {
    const { project } = await loadProjectContext(projectId, actor);
    const state = readCreativeCollaboration(project);
    if (!state.brandSentIdeaId) {
      throw appError("INVALID_TRANSITION", "No brand direction to acknowledge");
    }

    const idea = findIdea(state, state.brandSentIdeaId);
    const next = {
      ...state,
      ideas: state.ideas.map((item) =>
        item.id === idea.id ? { ...item, status: "acknowledged" as const } : item
      ),
      finalCreativeDirection: confirmDirection(idea, "creator")
    };

    await recordLearningEvent({
      projectId,
      eventType: "final_creative_direction_confirmed",
      learningType: "creative_collaboration",
      payload: { projectId, idea_id: idea.id, path: "brand_send_creator_ack" },
      after: { final_idea_id: idea.id }
    });

    return persistState(project, next);
  }

  async brandConfirmCreatorIdea(projectId: string, actor: ActorContext, ideaId: string) {
    const { project } = await loadProjectContext(projectId, actor);
    const state = readCreativeCollaboration(project);
    const idea = findIdea(state, ideaId);
    if (idea.actor !== "creator") {
      throw appError("INVALID_TRANSITION", "Can only confirm creator proposals");
    }

    const next = {
      ...state,
      ideas: state.ideas.map((item) =>
        item.id === ideaId ? { ...item, status: "confirmed" as const } : item
      ),
      finalCreativeDirection: confirmDirection(idea, "brand")
    };

    await recordLearningEvent({
      projectId,
      eventType: "brand_confirmed_creator_idea",
      learningType: "creative_collaboration",
      payload: { projectId, idea_id: ideaId },
      after: { final_idea_id: ideaId }
    });
    await recordLearningEvent({
      projectId,
      eventType: "final_creative_direction_confirmed",
      learningType: "creative_collaboration",
      payload: { projectId, idea_id: ideaId, path: "creator_send_brand_confirm" },
      after: { final_idea_id: ideaId }
    });

    return persistState(project, next);
  }

  async brandRejectCreatorIdea(projectId: string, actor: ActorContext, ideaId: string) {
    const { project } = await loadProjectContext(projectId, actor);
    const state = readCreativeCollaboration(project);
    const next = {
      ...state,
      ideas: state.ideas.map((item) =>
        item.id === ideaId ? { ...item, status: "rejected" as const } : item
      )
    };

    await recordLearningEvent({
      projectId,
      eventType: "brand_rejected_creator_idea",
      learningType: "creative_collaboration",
      payload: { projectId, idea_id: ideaId },
      after: { rejected_idea_id: ideaId }
    });

    return persistState(project, next);
  }

  async brandDeepenCreatorIdea(
    projectId: string,
    actor: ActorContext,
    locale: Locale,
    parentIdeaId: string
  ) {
    const { project, order } = await loadProjectContext(projectId, actor);
    await assertEscrowFundedForProject(projectId, order.payment_status);

    const state = readCreativeCollaboration(project);
    const parent = findIdea(state, parentIdeaId);

    const ideas = buildCollaborationTemplateIdeas({
      project,
      locale,
      actor: "brand",
      parentIdea: parent,
      count: 1
    });

    const next = {
      ...state,
      ideas: [...state.ideas, ...ideas]
    };

    await recordLearningEvent({
      projectId,
      eventType: "brand_deepened_creator_idea",
      learningType: "creative_collaboration",
      payload: { projectId, parent_idea_id: parentIdeaId, idea_ids: ideas.map((item) => item.id) },
      after: { parent_idea_id: parentIdeaId }
    });

    return persistState(project, next);
  }

  async brandSendFinalToCreator(projectId: string, actor: ActorContext, ideaId: string) {
    const { project } = await loadProjectContext(projectId, actor);
    const state = readCreativeCollaboration(project);
    const idea = findIdea(state, ideaId);

    const next = {
      ...state,
      finalCreativeDirection: confirmDirection(idea, "brand"),
      ideas: state.ideas.map((item) =>
        item.id === ideaId ? { ...item, status: "confirmed" as const } : item
      )
    };

    await recordLearningEvent({
      projectId,
      eventType: "final_creative_direction_confirmed",
      learningType: "creative_collaboration",
      payload: { projectId, idea_id: ideaId, path: "brand_deepen_confirm_send" },
      after: { final_idea_id: ideaId }
    });

    return persistState(project, next);
  }
}

export const creativeCollaborationService = new CreativeCollaborationService();
