import type { CreatorNotification, CreatorNotificationType, NotificationStore } from "@/lib/notification-types";
import { createSerializedStoreReader } from "@/lib/json-file-store";
import { getCreatorIdForDemoEmail } from "@/lib/creator-session";
import { creators } from "@/lib/data";
import { dataStorePath, invalidateDataJson, readDataJson, writeDataJson } from "@/lib/serverless-store";
import { getProject } from "@/lib/project-service";
import { getConfirmedBriefText } from "@/lib/studioos/confirmed-brief";
import { buildProjectRequirementsText } from "@/lib/studioos/project-brief-format";
import type { Locale } from "@/lib/i18n";

const STORE_PATH = dataStorePath("notification-store.json");
const CERTIFICATION_FORM_PROJECT_KEY = "certification_onboarding";

/** Fixed demo seed IDs — must be dismissed on delete or they respawn from ensureDemoNotifications. */
export const DEMO_NOTIFICATION_IDS = [
  "ntf_demo_arc_selected",
  "ntf_demo_arc_funded",
  "ntf_demo_nike_work_selected",
  "ntf_demo_samsung_feedback",
  "ntf_demo_apple_revision",
  "ntf_demo_payment_received",
  "ntf_demo_project_completed",
  "ntf_demo_system_cert"
] as const;

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyStore(): NotificationStore {
  return { notifications: [], dismissed_demo_ids: [] };
}

function isDemoNotificationDismissed(store: NotificationStore, id: string) {
  return store.dismissed_demo_ids?.includes(id) ?? false;
}

function cloneStore(store: NotificationStore): NotificationStore {
  return {
    dismissed_demo_ids: [...(store.dismissed_demo_ids ?? [])],
    notifications: store.notifications.map((item) => ({ ...item }))
  };
}

/** Legacy demo ids and email aliases can diverge from session-resolved creator ids. */
function resolveCreatorOwnerIds(creatorId: string): Set<string> {
  const ownerIds = new Set<string>([creatorId]);
  const creator = creators.find((item) => item.id === creatorId);
  if (creator?.email) {
    const fromDemo = getCreatorIdForDemoEmail(creator.email);
    if (fromDemo) {
      ownerIds.add(fromDemo);
    }
  }
  for (const item of creators) {
    if (item.email && getCreatorIdForDemoEmail(item.email) === creatorId) {
      ownerIds.add(item.id);
    }
  }
  return ownerIds;
}

function notificationOwnedByCreator(notification: CreatorNotification, creatorId: string) {
  return resolveCreatorOwnerIds(creatorId).has(notification.creator_id);
}

function normalizeStore(raw: NotificationStore): NotificationStore {
  const store = cloneStore(raw);
  store.dismissed_demo_ids ??= [];
  if (process.env.STUDIOOS_SEED_DEMO_NOTIFICATIONS === "1") {
    return ensureDemoNotifications(store);
  }
  store.notifications = store.notifications.filter(
    (item) => !isDemoNotificationDismissed(store, item.id)
  );
  return store;
}

async function readStoreInner(): Promise<NotificationStore> {
  const parsed = await readDataJson<NotificationStore>(STORE_PATH, () => emptyStore());
  const normalized = normalizeStore(parsed);
  if (process.env.STUDIOOS_SEED_DEMO_NOTIFICATIONS === "1") {
    if (
      JSON.stringify(normalized.notifications) !== JSON.stringify(parsed.notifications) ||
      JSON.stringify(normalized.dismissed_demo_ids) !== JSON.stringify(parsed.dismissed_demo_ids ?? [])
    ) {
      await writeStore(normalized);
    }
  }
  return normalized;
}

