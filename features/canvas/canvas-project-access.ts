import { Prisma } from "@prisma/client";
import type { AuthUserDto } from "@/features/auth/auth.service";
import { canvasRepository, type CanvasProjectRecord } from "@/features/canvas/canvas.repository";
import { appError } from "@/lib/core/errors";

function isCreativeProjectCampaignConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes("campaign_id")
  );
}

export function assertCanvasCreator(user: AuthUserDto) {
  if (user.role !== "CREATOR" && !user.hasCreatorProfile) {
    throw appError("FORBIDDEN", "Creator access required");
  }
}

export async function resolveCanvasProjectForOwner(
  projectId: string,
  user: AuthUserDto
): Promise<CanvasProjectRecord> {
  assertCanvasCreator(user);
  const direct = await canvasRepository.findProjectForOwner(projectId, user.id);
  if (direct) return direct;

  const campaign = await canvasRepository.findCampaignForCreator(projectId, user.id);
  if (!campaign) throw appError("NOT_FOUND", "Creative project not found");

  const existing = await canvasRepository.findProjectByCampaignForCreator(projectId, user.id);
  if (existing) return existing;

  let createdProjectId: string;
  try {
    const created = await canvasRepository.createOrderProject({
      ownerId: user.id,
      createdBy: user.id,
      campaignId: campaign.id,
      title: campaign.title
    });
    createdProjectId = created.id;
  } catch (error) {
    if (!isCreativeProjectCampaignConflict(error)) throw error;
    const raced = await canvasRepository.findProjectByCampaignForCreator(projectId, user.id);
    if (raced) return raced;
    throw error;
  }

  const project = await canvasRepository.findProjectForOwner(createdProjectId, user.id);
  if (!project) throw appError("SYSTEM_ERROR", "Creative project could not be created");
  return project;
}
