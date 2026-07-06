export type MessageNotificationType = string;

export type MessageCategory = "project" | "brand" | "payment" | "system";

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

export type MessageProjectInfo = {
  title: string;
  code: string;
  stage: string;
  thumbnailUrl: string;
  href: string;
};

export type MessageDetailPayload = {
  notificationId: string;
  type: MessageNotificationType;
  category: MessageCategory;
  categoryLabel: string;
  senderName: string;
  senderInitials: string;
  senderAvatarTone: string;
  title: string;
  detailTitle: string;
  salutation: string;
  body: string;
  createdAt: string;
  detailTimeLabel: string;
  readAt: string | null;
  orderId: string | null;
  projectId: string | null;
  projectTitle: string;
  formId: string;
  fields: BriefField[];
  attachments: MessageAttachment[];
  briefPdfUrl: string;
  progressSteps: ProgressStep[];
  projectInfo: MessageProjectInfo | null;
  nextStep?: {
    title: string;
    body: string;
  };
  actionHref: string;
  actionLabel: string;
  replyHref: string;
  replyLabel: string;
};

export type MessageListItem = {
  id: string;
  type: MessageNotificationType;
  category: MessageCategory;
  senderName: string;
  senderInitials: string;
  senderAvatarTone: string;
  title: string;
  preview: string;
  createdAt: string;
  timeLabel: string;
  readAt: string | null;
  orderId: string | null;
  actionHref: string;
  actionLabel: string;
};
