import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  CommentStatus,
  MvpProfile,
  MvpStore,
  ProjectStatus,
  ReviewProject,
  VideoComment,
  VideoVersion
} from "@/lib/mvp/types";
import { dataStorePath, readDataJson, writeDataJson } from "@/lib/serverless-store";

const STORE_PATH = dataStorePath("mvp-store.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "mvp");

export const DEMO_PROFILES = {
  brand: "prof_demo_brand_arc",
  studio: "prof_demo_studio_nova",
  admin: "prof_demo_admin"
} as const;

const DEMO_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function seedStore(): MvpStore {
  const t = "2026-06-28T10:00:00.000Z";
  const projectId = "proj_mvp_demo_01";
  const v1 = "ver_mvp_demo_v1";
  const v2 = "ver_mvp_demo_v2";
  const v3 = "ver_mvp_demo_v3";

  return {
    profiles: [
      {
        id: DEMO_PROFILES.brand,
        email: "client.arc@adbridge.test",
        role: "brand",
        name: "Arc & Alloy",
        company_name: "Arc & Alloy",
        created_at: t
      },
      {
        id: DEMO_PROFILES.studio,
        email: "creator.nova@adbridge.test",
        role: "studio",
        name: "Nova Motion Studio",
        company_name: "Nova Motion Studio",
        created_at: t
      },
      {
        id: DEMO_PROFILES.admin,
        email: "admin@adbridge.test",
        role: "admin",
        name: "Platform Admin",
        company_name: "StudioOS",
        created_at: t
      },
      {
        id: "prof_demo_brand_bright",
        email: "client.bright@adbridge.test",
        role: "brand",
        name: "BrightSip",
        company_name: "BrightSip",
        created_at: t
      }
    ],
    projects: [
      {
        id: projectId,
        title: "Summer Glow Campaign",
        description: "TikTok · 9:16 · 00:28 — summer travel hero cut.",
        brand_name: "Arc & Alloy",
        status: "in_review",
        created_by: DEMO_PROFILES.brand,
        assigned_studio_id: DEMO_PROFILES.studio,
        created_at: t,
        updated_at: t
      },
      {
        id: "proj_mvp_demo_02",
        title: "Product Demo Batch",
        description: "Amazon + YouTube product demo spots.",
        brand_name: "BrightSip",
        status: "revision",
        created_by: "prof_demo_brand_bright",
        assigned_studio_id: DEMO_PROFILES.studio,
        created_at: t,
        updated_at: t
      }
    ],
    versions: [
      {
        id: v1,
        project_id: projectId,
        version_number: 1,
        file_url: DEMO_VIDEO,
        file_path: "",
        uploaded_by: DEMO_PROFILES.studio,
        created_at: t
      },
      {
        id: v2,
        project_id: projectId,
        version_number: 2,
        file_url: DEMO_VIDEO,
        file_path: "",
        uploaded_by: DEMO_PROFILES.studio,
        created_at: "2026-06-28T14:00:00.000Z"
      },
      {
        id: v3,
        project_id: projectId,
        version_number: 3,
        file_url: DEMO_VIDEO,
        file_path: "",
        uploaded_by: DEMO_PROFILES.studio,
        created_at: "2026-06-28T16:00:00.000Z"
      }
    ],
    comments: [
      {
        id: "cmt_demo_1",
        project_id: projectId,
        video_version_id: v3,
        user_id: DEMO_PROFILES.brand,
        timestamp_seconds: 5.2,
        comment_text: "这里转场可以再自然一些。",
        annotation_type: "circle",
        pos_x: 0.28,
        pos_y: 0.35,
        width: 0.18,
        height: 0.14,
        color: "#7C3AED",
        status: "open",
        created_at: t,
        resolved_at: null
      },
      {
        id: "cmt_demo_2",
        project_id: projectId,
        video_version_id: v3,
        user_id: DEMO_PROFILES.brand,
        timestamp_seconds: 8.4,
        comment_text: "产品再居中一点，LOGO 可以更大。",
        annotation_type: "circle",
        pos_x: 0.38,
        pos_y: 0.32,
        width: 0.22,
        height: 0.2,
        color: "#F59E0B",
        status: "open",
        created_at: t,
        resolved_at: null
      },
      {
        id: "cmt_demo_3",
        project_id: projectId,
        video_version_id: v3,
        user_id: DEMO_PROFILES.brand,
        timestamp_seconds: 11.6,
        comment_text: "字幕位置再往上移一点，避免被遮挡。",
        annotation_type: "circle",
        pos_x: 0.42,
        pos_y: 0.62,
        width: 0.2,
        height: 0.12,
        color: "#7C3AED",
        status: "resolved",
        created_at: t,
        resolved_at: t
      }
    ]
  };
}

let storeInitPromise: Promise<MvpStore> | null = null;

async function writeStore(store: MvpStore) {
  await writeDataJson(STORE_PATH, store);
}

function migrateProject(raw: ReviewProject): ReviewProject {
  const status =
    raw.status === "approved"
      ? "pending_settlement"
      : raw.status === "delivered" && raw.master_file_url
        ? "settled"
        : raw.status;
  return {
    ...raw,
    status,
    review_approved_at: raw.review_approved_at ?? (raw.status === "approved" ? raw.updated_at : null),
    settled_at: raw.settled_at ?? null,
    master_file_url: raw.master_file_url ?? null,
    master_file_name: raw.master_file_name ?? null,
    master_uploaded_at: raw.master_uploaded_at ?? null
  };
}

async function readStore(): Promise<MvpStore> {
  if (!storeInitPromise) {
    storeInitPromise = readDataJson<MvpStore>(STORE_PATH, seedStore)
      .then(async (store) => {
        let migrated = false;
        store.projects = store.projects.map((p) => {
          const next = migrateProject(p as ReviewProject);
          if (JSON.stringify(p) !== JSON.stringify(next)) migrated = true;
          return next;
        });
        const withDemo = await ensureDemoReviewData(store);
        if (migrated) await writeStore(withDemo);
        return withDemo;
      })
      .finally(() => {
        storeInitPromise = null;
      });
  }
  return storeInitPromise;
}

/** Refresh demo project when local store is stale (missing V3 or Chinese review comments). */
async function ensureDemoReviewData(store: MvpStore): Promise<MvpStore> {
  const projectId = "proj_mvp_demo_01";
  const seed = seedStore();
  const seedProject = seed.projects.find((p) => p.id === projectId);
  if (!seedProject) return store;

  const v3 =
    store.versions.find((v) => v.project_id === projectId && v.version_number === 3) ??
    seed.versions.find((v) => v.project_id === projectId && v.version_number === 3);

  const v3Comments = v3
    ? store.comments.filter((c) => c.project_id === projectId && c.video_version_id === v3.id)
    : [];
  const hasChineseV3Comments = v3Comments.some((c) => /[\u4e00-\u9fff]/.test(c.comment_text));
  const needsRefresh = !v3 || v3Comments.length === 0 || !hasChineseV3Comments;

  if (!needsRefresh) return store;

  let dirty = false;
  store.projects = store.projects.map((p) =>
    p.id === projectId ? { ...p, title: seedProject.title, description: seedProject.description } : p
  );
  dirty = true;

  for (const version of seed.versions.filter((v) => v.project_id === projectId)) {
    const existingIdx = store.versions.findIndex(
      (v) => v.project_id === projectId && v.version_number === version.version_number
    );
    if (existingIdx === -1) {
      store.versions.push(version);
    }
  }

  const activeV3 =
    store.versions.find((v) => v.project_id === projectId && v.version_number === 3) ?? v3;
  if (!activeV3) return store;

  const seedComments = seed.comments.filter(
    (c) => c.project_id === projectId && c.video_version_id === "ver_mvp_demo_v3"
  );

  store.comments = store.comments.filter(
    (c) => !(c.project_id === projectId && c.id.startsWith("cmt_demo_"))
  );

  for (const comment of seedComments) {
    const mapped: VideoComment = { ...comment, video_version_id: activeV3.id };
    if (!store.comments.some((c) => c.id === mapped.id)) {
      store.comments.push(mapped);
    }
  }

  if (dirty || seedComments.length > 0) await writeStore(store);
  return store;
}

export async function fileGetProfileByEmail(email: string): Promise<MvpProfile | null> {
  const store = await readStore();
  return store.profiles.find((p) => p.email === email.toLowerCase()) ?? null;
}

export async function fileGetProfile(id: string): Promise<MvpProfile | null> {
  const store = await readStore();
  return store.profiles.find((p) => p.id === id) ?? null;
}

export async function fileListProfiles(): Promise<MvpProfile[]> {
  const store = await readStore();
  return store.profiles;
}

export async function fileListStudios(): Promise<MvpProfile[]> {
  const store = await readStore();
  return store.profiles.filter((p) => p.role === "studio");
}

export async function fileGetProject(id: string): Promise<ReviewProject | null> {
  const store = await readStore();
  return store.projects.find((p) => p.id === id) ?? null;
}

export async function fileListProjectsForBrand(brandId: string): Promise<ReviewProject[]> {
  const store = await readStore();
  return store.projects.filter((p) => p.created_by === brandId);
}

export async function fileListProjectsForStudio(studioId: string): Promise<ReviewProject[]> {
  const store = await readStore();
  return store.projects.filter((p) => p.assigned_studio_id === studioId);
}

export async function fileListAllProjects(): Promise<ReviewProject[]> {
  const store = await readStore();
  return store.projects;
}

export async function fileCreateProject(input: {
  title: string;
  description: string;
  brand_name: string;
  created_by: string;
  assigned_studio_id: string | null;
}): Promise<ReviewProject> {
  const store = await readStore();
  const project: ReviewProject = {
    id: createId("proj"),
    title: input.title.trim(),
    description: input.description.trim(),
    brand_name: input.brand_name.trim(),
    status: input.assigned_studio_id ? "in_review" : "draft",
    created_by: input.created_by,
    assigned_studio_id: input.assigned_studio_id,
    created_at: nowIso(),
    updated_at: nowIso()
  };
  store.projects.unshift(project);
  await writeStore(store);
  return project;
}

export async function fileUpdateProjectStatus(id: string, status: ProjectStatus): Promise<ReviewProject | null> {
  return filePatchProject(id, { status });
}

export async function filePatchProject(
  id: string,
  patch: Partial<
    Pick<
      ReviewProject,
      | "status"
      | "review_approved_at"
      | "settled_at"
      | "master_file_url"
      | "master_file_name"
      | "master_uploaded_at"
    >
  >
): Promise<ReviewProject | null> {
  const store = await readStore();
  const project = store.projects.find((p) => p.id === id);
  if (!project) return null;
  Object.assign(project, patch, { updated_at: nowIso() });
  await writeStore(store);
  return project;
}

export async function fileApproveReview(id: string): Promise<ReviewProject | null> {
  return filePatchProject(id, {
    status: "pending_settlement",
    review_approved_at: nowIso()
  });
}

export async function fileReleaseSettlement(id: string): Promise<ReviewProject | null> {
  return filePatchProject(id, {
    status: "settled",
    settled_at: nowIso()
  });
}

export async function fileSetMasterFile(
  id: string,
  input: { file_url: string; file_name: string }
): Promise<ReviewProject | null> {
  return filePatchProject(id, {
    master_file_url: input.file_url,
    master_file_name: input.file_name,
    master_uploaded_at: nowIso()
  });
}

export async function fileListVersions(projectId: string): Promise<VideoVersion[]> {
  const store = await readStore();
  return store.versions
    .filter((v) => v.project_id === projectId)
    .sort((a, b) => a.version_number - b.version_number);
}

export async function fileAddVersion(input: {
  project_id: string;
  file_url: string;
  file_path: string;
  uploaded_by: string;
}): Promise<VideoVersion> {
  const store = await readStore();
  const nextNum =
    store.versions.filter((v) => v.project_id === input.project_id).length + 1;
  const version: VideoVersion = {
    id: createId("ver"),
    project_id: input.project_id,
    version_number: nextNum,
    file_url: input.file_url,
    file_path: input.file_path,
    uploaded_by: input.uploaded_by,
    created_at: nowIso()
  };
  store.versions.push(version);
  const project = store.projects.find((p) => p.id === input.project_id);
  if (project && project.status !== "pending_settlement" && project.status !== "settled") {
    project.status = "in_review";
    project.updated_at = nowIso();
  }
  await writeStore(store);
  return version;
}

export async function fileListComments(projectId: string, versionId?: string): Promise<VideoComment[]> {
  const store = await readStore();
  return store.comments
    .filter(
      (c) =>
        c.project_id === projectId &&
        (versionId === undefined || c.video_version_id === versionId)
    )
    .sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);
}

