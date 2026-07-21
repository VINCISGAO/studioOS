import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import type { AuthUserDto } from "@/features/auth/auth.service";
import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import { activityService } from "@/features/campaign/activity.service";
import { canvasRepository } from "@/features/canvas/canvas.repository";
import { canvasService } from "@/features/canvas/canvas.service";
import type {
  CanvasAction,
  CanvasDirectorPlan,
  CanvasNodeData,
  DirectorSkill,
  VincisCanvasNode
} from "@/lib/canvas/types";
import { canvasDirectorPlanSchema } from "@/lib/canvas/validation";
import { appError } from "@/lib/core/errors";
import { logger } from "@/lib/core/logger";

const blueprintSchema = z.object({
  message: z.string().min(1).max(1200),
  frameTitle: z.string().min(1).max(120),
  brief: z.string().min(1).max(2000),
  shots: z
    .array(
      z.object({
        title: z.string().min(1).max(100),
        prompt: z.string().min(3).max(1200),
        media: z.enum(["IMAGE", "VIDEO"])
      })
    )
    .min(2)
    .max(8),
  musicPrompt: z.string().min(3).max(1000)
});

type Blueprint = z.infer<typeof blueprintSchema>;

function isActionType<T extends CanvasAction["type"]>(type: T) {
  return (action: CanvasAction): action is Extract<CanvasAction, { type: T }> =>
    action.type === type;
}

const SKILL_LABELS: Record<DirectorSkill, string> = {
  AD_VIDEO: "广告视频",
  PRODUCT_FILM: "产品宣传片",
  SEEDANCE_VIDEO: "Seedance 视频",
  IMAGE_TO_VIDEO: "图生视频",
  BRAND_KEY_VISUAL: "品牌主视觉",
  SOCIAL_AD: "社交媒体广告",
  MUSIC_SCORE: "音乐配乐",
  LOGO_MOTION: "Logo 动效"
};

function fallbackBlueprint(message: string, skill: DirectorSkill): Blueprint {
  const subject = message.slice(0, 240);
  return {
    message: `已为“${SKILL_LABELS[skill]}”整理可执行创作方案。确认后会创建镜头、生成节点和音乐轨道。`,
    frameTitle: `${SKILL_LABELS[skill]} · Director Board`,
    brief: subject,
    shots: [
      { title: "01 开场氛围", prompt: `${subject}，电影感开场，环境建立镜头`, media: "IMAGE" },
      { title: "02 产品特写", prompt: `${subject}，产品英雄特写，精致光影`, media: "IMAGE" },
      { title: "03 核心动作", prompt: `${subject}，核心叙事动作，流畅电影镜头`, media: "VIDEO" },
      { title: "04 品牌收束", prompt: `${subject}，品牌收束画面，高级广告质感`, media: "IMAGE" }
    ],
    musicPrompt: `${subject}，高级电影广告配乐，克制、优雅、有记忆点`
  };
}

function parseBlueprint(content: string): Blueprint | null {
  if (!content.trim()) return null;
  try {
    const normalized = content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    return blueprintSchema.parse(JSON.parse(normalized));
  } catch {
    return null;
  }
}

function buildActions(blueprint: Blueprint): CanvasAction[] {
  const frameId = `frame_${randomUUID()}`;
  const briefId = `node_${randomUUID()}`;
  const actions: CanvasAction[] = [
    {
      type: "CREATE_FRAME",
      frame: {
        id: frameId,
        title: blueprint.frameTitle,
        x: 120,
        y: 100,
        width: 1180,
        height: 760
      }
    },
    {
      type: "CREATE_NODE",
      node: {
        id: briefId,
        nodeType: "text",
        title: "Creative Brief",
        text: blueprint.brief,
        x: 32,
        y: 64,
        width: 1060,
        height: 110,
        parentId: frameId
      }
    }
  ];

  const shotIds = blueprint.shots.map((shot, index) => {
    const nodeId = `node_${randomUUID()}`;
    const column = index % 3;
    const row = Math.floor(index / 3);
    actions.push({
      type: "CREATE_NODE",
      node: {
        id: nodeId,
        nodeType: shot.media === "VIDEO" ? "video" : "image",
        title: shot.title,
        prompt: shot.prompt,
        x: 32 + column * 350,
        y: 205 + row * 245,
        width: 320,
        height: 210,
        parentId: frameId
      }
    });
    actions.push({
      type: "START_GENERATION",
      nodeId,
      generationType: shot.media
    });
    return nodeId;
  });

  const musicId = `node_${randomUUID()}`;
  actions.push({
    type: "CREATE_NODE",
    node: {
      id: musicId,
      nodeType: "music",
      title: "Director Music",
      prompt: blueprint.musicPrompt,
      x: 32,
      y: 520,
      width: 670,
      height: 150,
      parentId: frameId
    }
  });
  actions.push({ type: "START_GENERATION", nodeId: musicId, generationType: "MUSIC" });
  shotIds.slice(1).forEach((nodeId, index) => {
    actions.push({ type: "CONNECT_NODES", sourceId: shotIds[index], targetId: nodeId });
  });
  actions.push({ type: "AUTO_LAYOUT", nodeIds: [...shotIds, musicId] });
  return actions;
}