function ensureDemoNotifications(store: NotificationStore): NotificationStore {
  store.dismissed_demo_ids ??= [];
  store.notifications = store.notifications.filter(
    (item) => !isDemoNotificationDismissed(store, item.id)
  );

  const demoCreatorId = "creator_01";
  const demoOrderId = "ord_demo_arc_nova";
  const demoProjectId = "proj_demo_arc_nova";

  const requirementsText = [
    "品牌: Arc & Alloy",
    "项目名称: 我的产品 Campaign",
    "广告目标: 为「My Product」制作 TikTok / Meta 效果广告，聚焦新品发布。",
    "品类: CPG",
    "投放平台: TikTok, Meta",
    "视频比例: 9:16",
    "交付数量: 1",
    "预算: $300",
    "截止日期: 2026-07-05",
    "品牌风格: Apple Minimal",
    "目标受众: 25-40，对高端护肤感兴趣的用户",
    "参考链接: https://example.com/reference",
    "补充说明: 画面干净、灯光高级，产品特写需清晰。"
  ].join("\n");

  const seeds = [
    {
      id: "ntf_demo_nike_work_selected",
      type: "creator_selected" as const,
      title: "选择了您的作品作为第一版",
      body: "我们对《Smartwatch lifestyle film》的创意方向非常满意，已将其选为「Nike 春季新品广告」项目的第一版。请在 3 天内上传完整作品。",
      company_name: "Nike",
      client_name: "Nike",
      project_id: null,
      order_id: null,
      read_at: null,
      created_at: "2026-06-21T02:30:00.000Z",
      email_sent_at: "2026-06-21T02:30:00.000Z"
    },
    {
      id: "ntf_demo_samsung_feedback",
      type: "revision_requested" as const,
      title: "品牌方已完成第一版审片",
      body: "Samsung 品牌方在审片中标注了 3 处修改点，请查看批注并在 2 天内提交修改版。",
      company_name: "Samsung",
      client_name: "Samsung",
      project_id: null,
      order_id: null,
      read_at: null,
      created_at: "2026-06-20T08:45:00.000Z",
      email_sent_at: "2026-06-20T08:45:00.000Z"
    },
    {
      id: "ntf_demo_apple_revision",
      type: "revision_requested" as const,
      title: "修改版已通过，等待最终确认",
      body: "Apple 品牌方已确认修改版通过，请等待最终交付确认通知。",
      company_name: "Apple",
      client_name: "Apple",
      project_id: null,
      order_id: null,
      read_at: null,
      created_at: "2026-06-19T09:15:00.000Z",
      email_sent_at: "2026-06-19T09:15:00.000Z"
    },
    {
      id: "ntf_demo_payment_received",
      type: "project_funded" as const,
      title: "项目款项已到账",
      body: "Samsung 项目的托管款项已到账，请开始制作并按时交付。",
      company_name: "Samsung",
      client_name: "Samsung",
      project_id: null,
      order_id: null,
      read_at: null,
      created_at: "2026-06-18T11:30:00.000Z",
      email_sent_at: "2026-06-18T11:30:00.000Z"
    },
    {
      id: "ntf_demo_project_completed",
      type: "delivery_approved" as const,
      title: "项目已完成，款项即将释放",
      body: "Apple 品牌方已确认最终交付，款项将在 3 个工作日内释放至您的账户。",
      company_name: "Apple",
      client_name: "Apple",
      project_id: null,
      order_id: null,
      read_at: "2026-06-17T15:00:00.000Z",
      created_at: "2026-06-17T14:20:00.000Z",
      email_sent_at: "2026-06-17T14:20:00.000Z"
    },
    {
      id: "ntf_demo_system_cert",
      type: "invitation_match" as const,
      title: "您的 StudioOS 认证已通过",
      body: "恭喜！您已通过 StudioOS 专业创作者认证，现在可以接收更多品牌项目邀请。",
      company_name: "系统通知",
      client_name: "StudioOS",
      project_id: null,
      order_id: null,
      read_at: "2026-06-16T09:00:00.000Z",
      created_at: "2026-06-16T09:00:00.000Z",
      email_sent_at: "2026-06-16T09:00:00.000Z"
    },
    {
      id: "ntf_demo_arc_selected",
      type: "creator_selected" as const,
      title: "你被 Arc & Alloy (brand) 选中了",
      body: "品牌方选择了你负责「我的产品 Campaign」。完整需求表单见下方，付款完成后即可开拍。",
      read_at: null,
      created_at: "2026-06-01T14:30:00.000Z",
      email_sent_at: "2026-06-01T14:30:00.000Z"
    },
    {
      id: "ntf_demo_arc_funded",
      type: "project_funded" as const,
      title: "Arc & Alloy 已完成付款",
      body: "「我的产品 Campaign」款项已托管，请查看完整需求表单并开始制作。",
      read_at: "2026-06-02T09:00:00.000Z",
      created_at: "2026-06-02T09:00:00.000Z",
      email_sent_at: "2026-06-02T09:00:00.000Z"
    }
  ];

  for (const seed of seeds) {
    if (isDemoNotificationDismissed(store, seed.id)) {
      continue;
    }
    if (store.notifications.some((item) => item.id === seed.id)) {
      continue;
    }
    store.notifications.unshift({
      id: seed.id,
      creator_id: demoCreatorId,
      type: seed.type,
      title: seed.title,
      body: seed.body,
      project_id: seed.project_id === undefined ? demoProjectId : seed.project_id,
      order_id: seed.order_id === undefined ? demoOrderId : seed.order_id,
      client_name: seed.client_name ?? "Arc & Alloy",
      company_name: seed.company_name ?? "Arc & Alloy",
      requirements_text: requirementsText,
      read_at: seed.read_at,
      email_sent_at: seed.email_sent_at,
      created_at: seed.created_at
    });
  }

  return store;
}

