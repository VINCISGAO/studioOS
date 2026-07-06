"use server";

import { redirect } from "next/navigation";
import { getCurrentCreator } from "@/lib/creator-session";
import { withLocale, type Locale } from "@/lib/i18n";
import { canAcceptCreatorOrders, countCompletedCreatorOrders } from "@/lib/studioos/deposit-guard";
import { createProjectApplication, getProject } from "@/lib/project-service";
import { listOrdersForCreator } from "@/lib/order-service";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return String(raw ?? "en") === "zh" ? "zh" : "en";
}

export async function connectCreatorFromMatchAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");

  if (!projectId) {
    redirect(withLocale("/start?error=missing-project", lang));
  }

  const project = await getProject(projectId);
  if (!project) {
    redirect(withLocale("/start?error=missing-project", lang));
  }

  const status = normalizeCampaignStatus(project.status);
  if (status === "payment_pending") {
    redirect(withLocale(`/brand/projects/${projectId}/checkout`, lang));
  }

  redirect(withLocale(`/brand/projects/${projectId}?tab=match&error=use-shortlist`, lang));
}

export async function applyToProjectAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const projectId = String(formData.get("project_id") ?? "");
  const creatorId = String(formData.get("creator_id") ?? "");
  const proposal = String(formData.get("proposal") ?? "").trim();
  const timeline = String(formData.get("timeline") ?? "").trim();
  const proposedAmount = Number(formData.get("proposed_amount") ?? 0);

  if (!projectId || !creatorId || !proposal || !timeline || !proposedAmount) {
    redirect(withLocale(`/projects/${projectId}?error=missing-application`, lang));
  }

  const creator = await getCurrentCreator();
  if (
    !creator ||
    !canAcceptCreatorOrders(creator, countCompletedCreatorOrders(await listOrdersForCreator(creatorId)))
  ) {
    redirect(withLocale("/studio/deposit?error=deposit-required", lang));
  }

  await createProjectApplication({
    project_id: projectId,
    creator_id: creatorId,
    proposed_amount: proposedAmount,
    timeline,
    proposal
  });

  redirect(withLocale(`/projects/${projectId}?applied=1`, lang));
}
