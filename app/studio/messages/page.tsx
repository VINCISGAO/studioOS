import { redirect } from "next/navigation";
import { StudioMessageCenter } from "@/components/studioos/studio-message-center";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { listNotificationsForCreator } from "@/lib/notification-service";
import { getOrder } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { getConfirmedBriefFields } from "@/lib/studioos/confirmed-brief";
import { buildMessageProgressSteps } from "@/lib/studioos/message-order-progress";
import type { MessageDetailPayload, MessageListItem } from "@/components/studioos/studio-message-center.types";
import type { CreatorNotification } from "@/lib/notification-types";
import type { Locale } from "@/lib/i18n";

function fallbackBrandGuideAttachment(projectId: string, locale: Locale) {
  return {
    id: "brand_guide_demo",
    name: "Brand_Guideline_ArcAlloy.pdf",
    size: "2.4 MB",
    url: `/api/projects/${projectId}/brief.pdf?lang=${locale}&download=1`,
    mimeType: "application/pdf"
  };
}

async function buildMessageDetail(
  notification: CreatorNotification,
  locale: Locale
): Promise<MessageDetailPayload> {
  const project = notification.project_id ? await getProject(notification.project_id) : null;
  const order = notification.order_id ? await getOrder(notification.order_id) : null;
  const projectId = notification.project_id ?? order?.project_id ?? null;
  const resolvedProject = project ?? (projectId ? await getProject(projectId) : null);

  const fields = resolvedProject ? getConfirmedBriefFields(resolvedProject, locale) : [];
  const projectTitle =
    resolvedProject?.title || order?.title || notification.company_name || notification.title;
  const briefPdfUrl = projectId ? `/api/projects/${projectId}/brief.pdf?lang=${locale}` : "";

  return {
    notificationId: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    createdAt: notification.created_at,
    readAt: notification.read_at,
    orderId: notification.order_id,
    projectId,
    projectTitle,
    formId: projectId ? projectId.slice(-10).toUpperCase() : "—",
    fields,
    attachments: projectId ? [fallbackBrandGuideAttachment(projectId, locale)] : [],
    briefPdfUrl,
    progressSteps: buildMessageProgressSteps(order, notification.type, locale),
    projectHref: notification.order_id
      ? withLocale(`/studio/projects/${notification.order_id}`, locale)
      : null
  };
}

async function buildMessageCenterPayload(notifications: CreatorNotification[], locale: Locale) {
  const details = await Promise.all(notifications.map((item) => buildMessageDetail(item, locale)));
  const list: MessageListItem[] = notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    preview: notification.body,
    createdAt: notification.created_at,
    readAt: notification.read_at,
    orderId: notification.order_id
  }));
  return { list, details };
}

export default async function StudioMessagesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const locale = getLocale(query);
  const creator = await getCurrentCreator();

  if (!creator) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const notifications = await listNotificationsForCreator(creator.id, locale);
  const payload = await buildMessageCenterPayload(notifications, locale);
  const initialSelectedId =
    typeof query.id === "string" && payload.list.some((item) => item.id === query.id)
      ? query.id
      : payload.list[0]?.id ?? null;

  return (
    <StudioMessageCenter
      locale={locale}
      list={payload.list}
      details={payload.details}
      initialSelectedId={initialSelectedId}
    />
  );
}
