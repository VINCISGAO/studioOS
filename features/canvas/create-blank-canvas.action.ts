"use server";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/features/auth/session.service";
import { canvasService } from "@/features/canvas/canvas.service";
import { getAppUiLocale } from "@/lib/app-language";
import { appError } from "@/lib/core/errors";
import { withLocale, type Locale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

async function requireCreatorUser() {
  const user = await getSessionUser();
  if (!user) throw appError("UNAUTHORIZED", "Not authenticated");
  return user;
}

export async function redirectToCanvasEditor() {
  const [user, locale] = await Promise.all([requireCreatorUser(), getAppUiLocale()]);
  const home = await canvasService.listHome(user);
  const latest = home.recentCanvases[0];
  const projectId = latest?.id ?? (await canvasService.createStandaloneProject(user)).id;
  redirect(withLocale(creatorPortalRoutes.canvasProject(projectId), locale as Locale));
}

export async function redirectToNewBlankCanvas() {
  const [user, locale] = await Promise.all([requireCreatorUser(), getAppUiLocale()]);
  const project = await canvasService.createStandaloneProject(user);
  redirect(withLocale(creatorPortalRoutes.canvasProject(project.id), locale as Locale));
}

export async function createBlankCanvasAction() {
  await redirectToNewBlankCanvas();
}
