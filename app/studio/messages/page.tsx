import { redirect } from "next/navigation";
import { StudioMessageCenter } from "@/components/studioos/studio-message-center";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { listNotificationsForCreator } from "@/lib/notification-service";
import { getOrder } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { getConfirmedBriefFields } from "@/lib/studioos/confirmed-brief";
import { resolveCreatorNotificationAction } from "@/lib/studioos/commercial-notification-routes";
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
  const action = resolveCreatorNotificationAction(
    {
      type: notification.type,
      order_id: notification.order_id,
      project_id: projectId
    },
    locale
  );

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
    actionHref: action.href,
    actionLabel: action.label
  };
}

async function buildMessageCenterPayload(notifications: CreatorNotification[], locale: Locale) {
  const details = await Promise.all(notifications.map((item) => buildMessageDetail(item, locale)));
  const list: MessageListItem[] = notifications.map((notification, index) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    preview: notification.body,
    createdAt: notification.created_at,
    readAt: notification.read_at,
    orderId: notification.order_id,
    actionHref: details[index]?.actionHref ?? withLocale("/studio/messages", locale),
    actionLabel: details[index]?.actionLabel ?? (locale === "zh" ? "查看" : "Open")
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
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
          {locale === "zh" ? "消息中心" : "Messages"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {locale === "zh" ? "项目消息、品牌消息与系统通知。" : "Project, brand, and system notifications."}
        </p>
      </header>
      <StudioMessageCenter
        locale={locale}
        list={payload.list}
        details={payload.details}
        initialSelectedId={initialSelectedId}
      />
    </div>
  );
}
