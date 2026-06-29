import type { CreatorNotification, CreatorNotificationType, NotificationStore } from "@/lib/notification-types";
import { createSerializedStoreReader, writeJsonFileAtomic } from "@/lib/json-file-store";
import { readDataJson, dataStorePath } from "@/lib/serverless-store";
import { getProject } from "@/lib/project-service";
import { getConfirmedBriefText } from "@/lib/studioos/confirmed-brief";
import { buildProjectRequirementsText } from "@/lib/studioos/project-brief-format";
import type { Locale } from "@/lib/i18n";

const STORE_PATH = dataStorePath("notification-store.json");

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyStore(): NotificationStore {
  return { notifications: [] };
}

async function readStoreInner(): Promise<NotificationStore> {
  const parsed = await readDataJson<NotificationStore>(STORE_PATH, () => emptyStore());
  const next = ensureDemoNotifications(parsed);
  if (JSON.stringify(next.notifications) !== JSON.stringify(parsed.notifications)) {
    await writeStore(next);
  }
  return next;
}

function ensureDemoNotifications(store: NotificationStore): NotificationStore {
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
    if (store.notifications.some((item) => item.id === seed.id)) {
      continue;
    }
    store.notifications.unshift({
      id: seed.id,
      creator_id: demoCreatorId,
      type: seed.type,
      title: seed.title,
      body: seed.body,
      project_id: demoProjectId,
      order_id: demoOrderId,
      client_name: "Arc & Alloy",
      company_name: "Arc & Alloy",
      requirements_text: requirementsText,
      read_at: seed.read_at,
      email_sent_at: seed.email_sent_at,
      created_at: seed.created_at
    });
  }

  return store;
}

const readStore = createSerializedStoreReader(readStoreInner);

async function writeStore(store: NotificationStore) {
  await writeJsonFileAtomic(STORE_PATH, store);
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
  const items = store.notifications
    .filter((item) => item.creator_id === creatorId)
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
  return store.notifications.some(
    (item) => item.creator_id === creatorId && item.order_id === orderId && item.type === type
  );
}

export async function findNotification(
  creatorId: string,
  orderId: string,
  type: CreatorNotificationType
): Promise<CreatorNotification | null> {
  const store = await readStore();
  return (
    store.notifications.find(
      (item) => item.creator_id === creatorId && item.order_id === orderId && item.type === type
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

  const store = await readStore();
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
  const store = await readStore();
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
  const store = await readStore();
  const item = store.notifications.find((n) => n.id === id && n.creator_id === creatorId);
  if (!item) {
    return false;
  }
  item.read_at = new Date().toISOString();
  await writeStore(store);
  return true;
}

export async function markAllNotificationsRead(creatorId: string): Promise<number> {
  const store = await readStore();
  const now = new Date().toISOString();
  let count = 0;
  for (const item of store.notifications) {
    if (item.creator_id === creatorId && !item.read_at) {
      item.read_at = now;
      count += 1;
    }
  }
  if (count) {
    await writeStore(store);
  }
  return count;
}

export async function markNotificationEmailSent(id: string): Promise<void> {
  const store = await readStore();
  const item = store.notifications.find((n) => n.id === id);
  if (!item) {
    return;
  }
  item.email_sent_at = new Date().toISOString();
  await writeStore(store);
}