function estimate(actions: CanvasAction[]) {
  return actions.reduce((total, action) => {
    if (action.type !== "START_GENERATION") return total;
    return total + (action.generationType === "IMAGE" ? 4 : action.generationType === "VIDEO" ? 20 : 8);
  }, 0);
}

export class CanvasDirectorService {
  async createPlan(
    input: { projectId: string; message: string; skill: DirectorSkill },
    user: AuthUserDto
  ): Promise<CanvasDirectorPlan> {
    const project = await canvasService.assertAccess(input.projectId, user);
    const campaign = project.campaign;
    const system = `You are VINCIS AI Director for paid advertising production.
Return JSON only with keys: message, frameTitle, brief, shots, musicPrompt.
shots must be an array of 2-8 items with title, prompt, media ("IMAGE" or "VIDEO").
Create a concise, production-ready storyboard. Respect brand context. Do not claim media has been generated.
This is a draft plan that requires explicit creator confirmation.`;
    let aiResult = {
      content: "",
      model: "template",
      provider: "template",
      tokenInput: 0,
      tokenOutput: 0,
      cost: 0,
      latencyMs: 0
    };

    try {
      aiResult = await aiGatewayService.chatCompletion({
        system,
        user: JSON.stringify({
          request: input.message,
          skill: SKILL_LABELS[input.skill],
          project: project.title,
          campaign: campaign?.title ?? null,
          client: campaign
            ? campaign.brand.brandProfile?.companyName ?? campaign.brand.fullName
            : null,
          brandKitConnected: campaign
            ? Boolean(
                campaign.brand.brandProfile?.brandDnaJson || campaign.assets.length
              )
            : false
        }),
        jsonMode: true,
        temperature: 0.35,
        language: user.languageCode?.startsWith("zh") ? "Chinese" : "English"
      });
    } catch (error) {
      logger.warn("Canvas Director AI planning fell back to template", {
        service: "CanvasDirectorService",
        projectId: project.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    const blueprint =
      parseBlueprint(aiResult.content) ?? fallbackBlueprint(input.message, input.skill);
    const actions = buildActions(blueprint);
    const estimatedCredits = estimate(actions);
    const plan: CanvasDirectorPlan = {
      planId: randomUUID(),
      projectId: input.projectId,
      message: blueprint.message,
      skill: input.skill,
      actions,
      estimatedCredits,
      estimatedTime: {
        minMinutes: Math.max(2, Math.ceil(estimatedCredits / 16)),
        maxMinutes: Math.max(5, Math.ceil(estimatedCredits / 7))
      },
      requiresConfirmation: true,
      provider: aiResult.provider
    };

    await Promise.all([
      canvasRepository.createAiDirectorLog({
        campaignId: project.campaignId,
        input: input as Prisma.InputJsonValue,
        output: plan as unknown as Prisma.InputJsonValue,
        provider: aiResult.provider,
        tokenInput: aiResult.tokenInput,
        tokenOutput: aiResult.tokenOutput,
        cost: aiResult.cost,
        latencyMs: aiResult.latencyMs
      }),
      project.campaignId
        ? activityService.write(
            project.campaignId,
            "canvas.director_plan_created",
            { userId: user.id, email: user.email, role: "creator" },
            {
              plan_id: plan.planId,
              skill: plan.skill,
              action_count: plan.actions.length,
              estimated_credits: plan.estimatedCredits
            }
          )
        : Promise.resolve(null)
    ]);
    return plan;
  }

  async applyPlan(
    projectId: string,
    rawPlan: CanvasDirectorPlan,
    user: AuthUserDto
  ) {
    const plan = canvasDirectorPlanSchema.parse(rawPlan) as CanvasDirectorPlan;
    if (plan.projectId !== projectId) {
      throw appError("VALIDATION_ERROR", "AI Director plan does not belong to this project");
    }
    const snapshot = await canvasService.getOrCreateSnapshot(projectId, user);
    const project = await canvasService.assertAccess(projectId, user);
    const existingIds = new Set(snapshot.nodes.map((node) => node.id));
    const generationByNode = new Map(
      plan.actions
        .filter(isActionType("START_GENERATION"))
        .map((action) => [action.nodeId, action.generationType])
    );

    const frames: VincisCanvasNode[] = plan.actions
      .filter(isActionType("CREATE_FRAME"))
      .filter((action) => !existingIds.has(action.frame.id))
      .map((action) => ({
        id: action.frame.id,
        type: "frame",
        position: { x: action.frame.x, y: action.frame.y },
        width: action.frame.width,
        height: action.frame.height,
        zIndex: -20,
        data: { title: action.frame.title, status: "ready" }
      }));
    frames.forEach((node) => existingIds.add(node.id));

    const createdNodes: VincisCanvasNode[] = plan.actions
      .filter(isActionType("CREATE_NODE"))
      .filter((action) => !existingIds.has(action.node.id))
      .map((action) => {
        const generationType = generationByNode.get(action.node.id);
        return {
          id: action.node.id,
          type: action.node.nodeType,
          position: { x: action.node.x, y: action.node.y },
          width: action.node.width,
          height: action.node.height,
          parentId: action.node.parentId,
          extent: action.node.parentId ? "parent" : undefined,
          zIndex: action.node.parentId ? 1 : 0,
          data: {
            title: action.node.title,
            status: generationType ? "loading" : "ready",
            prompt: action.node.prompt,
            text: action.node.text,
            progress: generationType ? 8 : 100,
            generationType
          }
        } satisfies VincisCanvasNode;
      });

    let nodes = [...snapshot.nodes, ...frames, ...createdNodes];
    plan.actions
      .filter(isActionType("UPDATE_NODE"))
      .forEach((action) => {
        nodes = nodes.map((node) =>
          node.id === action.nodeId ? { ...node, data: { ...node.data, ...action.patch } } : node
        );
      });

    const knownIds = new Set(nodes.map((node) => node.id));
    const newEdges = plan.actions
      .filter(isActionType("CONNECT_NODES"))
      .filter(
        (action) =>
          knownIds.has(action.sourceId) &&
          knownIds.has(action.targetId)
      )
      .map((action) => ({
        id: `edge_${randomUUID()}`,
        source: action.sourceId,
        target: action.targetId
      }));

    await canvasService.saveSnapshot(
      {
        projectId,
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type ?? "text",
          position: node.position,
          width: node.width,
          height: node.height,
          parentId: node.parentId,
          zIndex: node.zIndex,
          data: node.data
        })),
        edges: [...snapshot.edges, ...newEdges],
        viewport: snapshot.viewport
      },
      user
    );

    const generationActions = plan.actions.filter(
      isActionType("START_GENERATION")
    );
    await Promise.all(
      generationActions.map(async (action) => {
        const node = createdNodes.find((item) => item.id === action.nodeId);
        if (!node?.data.prompt) return;
        await canvasService.createMockGeneration(
          {
            projectId,
            nodeId: action.nodeId,
            type: action.generationType,
            prompt: node.data.prompt,
            model: "vincis-mock-v1",
            idempotencyKey: `${plan.planId}:${action.nodeId}`,
            parameters:
              action.generationType === "IMAGE"
                ? { aspectRatio: "16:9", resolution: "1024", outputs: 1 }
                : action.generationType === "VIDEO"
                  ? { aspectRatio: "16:9", duration: 5 }
                  : { duration: 30, instrumental: true }
          },
          user
        );
      })
    );

    if (project.campaignId) {
      await activityService.write(
        project.campaignId,
        "canvas.director_plan_applied",
        { userId: user.id, email: user.email, role: "creator" },
        { plan_id: plan.planId, generation_count: generationActions.length }
      );
    }
    return canvasService.getOrCreateSnapshot(projectId, user);
  }
}

export const canvasDirectorService = new CanvasDirectorService();
