import "server-only";

import { getSessionUser } from "@/features/auth/session.service";
import { canvasService } from "@/features/canvas/canvas.service";
import { appError } from "@/lib/core/errors";

async function requireCanvasPageUser() {
  const user = await getSessionUser();
  if (!user) throw appError("UNAUTHORIZED", "Not authenticated");
  return user;
}

export async function listCanvasHomeAction() {
  return canvasService.listHome(await requireCanvasPageUser());
}

export async function loadCanvasAction(projectId: string) {
  return canvasService.getOrCreateSnapshot(projectId, await requireCanvasPageUser());
}
