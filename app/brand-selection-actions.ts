"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DEMO_USERS } from "@/lib/demo-auth";
import { withLocale, type Locale } from "@/lib/i18n";
import { getProject } from "@/lib/project-service";
import { getCurrentSession } from "@/lib/session-user";
import { selectCreatorForProject } from "@/lib/studioos/creator-invitation-store";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { invitationPortalService } from "@/features/matching/invitation-portal.service";
import { brandCampaignRepository } from "@/features/campaign/brand-campaign/brand-campaign.repository";
import { aiLearningEventRepository } from "@/features/ai/ai-learning-event.repository";

function revalidateClosedLoopPaths(projectId: string) {
  revalidatePath("/brand");
  revalidatePath("/brand/campaigns");
  revalidatePath("/brand/messages");
  revalidatePath(brandPortalRoutes.campaign(projectId));
  revalidatePath(brandPortalRoutes.project(projectId));
  revalidatePath(brandPortalRoutes.projectCheckout(projectId));
  revalidatePath("/studio");
  revalidatePath("/studio/messages");
  revalidatePath("/studio/invitations");
  revalidatePath("/studio/projects");
  revalidatePath(creatorPortalRoutes.projects);
}

async function requireBrandSelectionSession(locale: Locale) {
  const session = await getCurrentSession();
  if (!session || session.role !== "client") {
    redirect(withLocale("/login?role=brand", locale));
  }
  return { ...session, email: session.email.toLowerCase() };
}

export async function selectCreatorFromInvitationsAction(formData: FormData) {
  const locale = (formData.get("lang") as Locale) || "en";
  const projectId = String(formData.get("projectId") ?? "");
  const creatorId = String(formData.get("creatorId") ?? "");

  const session = await requireBrandSelectionSession(locale);

  const project = await getProject(projectId);
  if (!project || project.client_email.toLowerCase() !== session.email) {
    redirect(withLocale(`${brandPortalRoutes.project(projectId)}?tab=match&error=project-not-found`, locale));
  }
  const demoUser = DEMO_USERS.find((user) => user.email === session.email);

  const result = await selectCreatorForProject({
    projectId,
    creatorId,
    locale,
    client: {
      client_name: demoUser?.label.replace(/\s*\(brand\)/i, "").trim() ?? session.email.split("@")[0] ?? "Brand",
      client_email: session.email,
      company_name: project?.company_name ?? demoUser?.label ?? ""
    }
  });

  revalidateClosedLoopPaths(projectId);

  if (!result.ok) {
    redirect(withLocale(`${brandPortalRoutes.project(projectId)}?tab=match&error=${result.error}`, locale));
  }

  redirect(withLocale(`${brandPortalRoutes.project(projectId)}?tab=match`, locale));
}

export async function rerollCreatorInvitationsAction(formData: FormData) {
  const locale = (formData.get("lang") as Locale) || "en";
  const projectId = String(formData.get("projectId") ?? "");

  const session = await requireBrandSelectionSession(locale);

  const project = await getProject(projectId);
  if (!project || project.client_email.toLowerCase() !== session.email) {
    redirect(withLocale(`${brandPortalRoutes.project(projectId)}?tab=match&error=project-not-found`, locale));
  }

  const result = await invitationPortalService.rerollForProject(projectId, locale);
  revalidateClosedLoopPaths(projectId);

  if (!result.ok) {
    const refund = result.refundAvailable ? "&refund=1" : "";
    redirect(withLocale(`${brandPortalRoutes.project(projectId)}?tab=match&error=${result.error}${refund}`, locale));
  }

  redirect(withLocale(`${brandPortalRoutes.project(projectId)}?tab=match&reroll=${result.rerollCount}`, locale));
}

export async function trackBrandCreatorProfileViewAction(formData: FormData) {
  const locale = (formData.get("lang") as Locale) || "en";
  const projectId = String(formData.get("projectId") ?? "");
  const creatorId = String(formData.get("creatorId") ?? "");

  const session = await requireBrandSelectionSession(locale);

  const project = await getProject(projectId);
  if (!project || project.client_email.toLowerCase() !== session.email) {
    redirect(withLocale(`${brandPortalRoutes.project(projectId)}?tab=match&error=project-not-found`, locale));
  }

  const campaign = await brandCampaignRepository.findByLegacyProjectId(projectId).catch(() => null);
  await aiLearningEventRepository.append({
    eventType: "BrandViewedCreatorProfile",
    entityType: "Campaign",
    entityId: campaign?.id ?? projectId,
    payload: {
      campaignId: campaign?.id ?? null,
      legacy_project_id: projectId,
      legacy_creator_id: creatorId,
      brand_email: session.email,
      source: "accepted_creator_list"
    },
    learningType: "view_creator",
    after: {
      legacy_creator_id: creatorId,
      viewed_creator_profile: true
    },
    confidence: 0.55
  });

  redirect(withLocale(`/creators/${creatorId}`, locale));
}
