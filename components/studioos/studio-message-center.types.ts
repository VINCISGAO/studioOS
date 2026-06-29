export type MessageNotificationType = "creator_selected" | "project_funded";

export type BriefField = {
  section: string;
  label: string;
  value: string;
};

export type ProgressStep = {
  id: string;
  title: string;
  subtitle: string;
  state: "done" | "current" | "upcoming";
  timestamp?: string;
};

export type MessageAttachment = {
  id: string;
  name: string;
  size: string;
  url: string;
  mimeType: string;
};

export type MessageDetailPayload = {
  notificationId: string;
  type: MessageNotificationType;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  orderId: string | null;
  projectId: string | null;
  projectTitle: string;
  formId: string;
  fields: BriefField[];
  attachments: MessageAttachment[];
  briefPdfUrl: string;
  progressSteps: ProgressStep[];
  projectHref: string | null;
};

export type MessageListItem = {
  id: string;
  type: MessageNotificationType;
  title: string;
  preview: string;
  createdAt: string;
  readAt: string | null;
  orderId: string | null;
};
