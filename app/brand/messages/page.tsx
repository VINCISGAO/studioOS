import { cookies } from "next/headers";
import { Suspense } from "react";
import {
  deleteBrandNotificationsAction,
  markBrandNotificationReadAction,
  markBrandNotificationsReadAction
} from "@/app/brand-notification-actions";
import { StudioMessageCenter } from "@/components/studioos/studio-message-center";
import type { MessageDetailPayload, MessageListItem } from "@/components/studioos/studio-message-center.types";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { getCurrentClientEmail } from "@/lib/client-session";
import { DEMO_USERS, parseDemoSession } from "@/lib/demo-auth";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getOrder } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import type { BrandNotification } from "@/lib/studioos/brand-notification-types";
import { listNotificationsForBrand } from "@/lib/studioos/brand-notification-service";
import {
  brandMessageCategoryFromType,
  brandMessageCategoryLabel,
  brandSenderAvatarTone,
  brandSenderDisplayName,
  brandSenderInitials,
  buildBrandMessageNextStep,
  buildBrandMessageSalutation,
  buildBrandMessageStatCards,
  buildMessageProjectStage,
  buildProjectCode,
  countMessagesByCategory,
  formatMessageDetailTime,
  formatMessageListTime
} from "@/lib/studioos/brand-messages-ui";
import { resolveBrandNotificationAction } from "@/lib/studioos/commercial-notification-routes";
import { getConfirmedBriefFields } from "@/lib/studioos/confirmed-brief";
import { buildBrandMessageProgressSteps } from "@/lib/studioos/message-order-progress";
import type { Locale } from "@/lib/i18n";

const DEFAULT_PROJECT_THUMB =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop";

function resolveBrandName(email: string | null) {
  if (!email) return "Brand";
  const demoUser = DEMO_USERS.find((user) => user.email === email.toLowerCase());
  return demoUser?.label.replace(/\s*\(brand\)/i, "").trim() ?? email.split("@")[0] ?? "Brand";
}

async function buildBrandMessageDetail(
  notification: BrandNotification,
  brandName: string,
  locale: Locale
): Promise<MessageDetailPayload> {
  const project = await getProject(notification.project_id);
  const order = notification.order_id ? await getOrder(notification.order_id) : null;
  const action = resolveBrandNotificationAction(notification, locale);
  const category = brandMessageCategoryFromType(notification.type);
  const senderName = brandSenderDisplayName(notification.creator_name, locale);
  const progressSteps = buildBrandMessageProgressSteps(project, order, notification.type, locale);
  const projectCode = buildProjectCode(notification.project_id);
  const fields = project ? getConfirmedBriefFields(project, locale) : [];
  const projectTitle = project?.title ?? notification.title;

  return {
    notificationId: notification.id,
    type: notification.type,
    category,
    categoryLabel: brandMessageCategoryLabel(category, locale),
    senderName,
    senderInitials: brandSenderInitials(senderName),
    senderAvatarTone: brandSenderAvatarTone(senderName),
    title: notification.title,
    detailTitle: notification.title,
    salutation: buildBrandMessageSalutation(brandName, locale),
    body: notification.body,
    createdAt: notification.created_at,
    detailTimeLabel: formatMessageDetailTime(notification.created_at, locale),
    readAt: notification.read_at,
    orderId: notification.order_id ?? null,
    projectId: notification.project_id,
    projectTitle,
    formId: projectCode,
    fields,
    attachments: [],
    briefPdfUrl: project ? `/api/projects/${notification.project_id}/brief.pdf?lang=${locale}` : "",
    progressSteps,
    projectInfo: {
      title: projectTitle,
      code: projectCode,
      stage: buildMessageProjectStage(progressSteps, locale),
      thumbnailUrl: DEFAULT_PROJECT_THUMB,
      href: action.href
    },
    nextStep: buildBrandMessageNextStep(notification.type, locale),
    actionHref: action.href,
    actionLabel: action.label,
    replyHref: action.href,
    replyLabel: locale === "zh" ? "回复创作者" : "Reply to creator"
  };
}

async function buildBrandMessageCenterPayload(
  notifications: BrandNotification[],
  brandName: string,
  locale: Locale
) {
  const details = await Promise.all(
    notifications.map((item) => buildBrandMessageDetail(item, brandName, locale))
  );
  const list: MessageListItem[] = notifications.map((notification, index) => {
    const detail = details[index];
    const senderName =
      detail?.senderName ?? brandSenderDisplayName(notification.creator_name, locale);
    return {
      id: notification.id,
      type: notification.type,
      category: detail?.category ?? brandMessageCategoryFromType(notification.type),
      senderName,
      senderInitials: brandSenderInitials(senderName),
      senderAvatarTone: brandSenderAvatarTone(senderName),
      title: notification.title,
      preview: notification.body,
      createdAt: notification.created_at,
      timeLabel: formatMessageListTime(notification.created_at, locale),
      readAt: notification.read_at,
      orderId: notification.order_id ?? null,
      actionHref: detail?.actionHref ?? withLocale("/brand/messages", locale),
      actionLabel: detail?.actionLabel ?? (locale === "zh" ? "查看" : "Open")
    };
  });
  return { list, details };
}

export default async function BrandMessagesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const locale = getLocale(query);
  const clientEmail = await getCurrentClientEmail();
  const cookieStore = await cookies();
  const session = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
  const brandName = resolveBrandName(session?.email ?? clientEmail);
  const notifications = clientEmail ? await listNotificationsForBrand(clientEmail) : [];
  const payload = await buildBrandMessageCenterPayload(notifications, brandName, locale);
  const statCounts = countMessagesByCategory(payload.list);
  const statCards = buildBrandMessageStatCards(statCounts, locale);
  const initialSelectedId =
    typeof query.id === "string" && payload.list.some((item) => item.id === query.id)
      ? query.id
      : payload.list[0]?.id ?? null;

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-zinc-100" />}>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            {locale === "zh" ? "消息中心" : "Messages"}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {locale === "zh"
              ? "项目动态、创作者回复与平台提醒。"
              : "Project updates, creator replies, and platform alerts."}
          </p>
        </header>
        <StudioMessageCenter
          locale={locale}
          list={payload.list}
          details={payload.details}
          initialSelectedId={initialSelectedId}
          statCards={statCards}
          actions={{
            markRead: markBrandNotificationReadAction,
            markManyRead: markBrandNotificationsReadAction,
            deleteMany: deleteBrandNotificationsAction
          }}
        />
      </div>
    </Suspense>
  );
}
