export type MvpRole = "brand" | "studio" | "admin";

export type ProjectStatus = "draft" | "in_review" | "revision" | "approved" | "delivered";

export type CommentStatus = "open" | "resolved" | "reopened";

export type MvpProfile = {
  id: string;
  email: string;
  role: MvpRole;
  name: string;
  company_name: string;
  created_at: string;
};

export type ReviewProject = {
  id: string;
  title: string;
  description: string;
  brand_name: string;
  status: ProjectStatus;
  created_by: string;
  assigned_studio_id: string | null;
  created_at: string;
  updated_at: string;
};

export type VideoVersion = {
  id: string;
  project_id: string;
  version_number: number;
  file_url: string;
  file_path: string;
  uploaded_by: string;
  created_at: string;
};

export type VideoComment = {
  id: string;
  project_id: string;
  video_version_id: string;
  user_id: string;
  timestamp_seconds: number;
  comment_text: string;
  status: CommentStatus;
  created_at: string;
  resolved_at: string | null;
};

export type MvpStore = {
  profiles: MvpProfile[];
  projects: ReviewProject[];
  versions: VideoVersion[];
  comments: VideoComment[];
};

export type ProjectWithMeta = ReviewProject & {
  latest_version: number | null;
  open_issues: number;
  resolved_issues: number;
  total_issues: number;
};

export type ReviewBundle = {
  project: ReviewProject;
  versions: VideoVersion[];
  comments: VideoComment[];
  profiles: Record<string, MvpProfile>;
};
