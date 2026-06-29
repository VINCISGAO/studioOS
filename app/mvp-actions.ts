"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { findCampaignIdByMvpReviewProjectId } from "@/lib/project-service";
import {
  resolveMvpReviewRedirect,
  syncCampaignAfterMvpApprove,
  syncCampaignAfterMvpRevision,
  syncCampaignAfterMvpUpload,
  brandCanAccessMvpReview
} from "@/lib/mvp/campaign-review-bridge";
import { getMvpProfile } from "@/lib/mvp/session";
import {
  addComment,
  addVideoVersion,
  approveReview,
  createProject,
  fileSaveLocalMaster,
  fileSaveLocalVideo,
  getProject,
  releaseSettlement,
  setCommentStatus,
  setMasterFile,
  updateProjectStatus,
  uploadToSupabaseStorage,
  uploadMasterToSupabaseStorage
} from "@/lib/mvp/store";
import { isReviewPhase, isPendingSettlement, reviewIsLocked } from "@/lib/mvp/review-settlement";
import { reviewBridgeService } from "@/features/review/review-bridge.service";
import { videoBridgeService } from "@/features/video/video-bridge.service";

function revalidateProject(projectId: string) {
  revalidatePath("/workspace/brand");
  revalidatePath("/workspace/studio");
  revalidatePath("/workspace/admin");
  revalidatePath(`/workspace/projects/${projectId}`);
  revalidatePath(`/workspace/projects/${projectId}/review`);
  revalidatePath("/brand", "layout");
}

async function revalidateCampaignForMvp(projectId: string) {
  revalidateProject(projectId);
  const campaignId = await findCampaignIdByMvpReviewProjectId(projectId);
  if (campaignId) {
    revalidatePath(`/brand/projects/${campaignId}/review`);
  }
}

