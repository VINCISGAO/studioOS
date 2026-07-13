import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { StudioMessageCenter } from "@/components/studioos/studio-message-center";
import type { MessageDetailPayload, MessageListItem } from "@/components/studioos/studio-message-center.types";
import { notificationService } from "@/features/notification/notification.service";
import { getSessionUser } from "@/features/auth/session.service";
import { getCurrentCreator } from "@/features/auth/session-context";
import { type SearchParams, withLocale } from "@/lib/i18n";
import type { CreatorNotification } from "@/lib/notification-types";
import { listNotificationsForCreator } from "@/lib/notification-service";
import { listInvitationsForCreator } from "@/lib/studioos/creator-invitation-store";
import { getOrder, listOrdersForCreator } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { resolveCreatorNotificationAction } from "@/lib/studioos/commercial-notification-routes";
import { getCertificationFormForMessage } from "@/lib/studioos/certification-form-service";
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
import { enforceBrandPaymentDeadlinesForCreator } from "@/lib/studioos/brand-payment-expiry.service";
import { ensureCreatorAssignmentNotificationsForOrders } from "@/lib/studioos/creator-assignment-notify";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { normalizeInternalActionHref } from "@/lib/studioos/internal-action-href";
import type { Locale } from "@/lib/i18n";

const CERTIFICATION_MESSAGE_PROJECT_KEY = "certification_onboarding";

const PROJECT_THUMBNAILS: Record<string, string> = {
  ntf_demo_nike_work_selected:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop",
  ntf_demo_arc_selected:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop",
  ntf_demo_arc_funded:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop"
};

type UnifiedNotificationItem = Awaited<ReturnType<typeof notificationService.listForUser>>["items"][number];

function metadataRecord(metadata: unknown): Record<string, unknown> {
  return typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>)
    : {};
}

