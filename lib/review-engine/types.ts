export type ReviewSessionStatus =
  | "pending_upload"
  | "uploading"
  | "transcoding"
  | "ready_for_review"
  | "changes_requested"
  | "approved"
  | "failed";

export type ReviewSession = {
  id: string;
  campaign_id: string;
  order_id: string;
  creator_id: string;
  brand_id: string;
  title: string;
  version_notes?: string;

  frame_project_id: string | null;
  frame_folder_id: string | null;
  frame_asset_id: string | null;
  frame_review_link: string | null;

  version_number: number;
  status: ReviewSessionStatus;

  created_at: string;
  updated_at: string;
};

export type ReviewEvent = {
  id: string;
  review_session_id: string;
  frame_event_type: string;
  frame_payload: Record<string, unknown>;
  created_at: string;
};

export type ReviewEngineStore = {
  sessions: ReviewSession[];
  events: ReviewEvent[];
};

export const REVIEW_SESSION_STATUSES: ReviewSessionStatus[] = [
  "pending_upload",
  "uploading",
  "transcoding",
  "ready_for_review",
  "changes_requested",
  "approved",
  "failed"
];

export function reviewSessionStatusLabel(status: ReviewSessionStatus, locale: "en" | "zh") {
  const labels: Record<ReviewSessionStatus, { en: string; zh: string }> = {
    pending_upload: { en: "Awaiting upload", zh: "待上传" },
    uploading: { en: "Uploading", zh: "上传中" },
    transcoding: { en: "Processing", zh: "转码中" },
    ready_for_review: { en: "Ready for review", zh: "可审片" },
    changes_requested: { en: "Changes requested", zh: "需修改" },
    approved: { en: "Approved", zh: "已通过" },
    failed: { en: "Failed", zh: "失败" }
  };
  return labels[status][locale];
}