export async function createMvpProjectAction(formData: FormData) {
  const profile = await getMvpProfile();
  if (!profile || profile.role !== "brand") {
    redirect("/login?role=brand");
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const brand_name = String(formData.get("brand_name") ?? profile.company_name).trim();
  const assigned_studio_id = String(formData.get("assigned_studio_id") ?? "").trim() || null;

  if (!title) {
    redirect("/workspace/projects/new?error=title");
  }

  const project = await createProject({
    title,
    description,
    brand_name,
    created_by: profile.id,
    assigned_studio_id
  });

  redirect(`/workspace/projects/${project.id}/review`);
}

export async function uploadMvpVideoAction(formData: FormData) {
  const profile = await getMvpProfile();
  if (!profile || profile.role !== "studio") {
    return { ok: false as const, error: "Unauthorized" };
  }

  const projectId = String(formData.get("project_id") ?? "");
  const file = formData.get("video_file");
  const project = await getProject(projectId);

  if (!project || project.assigned_studio_id !== profile.id) {
    return { ok: false as const, error: "Project not found" };
  }

  if (reviewIsLocked(project.status)) {
    return { ok: false as const, error: "Review is closed for this project" };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Upload an MP4 file" };
  }

  const { getReviewBundle } = await import("@/lib/mvp/store");
  const bundle = await getReviewBundle(projectId);
  const nextNum = (bundle?.versions.length ?? 0) + 1;

  const stored = hasSupabaseConfig()
    ? await uploadToSupabaseStorage(projectId, nextNum, file)
    : await fileSaveLocalVideo(projectId, nextNum, file);

  await addVideoVersion({
    project_id: projectId,
    file_url: stored.file_url,
    file_path: stored.file_path,
    uploaded_by: profile.id
  });

  await videoBridgeService.syncUploadFromMvp({
    mvpProjectId: projectId,
    videoUrl: stored.file_url,
    videoKey: stored.file_path
  });
  await syncCampaignAfterMvpUpload(projectId, stored.file_url);
  revalidateCampaignForMvp(projectId);
  return { ok: true as const };
}

export async function addMvpCommentAction(formData: FormData) {
  const profile = await getMvpProfile();
  if (!profile || profile.role !== "brand") {
    return { ok: false as const, error: "Unauthorized" };
  }

  const projectId = String(formData.get("project_id") ?? "");
  const videoVersionId = String(formData.get("video_version_id") ?? "");
  const timestampSeconds = Number(formData.get("timestamp_seconds") ?? 0);
  const commentText = String(formData.get("comment_text") ?? "").trim();
  const annotationType = String(formData.get("annotation_type") ?? "").trim() || null;
  const posX = formData.get("pos_x");
  const posY = formData.get("pos_y");
  const width = formData.get("width");
  const height = formData.get("height");
  const color = String(formData.get("color") ?? "").trim() || null;

  if (!commentText || !videoVersionId) {
    return { ok: false as const, error: "Enter a comment" };
  }

  const project = await getProject(projectId);
  if (!project) {
    return { ok: false as const, error: "Project not found" };
  }

  if (reviewIsLocked(project.status)) {
    return { ok: false as const, error: "Review is closed for this project" };
  }

  if (!isReviewPhase(project.status)) {
    return { ok: false as const, error: "Comments are only allowed during review" };
  }

  const prismaComment = await reviewBridgeService.createCommentFromMvp({
    mvpProjectId: projectId,
    versionId: videoVersionId,
    timeSeconds: timestampSeconds,
    commentText,
    annotationType,
    posX: posX != null && posX !== "" ? Number(posX) : null,
    posY: posY != null && posY !== "" ? Number(posY) : null,
    width: width != null && width !== "" ? Number(width) : null,
    height: height != null && height !== "" ? Number(height) : null,
    color
  });

  if (prismaComment) {
    revalidateCampaignForMvp(projectId);
    return {
      ok: true as const,
      comment: {
        id: prismaComment.id,
        project_id: projectId,
        video_version_id: videoVersionId,
        user_id: profile.id,
        timestamp_seconds: timestampSeconds,
        comment_text: commentText,
        annotation_type: annotationType as "circle" | null,
        pos_x: posX != null && posX !== "" ? Number(posX) : null,
        pos_y: posY != null && posY !== "" ? Number(posY) : null,
        width: width != null && width !== "" ? Number(width) : null,
        height: height != null && height !== "" ? Number(height) : null,
        color,
        status: "open" as const,
        created_at: prismaComment.createdAt.toISOString(),
        resolved_at: null
      }
    };
  }

  const comment = await addComment({
    project_id: projectId,
    video_version_id: videoVersionId,
    user_id: profile.id,
    timestamp_seconds: timestampSeconds,
    comment_text: commentText,
    annotation_type: annotationType as "circle" | null,
    pos_x: posX != null && posX !== "" ? Number(posX) : null,
    pos_y: posY != null && posY !== "" ? Number(posY) : null,
    width: width != null && width !== "" ? Number(width) : null,
    height: height != null && height !== "" ? Number(height) : null,
    color
  });

  revalidateCampaignForMvp(projectId);
  return { ok: true as const, comment };
}

export async function resolveMvpCommentAction(formData: FormData) {
  const profile = await getMvpProfile();
  if (!profile || profile.role !== "studio") {
    return { ok: false as const, error: "Unauthorized" };
  }

  const commentId = String(formData.get("comment_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "");

  const comment = await setCommentStatus(commentId, "resolved");
  if (!comment) {
    return { ok: false as const, error: "Comment not found" };
  }

  revalidateCampaignForMvp(projectId);
  return { ok: true as const, comment };
}

export async function reopenMvpCommentAction(formData: FormData) {
  const profile = await getMvpProfile();
  if (!profile || profile.role !== "brand") {
    return { ok: false as const, error: "Unauthorized" };
  }

  const commentId = String(formData.get("comment_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "");

  const comment = await setCommentStatus(commentId, "reopened");
  if (!comment) {
    return { ok: false as const, error: "Comment not found" };
  }

  revalidateCampaignForMvp(projectId);
  return { ok: true as const, comment };
}

export async function approveFinalAction(formData: FormData) {
  const profile = await getMvpProfile();
  if (!profile || profile.role !== "brand") {
    redirect("/login?role=brand");
  }

  const projectId = String(formData.get("project_id") ?? "");
  const project = await getProject(projectId);
  if (!project || !(await brandCanAccessMvpReview(project, profile))) {
    redirect("/workspace/brand");
  }

  if (!isReviewPhase(project.status)) {
    redirect(await resolveMvpReviewRedirect(projectId, ""));
  }

  const prismaApproved = await reviewBridgeService.approveFromMvp(projectId);
  if (!prismaApproved) {
    await approveReview(projectId);
  }
  await syncCampaignAfterMvpApprove(projectId);
  revalidateCampaignForMvp(projectId);
  redirect(await resolveMvpReviewRedirect(projectId, "approved=1"));
}

export async function releaseSettlementAction(formData: FormData) {
  const profile = await getMvpProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/login?role=brand");
  }

  const projectId = String(formData.get("project_id") ?? "");
  const project = await getProject(projectId);
  if (!project) {
    redirect("/workspace/admin");
  }

  if (!isPendingSettlement(project.status)) {
    redirect(`/workspace/projects/${projectId}/review`);
  }

  await releaseSettlement(projectId);
  revalidateCampaignForMvp(projectId);
  redirect(await resolveMvpReviewRedirect(projectId, "settled=1"));
}

export async function uploadMasterAction(formData: FormData) {
  const profile = await getMvpProfile();
  if (!profile || profile.role !== "studio") {
    return { ok: false as const, error: "Unauthorized" };
  }

  const projectId = String(formData.get("project_id") ?? "");
  const file = formData.get("master_file");
  const project = await getProject(projectId);

  if (!project || project.assigned_studio_id !== profile.id) {
    return { ok: false as const, error: "Project not found" };
  }

  if (project.status !== "settled" && project.status !== "delivered") {
    return { ok: false as const, error: "Settlement must complete before uploading master" };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Upload a master file" };
  }

  const stored = hasSupabaseConfig()
    ? await uploadMasterToSupabaseStorage(projectId, file)
    : await fileSaveLocalMaster(projectId, file);

  await setMasterFile(projectId, { file_url: stored.file_url, file_name: stored.file_name });
  revalidateCampaignForMvp(projectId);
  return { ok: true as const };
}

export async function requestMvpRevisionAction(formData: FormData) {
  const profile = await getMvpProfile();
  if (!profile || profile.role !== "brand") {
    redirect("/login?role=brand");
  }

  const projectId = String(formData.get("project_id") ?? "");
  const project = await getProject(projectId);
  if (!project || !(await brandCanAccessMvpReview(project, profile))) {
    redirect("/workspace/brand");
  }

  if (!isReviewPhase(project.status)) {
    redirect(await resolveMvpReviewRedirect(projectId, ""));
  }

  const note = String(formData.get("revision_note") ?? "").trim();
  const prismaRevision = await reviewBridgeService.requestRevisionFromMvp(projectId, note || undefined);
  if (!prismaRevision) {
    await updateProjectStatus(projectId, "revision");
  }
  await syncCampaignAfterMvpRevision(projectId);
  revalidateCampaignForMvp(projectId);
  redirect(await resolveMvpReviewRedirect(projectId, "revision=1"));
}