export async function fileAddComment(input: {
  project_id: string;
  video_version_id: string;
  user_id: string;
  timestamp_seconds: number;
  comment_text: string;
  annotation_type?: VideoComment["annotation_type"];
  pos_x?: number | null;
  pos_y?: number | null;
  width?: number | null;
  height?: number | null;
  color?: string | null;
}): Promise<VideoComment> {
  const store = await readStore();
  const comment: VideoComment = {
    id: createId("cmt"),
    project_id: input.project_id,
    video_version_id: input.video_version_id,
    user_id: input.user_id,
    timestamp_seconds: Math.max(0, input.timestamp_seconds),
    comment_text: input.comment_text.trim(),
    annotation_type: input.annotation_type ?? null,
    pos_x: input.pos_x ?? null,
    pos_y: input.pos_y ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
    color: input.color ?? null,
    status: "open",
    created_at: nowIso(),
    resolved_at: null
  };
  store.comments.push(comment);
  await writeStore(store);
  return comment;
}

export async function fileSetCommentStatus(
  commentId: string,
  status: CommentStatus
): Promise<VideoComment | null> {
  const store = await readStore();
  const comment = store.comments.find((c) => c.id === commentId);
  if (!comment) return null;
  comment.status = status;
  comment.resolved_at = status === "resolved" ? nowIso() : null;
  await writeStore(store);
  return comment;
}

export async function fileSaveLocalMaster(
  projectId: string,
  file: File
): Promise<{ file_url: string; file_path: string; file_name: string }> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const safeName = file.name.replace(/[^\w.\-()]/g, "_") || "master.mp4";
  const filename = `${projectId}_master_${Date.now()}_${safeName}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);
  return {
    file_url: `/uploads/mvp/${filename}`,
    file_path: filePath,
    file_name: safeName
  };
}

export async function fileSaveLocalVideo(
  projectId: string,
  versionNumber: number,
  file: File
): Promise<{ file_url: string; file_path: string }> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = file.name.split(".").pop()?.toLowerCase() === "mp4" ? "mp4" : "mp4";
  const filename = `${projectId}_v${versionNumber}_${Date.now()}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);
  return { file_url: `/uploads/mvp/${filename}`, file_path: filePath };
}

export async function fileCountAll(): Promise<{
  users: number;
  projects: number;
  videos: number;
  comments: number;
}> {
  const store = await readStore();
  return {
    users: store.profiles.length,
    projects: store.projects.length,
    videos: store.versions.length,
    comments: store.comments.length
  };
}