const readStore = createSerializedStoreReader(readStoreInner);

/** Fresh disk read before writes — avoids stale in-memory JSON across server action workers. */
async function readStoreForMutation(): Promise<NotificationStore> {
  invalidateDataJson(STORE_PATH);
  readStore.invalidate?.();
  const parsed = await readDataJson<NotificationStore>(STORE_PATH, () => emptyStore());
  return normalizeStore(parsed);
}

async function writeStore(store: NotificationStore) {
  await writeDataJson(STORE_PATH, store);
  readStore.invalidate?.();
}

function dismissDemoNotificationIds(store: NotificationStore, ids: Iterable<string>) {
  store.dismissed_demo_ids ??= [];
  for (const id of ids) {
    if (
      DEMO_NOTIFICATION_IDS.includes(id as (typeof DEMO_NOTIFICATION_IDS)[number]) &&
      !store.dismissed_demo_ids.includes(id)
    ) {
      store.dismissed_demo_ids.push(id);
    }
  }
}

async function enrichNotificationRequirements(
  notification: CreatorNotification,
  locale: Locale = "zh"
): Promise<CreatorNotification> {
  if (notification.requirements_text?.trim() || !notification.project_id) {
    return notification;
  }

  const project = await getProject(notification.project_id);
  if (!project) {
    return notification;
  }

  const requirementsText =
    getConfirmedBriefText(project, locale) || buildProjectRequirementsText(project, locale);

  if (!requirementsText.trim()) {
    return notification;
  }

  return {
    ...notification,
    requirements_text: requirementsText
  };
}

