import { promises as fs } from "fs";
import path from "path";
import type {
  CommentStatus,
  MvpProfile,
  MvpStore,
  ProjectStatus,
  ReviewProject,
  VideoComment,
  VideoVersion
} from "@/lib/mvp/types";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(STORE_DIR, "mvp-store.json");
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
        title: "Arc Alloy Summer Launch — Hero film",
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
      }
    ],
    comments: [
      {
        id: "cmt_demo_1",
        project_id: projectId,
        video_version_id: v2,
        user_id: DEMO_PROFILES.brand,
        timestamp_seconds: 4,
        comment_text: "Logo contrast too low in opening frame.",
        status: "open",
        created_at: t,
        resolved_at: null
      },
      {
        id: "cmt_demo_2",
        project_id: projectId,
        video_version_id: v2,
        user_id: DEMO_PROFILES.brand,
        timestamp_seconds: 12,
        comment_text: "End card CTA should match summer lockup.",
        status: "reopened",
        created_at: t,
        resolved_at: null
      },
      {
        id: "cmt_demo_3",
        project_id: projectId,
        video_version_id: v1,
        user_id: DEMO_PROFILES.brand,
        timestamp_seconds: 7,
        comment_text: "Music bed too quiet under VO.",
        status: "resolved",
        created_at: t,
        resolved_at: t
      }
    ]
  };
}

let storeInitPromise: Promise<MvpStore> | null = null;

async function ensureStoreDir() {
  await fs.mkdir(STORE_DIR, { recursive: true });
}

async function writeStore(store: MvpStore) {
  await ensureStoreDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

async function initStoreIfMissing(): Promise<MvpStore> {
  await ensureStoreDir();
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as MvpStore;
  } catch {
    const seeded = seedStore();
    await writeStore(seeded);
    return seeded;
  }
}

async function readStore(): Promise<MvpStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as MvpStore;
  } catch {
    if (!storeInitPromise) {
      storeInitPromise = initStoreIfMissing().finally(() => {
        storeInitPromise = null;
      });
    }
    return storeInitPromise;
  }
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
  const store = await readStore();
  const project = store.projects.find((p) => p.id === id);
  if (!project) return null;
  project.status = status;
  project.updated_at = nowIso();
  await writeStore(store);
  return project;
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
  if (project) {
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
}): Promise<VideoComment> {
  const store = await readStore();
  const comment: VideoComment = {
    id: createId("cmt"),
    project_id: input.project_id,
    video_version_id: input.video_version_id,
    user_id: input.user_id,
    timestamp_seconds: Math.max(0, input.timestamp_seconds),
    comment_text: input.comment_text.trim(),
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
