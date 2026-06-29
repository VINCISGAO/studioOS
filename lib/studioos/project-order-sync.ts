import { transitionProject } from "@/lib/project-service";
import type { ProjectActorRole, ProjectEventName } from "@/lib/studioos/project-status";

export async function syncProjectFromOrderEvent(
  projectId: string | null | undefined,
  event: ProjectEventName,
  actorRole: ProjectActorRole = "system"
) {
  if (!projectId) {
    return;
  }

  await transitionProject(projectId, event, {
    actor_role: actorRole,
    skipPreconditions: true
  });
}

export async function syncProjectAfterDeliverable(projectId: string | null | undefined) {
  await syncProjectFromOrderEvent(projectId, "project.deliverable_uploaded", "studio");
}

export async function syncProjectAfterRevisionRequest(projectId: string | null | undefined) {
  await syncProjectFromOrderEvent(projectId, "project.revision_requested", "brand");
}

export async function syncProjectAfterApproval(projectId: string | null | undefined) {
  await syncProjectFromOrderEvent(projectId, "project.delivery_approved", "brand");
  await syncProjectFromOrderEvent(projectId, "project.escrow_released", "system");
}
