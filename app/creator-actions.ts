"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCreatorId } from "@/features/auth/session-context";
import { deleteCreatorWork, publishWork, setCreatorWorkHidden } from "@/lib/works-service";
import type { CreatorWork } from "@/lib/types";

function parseWorkPayload(raw: FormDataEntryValue | null): CreatorWork {
  return JSON.parse(String(raw ?? "{}")) as CreatorWork;
}

async function requireCreatorId() {
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    throw new Error("Unauthorized");
  }
  return creatorId;
}

function normalizeWork(work: CreatorWork, creatorId: string): CreatorWork {
  return {
    ...work,
    creator_id: creatorId,
    tags: Array.isArray(work.tags) ? work.tags : []
  };
}

function revalidateWorkPaths(creatorId: string) {
  revalidatePath("/");
  revalidatePath("/creators");
  revalidatePath(`/creators/${creatorId}`);
  revalidatePath("/creator/profile");
}

export async function publishWorkAction(formData: FormData) {
  const creatorId = await requireCreatorId();
  const work = normalizeWork(parseWorkPayload(formData.get("payload")), creatorId);

  if (!work.title?.trim() || !work.video_url?.trim()) {
    throw new Error("Missing required fields");
  }

  await publishWork(work);
  revalidateWorkPaths(creatorId);
}

export async function uploadCreatorWorkVideoAction(formData: FormData) {
  const creatorId = await requireCreatorId();
  const lang = String(formData.get("lang") ?? "en") === "zh" ? "zh" : "en";
  const file = formData.get("video_file");

  if (!(file instanceof File)) {
    return { ok: false as const, error: lang === "zh" ? "请选择视频文件" : "Choose a video file" };
  }

  const { saveCreatorWorkVideoUpload } = await import("@/lib/studioos/creator-avatar-upload");
  const saved = await saveCreatorWorkVideoUpload(creatorId, file);
  if (!saved.ok) {
    return { ok: false as const, error: saved.error };
  }

  return {
    ok: true as const,
    video_url: saved.url,
    file_name: saved.file_name,
    mime_type: saved.mime_type,
    size_bytes: saved.size_bytes
  };
}

export async function syncWorksAction(formData: FormData) {
  const creatorId = await requireCreatorId();
  const works = JSON.parse(String(formData.get("works") ?? "[]")) as CreatorWork[];

  for (const item of works) {
    if (item.creator_id !== creatorId) {
      continue;
    }

    await publishWork(normalizeWork(item, creatorId));
  }

  revalidateWorkPaths(creatorId);
  return { ok: true as const };
}

export async function hideWorkAction(formData: FormData) {
  const creatorId = await requireCreatorId();
  const work = normalizeWork(parseWorkPayload(formData.get("payload")), creatorId);
  const hidden = String(formData.get("hidden") ?? "true") === "true";

  await setCreatorWorkHidden(creatorId, work, hidden);
  revalidateWorkPaths(creatorId);
  return { ok: true as const, hidden };
}

export async function deleteWorkAction(formData: FormData) {
  const creatorId = await requireCreatorId();
  const workId = String(formData.get("work_id") ?? "").trim();
  if (!workId) {
    throw new Error("Missing work id");
  }

  await deleteCreatorWork(creatorId, workId);
  revalidateWorkPaths(creatorId);
  return { ok: true as const };
}
