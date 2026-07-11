"use server";

import { revalidatePath } from "next/cache";
import {
  runCreativeCollaborationAction,
  type CreativeCollaborationActionName
} from "@/features/creative-collaboration/creative-collaboration.actions";
import { getCurrentClientEmail } from "@/features/auth/session-context";
import { getCurrentCreatorId } from "@/features/auth/session-context";
import type { Locale } from "@/lib/i18n";
import { appError } from "@/lib/core/errors";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return raw === "zh" ? "zh" : "en";
}

function revalidateProject(projectId: string) {
  revalidatePath(`/brand/projects/${projectId}`);
  revalidatePath("/studio/projects");
  revalidatePath("/studio/review");
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Action failed";
}

async function brandActor() {
  const email = await getCurrentClientEmail();
  if (!email) {
    throw appError("UNAUTHORIZED", "Brand session required");
  }
  return {
    role: "brand" as const,
    userId: email,
    brandEmail: email
  };
}

async function creatorActor() {
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    throw appError("UNAUTHORIZED", "Creator session required");
  }
  return { role: "creator" as const, userId: creatorId, creatorId };
}

async function runAction(
  action: CreativeCollaborationActionName,
  formData: FormData
) {
  const projectId = String(formData.get("projectId") ?? "");
  const locale = normalizeLang(formData.get("lang"));
  const ideaId = String(formData.get("ideaId") ?? "").trim() || undefined;
  const ideaIds = String(formData.get("ideaIds") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const actor = action.startsWith("creator") ? await creatorActor() : await brandActor();

  const view = await runCreativeCollaborationAction({
    projectId,
    action,
    actor,
    locale,
    ideaId,
    ideaIds: ideaIds.length ? ideaIds : undefined
  });
  revalidateProject(projectId);
  return { ok: true as const, view };
}

function wrap(action: CreativeCollaborationActionName) {
  return async (formData: FormData) => {
    try {
      return await runAction(action, formData);
    } catch (error) {
      return { ok: false as const, error: errorMessage(error) };
    }
  };
}

export const brandGenerateCreativeIdeasAction = wrap("brandGenerate");
export const brandDeepenCreativeIdeaAction = wrap("brandDeepen");
export const brandSendCreativeIdeaAction = wrap("brandSend");
export const brandSkipCreativeIdeasAction = wrap("brandSkip");
export const brandConfirmCreatorIdeaAction = wrap("brandConfirm");
export const brandRejectCreatorIdeaAction = wrap("brandReject");
export const brandDeepenCreatorIdeaAction = wrap("brandDeepenCreator");
export const brandSendFinalCreativeAction = wrap("brandSendFinal");
export const creatorGenerateCreativeIdeasAction = wrap("creatorGenerate");
export const creatorSendCreativeIdeasAction = wrap("creatorSend");
export const creatorAcknowledgeBrandDirectionAction = wrap("creatorAck");
