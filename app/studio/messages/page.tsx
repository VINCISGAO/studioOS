import { redirect } from "next/navigation";
import { StudioMessageCenter } from "@/components/studioos/studio-message-center";
import type { MessageDetailPayload, MessageListItem } from "@/components/studioos/studio-message-center.types";
import { getCurrentCreator } from "@/lib/creator-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import type { CreatorNotification } from "@/lib/notification-types";
import { listNotificationsForCreator } from "@/lib/notification-service";
import { getOrder } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { resolveCreatorNotificationAction } from "@/lib/studioos/commercial-notification-routes";
import { getConfirmedBriefFields } from "@/lib/studioos/confirmed-brief";
import {
  buildMessageNextStep,
  buildMessageProjectStage,
  buildMessageSalutation,
  buildProjectCode,
  formatMessageDetailTime,
  formatMessageListTime,
  messageCategoryFromType,
  messageCategoryLabel,
  senderAvatarTone,
  senderDisplayName,
  senderInitials
} from "@/lib/studioos/creator-messages-ui";
import { buildMessageProgressSteps } from "@/lib/studioos/message-order-progress";
import type { Locale } from "@/lib/i18n";

const PROJECT_THUMBNAILS: Record<string, string> = {
  ntf_demo_nike_work_selected:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop",
  ntf_demo_arc_selected:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop",
  ntf_demo_arc_funded:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop"
};

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
  creatorName: string,
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
  const category = messageCategoryFromType(notification.type);
  const senderName = senderDisplayName(notification.company_name, locale);
  const progressSteps = buildMessageProgressSteps(order, notification.type, locale);
  const projectCode = buildProjectCode(projectId);
  const demoProjectInfo =
    notification.id === "ntf_demo_nike_work_selected"
      ? {
          title: locale === "zh" ? "Nike 春季新品广告" : "Nike Spring Launch Ad",
          code: "CAM-2026-0601",
          stage: locale === "zh" ? "制作中 · 第一版" : "In production · V1",
          thumbnailUrl: PROJECT_THUMBNAILS.ntf_demo_nike_work_selected,
          href: withLocale("/studio/projects", locale)
        }
      : null;
  const demoActionHref =
    notification.id === "ntf_demo_nike_work_selected"
      ? withLocale("/studio/projects", locale)
      : action.href;

  return {
    notificationId: notification.id,
    type: notification.type,
    category,
    categoryLabel: messageCategoryLabel(category, locale),
    senderName,
    senderInitials: senderInitials(senderName),
    senderAvatarTone: senderAvatarTone(senderName),
    title: notification.title,
    detailTitle: notification.title,
    salutation: buildMessageSalutation(creatorName, locale),
    body: notification.body,
    createdAt: notification.created_at,
    detailTimeLabel: formatMessageDetailTime(notification.created_at, locale),
    readAt: notification.read_at,
    orderId: notification.order_id,
    projectId,
    projectTitle,
    formId: projectCode,
    fields,
    attachments: projectId ? [fallbackBrandGuideAttachment(projectId, locale)] : [],
    briefPdfUrl,
    progressSteps,
    projectInfo:
      demoProjectInfo ??
      (projectId
        ? {
            title: projectTitle,
            code: projectCode,
            stage: buildMessageProjectStage(progressSteps, locale),
            thumbnailUrl:
              PROJECT_THUMBNAILS[notification.id] ??
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop",
            href: action.href
          }
        : null),
    nextStep: buildMessageNextStep(notification.type, locale),
    actionHref: demoActionHref,
    actionLabel:
      locale === "zh"
        ? notification.type === "escrow_released"
          ? "查看收益"
          : "查看项目"
        : notification.type === "escrow_released"
          ? "View income"
          : "View project",
    replyHref: demoActionHref,
    replyLabel: locale === "zh" ? "回复品牌方" : "Reply to brand"
  };
}

async function buildMessageCenterPayload(
  notifications: CreatorNotification[],
  creatorName: string,
  locale: Locale
) {
  const details = await Promise.all(
    notifications.map((item) => buildMessageDetail(item, creatorName, locale))
  );
  const list: MessageListItem[] = notifications.map((notification, index) => {
    const detail = details[index];
    const senderName = detail?.senderName ?? senderDisplayName(notification.company_name, locale);
    return {
      id: notification.id,
      type: notification.type,
      category: detail?.category ?? messageCategoryFromType(notification.type),
      senderName,
      senderInitials: senderInitials(senderName),
      senderAvatarTone: senderAvatarTone(senderName),
      title: notification.title,
      preview: notification.body,
      createdAt: notification.created_at,
      timeLabel: formatMessageListTime(notification.created_at, locale),
      readAt: notification.read_at,
      orderId: notification.order_id,
      actionHref: detail?.actionHref ?? withLocale("/studio/messages", locale),
      actionLabel: detail?.actionLabel ?? (locale === "zh" ? "查看" : "Open")
    };
  });
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
  const payload = await buildMessageCenterPayload(notifications, creator.name, locale);
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
