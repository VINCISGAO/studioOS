export type MvpRole = "brand" | "studio" | "admin";

export type ProjectStatus =
  | "draft"
  | "in_review"
  | "revision"
  | "pending_settlement"
  | "settled"
  /** @deprecated use pending_settlement */
  | "approved"
  | "delivered";

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
  /** Brand approved the review cut; escrow not yet released. */
  review_approved_at?: string | null;
  /** Escrow released / payment confirmed. */
  settled_at?: string | null;
  /** Watermark-free master — only after settlement. */
  master_file_url?: string | null;
  master_file_name?: string | null;
  master_uploaded_at?: string | null;
};

export type VideoVersion = {
  id: string;
  project_id: string;
  version_number: number;
  file_url: string;
  file_path: string;
  hls_url?: string | null;
  uploaded_by: string;
  created_at: string;
};

export type AnnotationType = "circle" | "arrow" | "rect" | "text" | "pin";

export type VideoComment = {
  id: string;
  project_id: string;
  video_version_id: string;
  user_id: string;
  timestamp_seconds: number;
  comment_text: string;
  annotation_type?: AnnotationType | null;
  /** Normalized 0–1, top-left of bounding box */
  pos_x?: number | null;
  pos_y?: number | null;
  width?: number | null;
  height?: number | null;
  color?: string | null;
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