export async function listNotificationsForCreator(
  creatorId: string,
  locale: Locale = "zh"
): Promise<CreatorNotification[]> {
  const store = await readStore();
  const ownerIds = resolveCreatorOwnerIds(creatorId);
  const items = store.notifications
    .filter((item) => ownerIds.has(item.creator_id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return Promise.all(items.map((item) => enrichNotificationRequirements(item, locale)));
}

export async function countUnreadNotifications(creatorId: string): Promise<number> {
  const items = await listNotificationsForCreator(creatorId);
  return items.filter((item) => !item.read_at).length;
}

export async function getNotification(id: string): Promise<CreatorNotification | null> {
  const store = await readStore();
  return store.notifications.find((item) => item.id === id) ?? null;
}

export async function hasNotification(
  creatorId: string,
  orderId: string,
  type: CreatorNotificationType
): Promise<boolean> {
  const store = await readStore();
  const ownerIds = resolveCreatorOwnerIds(creatorId);
  return store.notifications.some(
    (item) => ownerIds.has(item.creator_id) && item.order_id === orderId && item.type === type
  );
}

export async function findNotification(
  creatorId: string,
  orderId: string,
  type: CreatorNotificationType
): Promise<CreatorNotification | null> {
  const store = await readStore();
  const ownerIds = resolveCreatorOwnerIds(creatorId);
  return (
    store.notifications.find(
      (item) => ownerIds.has(item.creator_id) && item.order_id === orderId && item.type === type
    ) ?? null
  );
}

export async function findNotificationByProject(
  creatorId: string,
  projectId: string,
  type: CreatorNotificationType
): Promise<CreatorNotification | null> {
  const store = await readStore();
  const ownerIds = resolveCreatorOwnerIds(creatorId);
  return (
    store.notifications.find(
      (item) => ownerIds.has(item.creator_id) && item.project_id === projectId && item.type === type
    ) ?? null
  );
}

export async function patchNotificationRequirements(
  id: string,
  requirementsText: string
): Promise<CreatorNotification | null> {
  const trimmed = requirementsText.trim();
  if (!trimmed) {
    return getNotification(id);
  }

  const store = await readStoreForMutation();
  const item = store.notifications.find((n) => n.id === id);
  if (!item) {
    return null;
  }

  item.requirements_text = trimmed;
  await writeStore(store);
  return item;
}

export async function createCreatorNotification(input: {
  creator_id: string;
  type: CreatorNotificationType;
  title: string;
  body: string;
  project_id: string | null;
  order_id: string | null;
  client_name: string;
  company_name: string;
  requirements_text: string;
  email_sent_at?: string | null;
}): Promise<CreatorNotification> {
  const store = await readStoreForMutation();
  const notification: CreatorNotification = {
    id: createId("ntf"),
    creator_id: input.creator_id,
    type: input.type,
    title: input.title,
    body: input.body,
    project_id: input.project_id,
    order_id: input.order_id,
    client_name: input.client_name,
    company_name: input.company_name,
    requirements_text: input.requirements_text,
    read_at: null,
    email_sent_at: input.email_sent_at ?? null,
    created_at: new Date().toISOString()
  };
  store.notifications.unshift(notification);
  await writeStore(store);
  return notification;
}

export async function markNotificationRead(id: string, creatorId: string): Promise<boolean> {
  const store = await readStoreForMutation();
  const item = store.notifications.find((n) => n.id === id && notificationOwnedByCreator(n, creatorId));
  if (!item) {
    return false;
  }
  item.read_at = new Date().toISOString();
  await writeStore(store);
  return true;
}

export async function markAllNotificationsRead(creatorId: string): Promise<number> {
  const store = await readStoreForMutation();
  const ownerIds = resolveCreatorOwnerIds(creatorId);
  const now = new Date().toISOString();
  let count = 0;
  for (const item of store.notifications) {
    if (ownerIds.has(item.creator_id) && !item.read_at) {
      item.read_at = now;
      count += 1;
    }
  }
  if (count) {
    await writeStore(store);
  }
  return count;
}

export async function markNotificationsRead(ids: string[], creatorId: string): Promise<number> {
  if (!ids.length) {
    return 0;
  }

  const store = await readStoreForMutation();
  const ownerIds = resolveCreatorOwnerIds(creatorId);
  const now = new Date().toISOString();
  const idSet = new Set(ids);
  let count = 0;

  for (const item of store.notifications) {
    if (ownerIds.has(item.creator_id) && idSet.has(item.id) && !item.read_at) {
      item.read_at = now;
      count += 1;
    }
  }

  if (count) {
    await writeStore(store);
  }

  return count;
}

export async function deleteNotification(id: string, creatorId: string): Promise<boolean> {
  const store = await readStoreForMutation();
  const dismissedBefore = store.dismissed_demo_ids?.length ?? 0;
  dismissDemoNotificationIds(store, [id]);
  const dismissedAdded = (store.dismissed_demo_ids?.length ?? 0) > dismissedBefore;
  const index = store.notifications.findIndex(
    (item) => item.id === id && notificationOwnedByCreator(item, creatorId)
  );
  if (index === -1) {
    if (dismissedAdded) {
      await writeStore(store);
      return true;
    }
    return false;
  }
  store.notifications.splice(index, 1);
  await writeStore(store);
  return true;
}

export async function deleteNotifications(ids: string[], creatorId: string): Promise<number> {
  if (!ids.length) {
    return 0;
  }
  const store = await readStoreForMutation();
  const dismissedBefore = store.dismissed_demo_ids?.length ?? 0;
  dismissDemoNotificationIds(store, ids);
  const dismissedAdded = (store.dismissed_demo_ids?.length ?? 0) > dismissedBefore;
  const idSet = new Set(ids);
  const before = store.notifications.length;
  const removed = store.notifications.filter(
    (item) => idSet.has(item.id) && notificationOwnedByCreator(item, creatorId)
  );
  store.notifications = store.notifications.filter(
    (item) => !(idSet.has(item.id) && notificationOwnedByCreator(item, creatorId))
  );
  const deleted = before - store.notifications.length;

  if (deleted > 0 || dismissedAdded) {
    await writeStore(store);
    const { dismissCertificationMessage } = await import("@/lib/studioos/certification-form-service");
    for (const item of removed) {
      if (
        item.type === "certification_approved" &&
        item.project_id === CERTIFICATION_FORM_PROJECT_KEY
      ) {
        await dismissCertificationMessage(creatorId, item.id).catch(() => undefined);
      }
    }
  }

  return deleted > 0 ? deleted : dismissedAdded ? ids.length : 0;
}

export async function deleteAllNotificationsForCreator(creatorId: string): Promise<number> {
  const store = await readStoreForMutation();
  dismissDemoNotificationIds(store, DEMO_NOTIFICATION_IDS);
  const ownerIds = resolveCreatorOwnerIds(creatorId);
  const before = store.notifications.length;
  store.notifications = store.notifications.filter((item) => !ownerIds.has(item.creator_id));
  const deleted = before - store.notifications.length;
  await writeStore(store);
  return deleted;
}

export async function markNotificationEmailSent(id: string): Promise<void> {
  const store = await readStoreForMutation();
  const item = store.notifications.find((n) => n.id === id);
  if (!item) {
    return;
  }
  item.email_sent_at = new Date().toISOString();
  await writeStore(store);
}
