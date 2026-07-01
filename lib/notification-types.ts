export type CreatorNotificationType =
  | "invitation_match"
  | "certification_approved"
  | "creator_selected"
  | "project_funded"
  | "order_cancelled_unpaid"
  | "review_comment_added"
  | "revision_requested"
  | "delivery_approved"
  | "escrow_released"
  | "not_selected";

export type CreatorNotification = {
  id: string;
  creator_id: string;
  type: CreatorNotificationType;
  title: string;
  body: string;
  project_id: string | null;
  order_id: string | null;
  client_name: string;
  company_name: string;
  requirements_text: string;
  read_at: string | null;
  email_sent_at: string | null;
  created_at: string;
};

export type NotificationStore = {
  notifications: CreatorNotification[];
  /** Demo notification ids suppressed after reset — same pattern as order-store. */
  dismissed_demo_ids?: string[];
};
