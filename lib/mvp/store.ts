import { hasSupabaseConfig } from "@/lib/auth-config";
import { createClient } from "@/lib/supabase/server";
import type {
  CommentStatus,
  MvpProfile,
  ProjectStatus,
  ProjectWithMeta,
  ReviewBundle,
  ReviewProject,
  VideoComment,
  VideoVersion
} from "@/lib/mvp/types";
import * as file from "@/lib/mvp/store-file";

function enrichProject(
  project: ReviewProject,
  versions: VideoVersion[],
  comments: VideoComment[]
): ProjectWithMeta {
  const projectVersions = versions.filter((v) => v.project_id === project.id);
  const projectComments = comments.filter((c) => c.project_id === project.id);
  const latest = projectVersions.reduce((max, v) => Math.max(max, v.version_number), 0);
  return {
    ...project,
    latest_version: latest || null,
    open_issues: projectComments.filter((c) => c.status === "open" || c.status === "reopened").length,
    resolved_issues: projectComments.filter((c) => c.status === "resolved").length,
    total_issues: projectComments.length
  };
}

export async function listStudios(): Promise<MvpProfile[]> {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("*").eq("role", "studio");
    return (data ?? []) as MvpProfile[];
  }
  return file.fileListStudios();
}

export async function getProject(id: string): Promise<ReviewProject | null> {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    const { data } = await supabase.from("review_projects").select("*").eq("id", id).single();
    return (data as ReviewProject) ?? null;
  }
  return file.fileGetProject(id);
}

export async function listBrandProjects(brandId: string): Promise<ProjectWithMeta[]> {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    const { data: projects } = await supabase
      .from("review_projects")
      .select("*")
      .eq("created_by", brandId)
      .order("updated_at", { ascending: false });
    const { data: versions } = await supabase.from("video_versions").select("*");
    const { data: comments } = await supabase.from("video_comments").select("*");
    return (projects ?? []).map((p) =>
      enrichProject(p as ReviewProject, (versions ?? []) as VideoVersion[], (comments ?? []) as VideoComment[])
    );
  }
  const projects = await file.fileListProjectsForBrand(brandId);
  const allVersions = await Promise.all(projects.map((p) => file.fileListVersions(p.id)));
  const allComments = await Promise.all(projects.map((p) => file.fileListComments(p.id)));
  const flatVersions = allVersions.flat();
  const flatComments = allComments.flat();
  return projects.map((p) => enrichProject(p, flatVersions, flatComments));
}

export async function listStudioProjects(studioId: string): Promise<ProjectWithMeta[]> {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    const { data: projects } = await supabase
      .from("review_projects")
      .select("*")
      .eq("assigned_studio_id", studioId)
      .order("updated_at", { ascending: false });
    const { data: versions } = await supabase.from("video_versions").select("*");
    const { data: comments } = await supabase.from("video_comments").select("*");
    return (projects ?? []).map((p) =>
      enrichProject(p as ReviewProject, (versions ?? []) as VideoVersion[], (comments ?? []) as VideoComment[])
    );
  }
  const projects = await file.fileListProjectsForStudio(studioId);
  const flatVersions = (await Promise.all(projects.map((p) => file.fileListVersions(p.id)))).flat();
  const flatComments = (await Promise.all(projects.map((p) => file.fileListComments(p.id)))).flat();
  return projects.map((p) => enrichProject(p, flatVersions, flatComments));
}

export async function listAllProjects(): Promise<ProjectWithMeta[]> {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    const { data: projects } = await supabase.from("review_projects").select("*").order("updated_at", {
      ascending: false
    });
    const { data: versions } = await supabase.from("video_versions").select("*");
    const { data: comments } = await supabase.from("video_comments").select("*");
    return (projects ?? []).map((p) =>
      enrichProject(p as ReviewProject, (versions ?? []) as VideoVersion[], (comments ?? []) as VideoComment[])
    );
  }
  const projects = await file.fileListAllProjects();
  const flatVersions = (await Promise.all(projects.map((p) => file.fileListVersions(p.id)))).flat();
  const flatComments = (await Promise.all(projects.map((p) => file.fileListComments(p.id)))).flat();
  return projects.map((p) => enrichProject(p, flatVersions, flatComments));
}

