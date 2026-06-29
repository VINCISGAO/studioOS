export type CreatorNotificationType = "creator_selected" | "project_funded";

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
};
