"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { getMvpProfile } from "@/lib/mvp/session";
import {
  addComment,
  addVideoVersion,
  createProject,
  fileSaveLocalVideo,
  getProject,
  setCommentStatus,
  updateProjectStatus,
  uploadToSupabaseStorage
} from "@/lib/mvp/store";

function revalidateProject(projectId: string) {
  revalidatePath("/workspace/brand");
  revalidatePath("/workspace/studio");
  revalidatePath("/workspace/admin");
  revalidatePath(`/workspace/projects/${projectId}`);
  revalidatePath(`/workspace/projects/${projectId}/review`);
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

  revalidateProject(projectId);
  return { ok: true as const };
}

export async function addMvpCommentAction(formData: FormData) {
  const profile = await getMvpProfile();
  if (!profile) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const projectId = String(formData.get("project_id") ?? "");
  const videoVersionId = String(formData.get("video_version_id") ?? "");
  const timestampSeconds = Number(formData.get("timestamp_seconds") ?? 0);
  const commentText = String(formData.get("comment_text") ?? "").trim();

  if (!commentText || !videoVersionId) {
    return { ok: false as const, error: "Enter a comment" };
  }

  const project = await getProject(projectId);
  if (!project) {
    return { ok: false as const, error: "Project not found" };
  }

  const comment = await addComment({
    project_id: projectId,
    video_version_id: videoVersionId,
    user_id: profile.id,
    timestamp_seconds: timestampSeconds,
    comment_text: commentText
  });

  revalidateProject(projectId);
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

  revalidateProject(projectId);
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

  revalidateProject(projectId);
  return { ok: true as const, comment };
}

export async function approveFinalAction(formData: FormData) {
  const profile = await getMvpProfile();
  if (!profile || profile.role !== "brand") {
    redirect("/login?role=brand");
  }

  const projectId = String(formData.get("project_id") ?? "");
  const project = await getProject(projectId);
  if (!project || project.created_by !== profile.id) {
    redirect("/workspace/brand");
  }

  await updateProjectStatus(projectId, "approved");
  revalidateProject(projectId);
  redirect(`/workspace/projects/${projectId}/review?approved=1`);
}

export async function requestMvpRevisionAction(formData: FormData) {
  const profile = await getMvpProfile();
  if (!profile || profile.role !== "brand") {
    redirect("/login?role=brand");
  }

  const projectId = String(formData.get("project_id") ?? "");
  const project = await getProject(projectId);
  if (!project || project.created_by !== profile.id) {
    redirect("/workspace/brand");
  }

  await updateProjectStatus(projectId, "revision");
  revalidateProject(projectId);
  redirect(`/workspace/projects/${projectId}/review?revision=1`);
}