export async function createProject(input: {
  title: string;
  description: string;
  brand_name: string;
  created_by: string;
  assigned_studio_id: string | null;
}): Promise<ReviewProject> {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("review_projects")
      .insert({
        title: input.title,
        description: input.description,
        brand_name: input.brand_name,
        created_by: input.created_by,
        assigned_studio_id: input.assigned_studio_id,
        status: input.assigned_studio_id ? "in_review" : "draft"
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as ReviewProject;
  }
  return file.fileCreateProject(input);
}

export async function updateProjectStatus(id: string, status: ProjectStatus): Promise<ReviewProject | null> {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("review_projects")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    return (data as ReviewProject) ?? null;
  }
  return file.fileUpdateProjectStatus(id, status);
}

export async function getReviewBundle(projectId: string): Promise<ReviewBundle | null> {
  const project = await getProject(projectId);
  if (!project) return null;

  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    const [{ data: versions }, { data: comments }, { data: profiles }] = await Promise.all([
      supabase.from("video_versions").select("*").eq("project_id", projectId).order("version_number"),
      supabase.from("video_comments").select("*").eq("project_id", projectId).order("timestamp_seconds"),
      supabase.from("profiles").select("*")
    ]);
    const profileMap: Record<string, MvpProfile> = {};
    for (const p of profiles ?? []) {
      profileMap[p.id] = p as MvpProfile;
    }
    return {
      project,
      versions: (versions ?? []) as VideoVersion[],
      comments: (comments ?? []) as VideoComment[],
      profiles: profileMap
    };
  }

  const [versions, comments, profiles] = await Promise.all([
    file.fileListVersions(projectId),
    file.fileListComments(projectId),
    file.fileListProfiles()
  ]);
  const profileMap: Record<string, MvpProfile> = {};
  for (const p of profiles) profileMap[p.id] = p;
  return { project, versions, comments, profiles: profileMap };
}

export async function addVideoVersion(input: {
  project_id: string;
  file_url: string;
  file_path: string;
  uploaded_by: string;
}): Promise<VideoVersion> {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("video_versions")
      .select("version_number")
      .eq("project_id", input.project_id);
    const nextNum = (existing?.length ?? 0) + 1;
    const { data, error } = await supabase
      .from("video_versions")
      .insert({
        project_id: input.project_id,
        version_number: nextNum,
        file_url: input.file_url,
        file_path: input.file_path,
        uploaded_by: input.uploaded_by
      })
      .select("*")
      .single();
    if (error) throw error;
    await updateProjectStatus(input.project_id, "in_review");
    return data as VideoVersion;
  }
  return file.fileAddVersion(input);
}

export async function addComment(input: {
  project_id: string;
  video_version_id: string;
  user_id: string;
  timestamp_seconds: number;
  comment_text: string;
}): Promise<VideoComment> {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("video_comments")
      .insert({
        project_id: input.project_id,
        video_version_id: input.video_version_id,
        user_id: input.user_id,
        timestamp_seconds: input.timestamp_seconds,
        comment_text: input.comment_text,
        status: "open"
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as VideoComment;
  }
  return file.fileAddComment(input);
}

export async function setCommentStatus(commentId: string, status: CommentStatus): Promise<VideoComment | null> {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("video_comments")
      .update({
        status,
        resolved_at: status === "resolved" ? new Date().toISOString() : null
      })
      .eq("id", commentId)
      .select("*")
      .single();
    return (data as VideoComment) ?? null;
  }
  return file.fileSetCommentStatus(commentId, status);
}

export async function getAdminStats() {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    const [users, projects, videos, comments] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("review_projects").select("*", { count: "exact", head: true }),
      supabase.from("video_versions").select("*", { count: "exact", head: true }),
      supabase.from("video_comments").select("*", { count: "exact", head: true })
    ]);
    return {
      users: users.count ?? 0,
      projects: projects.count ?? 0,
      videos: videos.count ?? 0,
      comments: comments.count ?? 0
    };
  }
  return file.fileCountAll();
}

export { fileSaveLocalVideo } from "@/lib/mvp/store-file";

export async function uploadToSupabaseStorage(
  projectId: string,
  versionNumber: number,
  file: File
): Promise<{ file_url: string; file_path: string }> {
  const supabase = await createClient();
  const ext = "mp4";
  const filePath = `${projectId}/v${versionNumber}_${Date.now()}.${ext}`;
  const buffer = await file.arrayBuffer();
  const { error } = await supabase.storage.from("review-videos").upload(filePath, buffer, {
    contentType: "video/mp4",
    upsert: false
  });
  if (error) throw error;
  const { data } = supabase.storage.from("review-videos").getPublicUrl(filePath);
  return { file_url: data.publicUrl, file_path: filePath };
}