function stringFromMetadata(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function messageCategoryFromUnified(item: UnifiedNotificationItem) {
  if (item.category === "PAYMENT" || item.category === "SETTLEMENT") return "payment" as const;
  if (item.category === "SYSTEM" || item.category === "MEMBERSHIP" || item.category === "AI") return "system" as const;
  if (item.category === "INVITATION" || item.category === "MATCHING" || item.category === "COLLABORATION") return "brand" as const;
  return "project" as const;
}

function buildUnifiedMessageCenterPayload(
  notifications: UnifiedNotificationItem[],
  creatorName: string,
  locale: Locale
) {
  const details: MessageDetailPayload[] = notifications.map((notification) => {
    const metadata = metadataRecord(notification.metadata);
    const category = messageCategoryFromUnified(notification);
    const projectId =
      notification.campaignId ??
      stringFromMetadata(metadata, ["projectId", "project_id", "legacyProjectId", "legacy_project_id"]);
    const orderId = stringFromMetadata(metadata, ["orderId", "order_id"]);
    const senderName =
      category === "system"
        ? locale === "zh"
          ? "VINCIS 系统"
          : "VINCIS System"
        : senderDisplayName(
            stringFromMetadata(metadata, ["brandName", "companyName", "company_name", "clientName"]) ??
              (locale === "zh" ? "品牌方" : "Brand"),
            locale
          );
    const actionHref = normalizeInternalActionHref(
      notification.actionUrl,
      locale,
      withLocale("/studio/messages", locale)
    );
    const projectTitle =
      stringFromMetadata(metadata, ["projectTitle", "campaignTitle", "title"]) ?? notification.title;

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
      body: notification.content,
      createdAt: notification.createdAt,
      detailTimeLabel: formatMessageDetailTime(notification.createdAt, locale),
      readAt: notification.readAt,
      orderId,
      projectId,
      projectTitle,
      formId: buildProjectCode(projectId),
      fields: [],
      attachments: [],
      briefPdfUrl: projectId ? `/api/projects/${projectId}/brief.pdf?lang=${locale}` : "",
      progressSteps: [],
      projectInfo: projectId
        ? {
            title: projectTitle,
            code: buildProjectCode(projectId),
            stage: locale === "zh" ? "通知事件" : "Notification event",
            thumbnailUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop",
            href: actionHref
          }
        : null,
      nextStep: buildMessageNextStep(notification.type, locale),
      actionHref,
      actionLabel: locale === "zh" ? "查看" : "Open",
      replyHref: actionHref,
      replyLabel: locale === "zh" ? "查看详情" : "View details"
    };
  });

  const list: MessageListItem[] = details.map((detail) => ({
    id: detail.notificationId,
    type: detail.type,
    category: detail.category,
    senderName: detail.senderName,
    senderInitials: detail.senderInitials,
    senderAvatarTone: detail.senderAvatarTone,
    title: detail.title,
    preview: detail.body,
    createdAt: detail.createdAt,
    timeLabel: formatMessageListTime(detail.createdAt, locale),
    readAt: detail.readAt,
    orderId: detail.orderId,
    actionHref: detail.actionHref,
    actionLabel: detail.actionLabel
  }));

  return { list, details };
}

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
  const isCertificationMessage = notification.type === "certification_approved";
  const project = !isCertificationMessage && notification.project_id
    ? await getProject(notification.project_id)
    : null;
  const order = notification.order_id ? await getOrder(notification.order_id) : null;
  const projectId =
    isCertificationMessage || notification.project_id === CERTIFICATION_MESSAGE_PROJECT_KEY
      ? null
      : notification.project_id ?? order?.project_id ?? null;
  const resolvedProject = project ?? (projectId ? await getProject(projectId) : null);

  const fields = resolvedProject ? getConfirmedBriefFields(resolvedProject, locale) : [];
  const certificationForm = isCertificationMessage
    ? await getCertificationFormForMessage(notification.id, notification.creator_id, locale)
    : null;
  const certificationFields = certificationForm?.fields ?? fields;
  const projectTitle = isCertificationMessage
    ? creatorName
    : resolvedProject?.title || order?.title || notification.company_name || notification.title;
  const briefPdfUrl = projectId ? `/api/projects/${projectId}/brief.pdf?lang=${locale}` : "";
  const action = resolveCreatorNotificationAction(
    {
      type: notification.type,
      order_id: notification.order_id,
      project_id: projectId
    },
    locale
  );
  const profileSetupHref = withLocale(`${creatorPortalRoutes.works}?onboarding=1`, locale);
  const category = messageCategoryFromType(notification.type);
  const senderName = isCertificationMessage
    ? locale === "zh"
      ? "VINCIS 系统"
      : "VINCIS System"
    : senderDisplayName(notification.company_name, locale);
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
    formId: certificationForm?.form_id ?? projectCode,
    fields: certificationFields,
    attachments: projectId ? [fallbackBrandGuideAttachment(projectId, locale)] : [],
    briefPdfUrl,
    progressSteps,
    projectInfo: isCertificationMessage
      ? null
      : demoProjectInfo ??
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
    actionHref: isCertificationMessage ? profileSetupHref : demoActionHref,
    actionLabel: isCertificationMessage
      ? locale === "zh"
        ? "完善创作者主页"
        : "Complete studio profile"
      : locale === "zh"
        ? notification.type === "escrow_released"
          ? "查看收益"
          : "查看项目"
        : notification.type === "escrow_released"
          ? "View income"
          : "View project",
    replyHref: isCertificationMessage ? profileSetupHref : demoActionHref,
    replyLabel: isCertificationMessage
      ? locale === "zh"
        ? "前往完善主页"
        : "Go to profile setup"
      : locale === "zh"
        ? "回复品牌方"
        : "Reply to brand"
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
  const locale = await getAppUiLocale();
  const creator = await getCurrentCreator();

  if (!creator) {
    redirect(withLocale("/login?role=creator", locale));
  }

  await enforceBrandPaymentDeadlinesForCreator(creator.id);
  await listInvitationsForCreator(creator.id, locale);
  const orders = await listOrdersForCreator(creator.id);
  await ensureCreatorAssignmentNotificationsForOrders({
    creatorId: creator.id,
    orders,
    locale
  });
  const sessionUser = await getSessionUser();
  if (sessionUser && !sessionUser.id.startsWith("demo_")) {
    try {
      const unified = await notificationService.listForUser(
        { id: sessionUser.id, role: sessionUser.role },
        200
      );
      const payload = buildUnifiedMessageCenterPayload(unified.items, creator.name, locale);
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
    } catch {
      // Fall back to the legacy creator notification store when the database notification center is unavailable.
    }
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
