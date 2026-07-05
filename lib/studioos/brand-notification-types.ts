export type BrandNotificationType =
  | "invitation_accepted"
  | "invitation_declined"
  | "deliverable_uploaded"
  | "comment_resolved"
  | "requirement_published"
  | "payment_required"
  | "paid_revision_unlocked"
  | "order_completed"
  | "final_download_ready";

export type BrandNotification = {
  id: string;
  brand_email: string;
  type: BrandNotificationType;
  title: string;
  body: string;
  project_id: string;
  creator_id: string;
  creator_name: string;
  order_id?: string | null;
  deliverable_version?: number | null;
  comment_id?: string | null;
  read_at: string | null;
  created_at: string;
};

export type BrandNotificationStore = {
  notifications: BrandNotification[];
};
