import type {
  CreateQuoteInput,
  OrderCancellationActor,
  OrderStore,
  StoredDeliverable,
  StoredOrder,
  StoredQuote
} from "@/lib/order-types";
import { createSerializedStoreReader, writeJsonFileAtomic } from "@/lib/json-file-store-core";
import { canPersistLocalDataStore } from "@/lib/can-persist-local-store";
import { getCreatorIdForDemoEmail } from "@/lib/creator-session";
import { getProject, updateProject } from "@/lib/project-service";
import type { StoredProject } from "@/lib/project-types";
import { readDataJson, dataStorePath } from "@/lib/serverless-store-core";
import {
  buildQuoteSummary,
  CAMPAIGN_PENDING_CREATOR_ID,
  deliveryDaysFromDeadline,
  parseBudgetMidpoint
} from "@/lib/studioos/brand-checkout-utils";
import {
  syncProjectAfterApproval,
  syncProjectAfterDeliverable,
  syncProjectAfterRevisionRequest,
  syncProjectFromOrderEvent
} from "@/lib/studioos/project-order-sync";
import { versionService } from "@/features/delivery/version.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { orderRepository } from "@/features/order/order.repository";
import { userRepository } from "@/features/auth/user.repository";
import { paymentRepository } from "@/features/payment/payment.repository";
import { EscrowState } from "@/features/shared/state-machines/escrow.state-machine";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { DEMO_REVIEW_VIDEO_URL } from "@/lib/studioos/review-video-url";
import {
  filterPlayableDeliverables,
  isUnsubmittedDeliverable,
  normalizeReviewDeliverableCatalog,
  prunePhantomReviewDeliverables
} from "@/lib/studioos/review-upload-version";
import { hasReviewVideoFileOnDisk } from "@/lib/studioos/video-upload";
import type { BrandCampaignMemory } from "@/features/campaign/brand-campaign/brand-campaign.types";
import { promises as fs } from "node:fs";
import path from "node:path";

const STORE_PATH = dataStorePath("order-store.json");
const REVISION_NOTES_DIR = path.dirname(STORE_PATH);
const PLATFORM_FEE_RATE = 0.2;
const DEMO_ARC_PROJECT_ID = "proj_demo_arc_nova";
const DEMO_ARC_ORDER_ID = "ord_demo_arc_nova";

const DEMO_ORDER_IDS = new Set([
  DEMO_ARC_ORDER_ID,
  "ord_demo_nova_completed",
  "ord_demo_nova_active",
  "ord_demo_nova_first"
]);

const FUNDED_ESCROW_STATES = new Set<string>([
  EscrowState.HELD,
  EscrowState.PARTIAL_RELEASE,
  EscrowState.FULL_RELEASE
]);

function isDemoOrderDismissed(store: OrderStore, id: string) {
  return store.dismissed_demo_ids?.includes(id) ?? false;
}

function dismissDemoOrder(store: OrderStore, id: string) {
  if (!DEMO_ORDER_IDS.has(id)) return;
  if (!store.dismissed_demo_ids) store.dismissed_demo_ids = [];
  if (!store.dismissed_demo_ids.includes(id)) {
    store.dismissed_demo_ids.push(id);
  }
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyStore(): OrderStore {
  return { quotes: [], orders: [], deliverables: [] };
}

function ensureDemoArcNovaOrder(store: OrderStore): OrderStore {
  if (isDemoOrderDismissed(store, DEMO_ARC_ORDER_ID)) {
    return store;
  }

  let order = store.orders.find((item) => item.id === DEMO_ARC_ORDER_ID);

  if (!order) {
    order = {
      id: DEMO_ARC_ORDER_ID,
      project_id: DEMO_ARC_PROJECT_ID,
      inquiry_id: "inq_demo_arc_nova",
      quote_id: "quote_demo_arc_nova",
      creator_id: "creator_01",
      client_email: "client.arc@studioos.test",
      client_name: "Arc & Alloy",
      company_name: "Arc & Alloy",
      title: "Arc Alloy Summer Launch — Hero film",
      requirements: "3x 9:16 cutdowns for TikTok and Meta summer travel launch.",
      budget_range: "$1,000-$2,500",
      work_id: null,
      amount: 1800,
      platform_fee: 360,
      creator_payout: 1440,
      payment_status: "escrowed",
      status: "review",
      payout_status: "held",
      client_locale: "en",
      created_at: "2026-06-28T11:00:00.000Z",
      paid_at: "2026-06-28T11:30:00.000Z",
      completed_at: null
    };
    store.orders.unshift(order);
  } else {
    order.project_id = DEMO_ARC_PROJECT_ID;
    if (order.status === "in_production") {
      order.status = "review";
    }
  }

  if (!store.deliverables.some((item) => item.order_id === DEMO_ARC_ORDER_ID)) {
    store.deliverables.push({
      id: "del_demo_arc_v1",
      order_id: DEMO_ARC_ORDER_ID,
      file_url: DEMO_REVIEW_VIDEO_URL,
      thumbnail_url: "",
      notes: "Version 1 — summer launch hero cut for brand review.",
      notes_for_client: "Version 1 — summer launch hero cut for brand review.",
      notes_client_locale: "en",
      version: 1,
      created_at: "2026-06-28T12:00:00.000Z"
    });
  }

  return store;
}

function ensureDemoUploadOrder(store: OrderStore): OrderStore {
  if (
    store.orders.some((order) => order.id === "ord_demo_nova_first") ||
    isDemoOrderDismissed(store, "ord_demo_nova_first")
  ) {
    return store;
  }

  store.orders.unshift({
    id: "ord_demo_nova_first",
    project_id: null,
    inquiry_id: "inq_demo_nova_first",
    quote_id: "quote_demo_nova_first",
    creator_id: "creator_01",
    client_email: "client.bright@studioos.test",
    client_name: "Northline Skincare",
    company_name: "Northline Skincare",
    title: "Northline 保湿精华 — 待上传初稿",
    requirements: "30s vertical hero for TikTok launch.",
    budget_range: "$1,000-$2,500",
    work_id: null,
    amount: 1200,
    platform_fee: 240,
    creator_payout: 960,
    payment_status: "escrowed",
    status: "in_production",
    payout_status: "held",
    created_at: "2026-06-28T12:00:00.000Z",
    paid_at: "2026-06-28T12:30:00.000Z",
    completed_at: null
  });

  return store;
}

function ensureDemoReviewDeliverable(store: OrderStore): OrderStore {
  const active = store.orders.find((order) => order.id === "ord_demo_nova_active");
  if (active && active.status === "in_production") {
    active.status = "review";
  }

  if (!store.deliverables.some((item) => item.order_id === "ord_demo_nova_active")) {
    store.deliverables.push({
      id: "del_demo_nova_v1",
      order_id: "ord_demo_nova_active",
      file_url: DEMO_REVIEW_VIDEO_URL,
      thumbnail_url: "",
      notes: "Version 1 — hero cut for review",
      version: 1,
      created_at: "2026-06-28T08:00:00.000Z"
    });
  }

  return store;
}

async function seedOrderStore(): Promise<OrderStore> {
  let seeded = ensureDemoIncomeOrders(emptyStore());
  for (const order of seeded.orders) {
    order.project_id = order.project_id ?? null;
  }
  seeded = ensureDemoArcNovaOrder(seeded);
  seeded = ensureDemoUploadOrder(seeded);
  seeded = ensureDemoReviewDeliverable(seeded);
  return seeded;
}

async function readStoreInner(): Promise<OrderStore> {
  const parsed = await readDataJson<OrderStore>(STORE_PATH, seedOrderStore);
  let migrated = false;
  for (const order of parsed.orders) {
    if (order.project_id === undefined) {
      order.project_id = null;
      migrated = true;
    }
  }
  let next = ensureDemoIncomeOrders(parsed);
  const beforeArcOrder = parsed.orders.find((item) => item.id === DEMO_ARC_ORDER_ID);
  next = ensureDemoArcNovaOrder(next);
  const afterArcOrder = next.orders.find((item) => item.id === DEMO_ARC_ORDER_ID);
  next = ensureDemoUploadOrder(next);
  next = ensureDemoReviewDeliverable(next);
  const arcOrderChanged =
    afterArcOrder != null &&
    (beforeArcOrder == null ||
      beforeArcOrder.project_id !== afterArcOrder.project_id ||
      beforeArcOrder.status !== afterArcOrder.status);
  if (
    migrated ||
    next.orders.length !== parsed.orders.length ||
    next.deliverables.length !== parsed.deliverables.length ||
    arcOrderChanged
  ) {
    await writeStore(next);
  }
  return next;
}

const readStore = createSerializedStoreReader(readStoreInner);

async function writeStore(store: OrderStore) {
  await writeJsonFileAtomic(STORE_PATH, store);
  readStore.invalidate();
}

function ensureDemoIncomeOrders(store: OrderStore): OrderStore {
  if (
    !store.orders.some((order) => order.id === "ord_demo_nova_completed") &&
    !isDemoOrderDismissed(store, "ord_demo_nova_completed")
  ) {
    store.orders.push({
      id: "ord_demo_nova_completed",
      project_id: null,
      inquiry_id: "inq_demo_nova",
      quote_id: "quote_demo_nova",
      creator_id: "creator_01",
      client_email: "client.arc@studioos.test",
      client_name: "Arc & Alloy",
      company_name: "Arc & Alloy",
      title: "Beauty launch hero film",
      requirements: "3 cutdowns for TikTok and Meta.",
      budget_range: "$800-$1,000",
      work_id: null,
      amount: 799,
      platform_fee: 160,
      creator_payout: 639,
      payment_status: "released",
      status: "completed",
      payout_status: "approved",
      created_at: "2026-06-20T10:00:00.000Z",
      paid_at: "2026-06-21T10:00:00.000Z",
      completed_at: "2026-06-26T14:00:00.000Z"
    });
  }

  if (
    !store.orders.some((order) => order.id === "ord_demo_nova_active") &&
    !isDemoOrderDismissed(store, "ord_demo_nova_active")
  ) {
    store.orders.push({
      id: "ord_demo_nova_active",
      project_id: null,
      inquiry_id: "inq_demo_nova_2",
      quote_id: "quote_demo_nova_2",
      creator_id: "creator_01",
      client_email: "client.bright@studioos.test",
      client_name: "BrightSip",
      company_name: "BrightSip",
      title: "CPG product demo batch",
      requirements: "Amazon + YouTube product demo.",
      budget_range: "$500-$700",
      work_id: null,
      amount: 599,
      platform_fee: 120,
      creator_payout: 479,
      payment_status: "escrowed",
      status: "review",
      payout_status: "held",
      created_at: "2026-06-27T09:00:00.000Z",
      paid_at: "2026-06-27T10:00:00.000Z",
      completed_at: null
    });
  }

  return store;
}

export async function markOrdersPaidForWithdrawal(creatorId: string, netUsd: number) {
  const store = await readStore();
  let remaining = netUsd;

  const approved = store.orders
    .filter((order) => order.creator_id === creatorId && order.payout_status === "approved")
    .sort((a, b) => new Date(a.completed_at ?? a.created_at).getTime() - new Date(b.completed_at ?? b.created_at).getTime());

  for (const order of approved) {
    if (remaining <= 0) {
      break;
    }

    if (order.creator_payout <= remaining + 0.001) {
      remaining = Math.round((remaining - order.creator_payout) * 100) / 100;
      order.payout_status = "paid";
    }
  }

  await writeStore(store);
}

function splitFees(amount: number) {
  const platform_fee = Math.round(amount * PLATFORM_FEE_RATE * 100) / 100;
  const creator_payout = Math.round((amount - platform_fee) * 100) / 100;
  return { platform_fee, creator_payout };
}

function isOrderCancellationActor(value: unknown): value is OrderCancellationActor {
  return value === "brand" || value === "studio" || value === "admin" || value === "system";
}

type PrismaOrderLike = NonNullable<Awaited<ReturnType<typeof orderRepository.findById>>>;

function prismaOrderToStored(order: PrismaOrderLike): StoredOrder {
  const metadata =
    typeof order.metadataJson === "object" && order.metadataJson !== null && !Array.isArray(order.metadataJson)
      ? (order.metadataJson as Record<string, unknown>)
      : {};
  const cancelledBy = isOrderCancellationActor(metadata.cancelled_by) ? metadata.cancelled_by : null;
  const cancelReason =
    typeof metadata.cancel_reason === "string" && metadata.cancel_reason.trim()
      ? metadata.cancel_reason.trim()
      : null;
  const legacyCreatorId =
    order.creatorProfile?.legacyCreatorId ??
    getCreatorIdForDemoEmail(order.creator.email ?? "") ??
    order.creatorProfileId ??
    order.creatorId;
  const status =
    order.status === "COMPLETED"
      ? "completed"
      : order.status === "CANCELLED" || order.status === "REFUNDED"
        ? "cancelled"
        : order.status === "CONFIRMED"
          ? "in_production"
          : "waiting_payment";

  return {
    id: order.id,
    project_id: typeof metadata.project_id === "string" ? metadata.project_id : order.campaignId,
    inquiry_id: typeof metadata.inquiry_id === "string" ? metadata.inquiry_id : order.conversationId ?? order.id,
    quote_id: typeof metadata.quote_id === "string" ? metadata.quote_id : order.id,
    creator_id: legacyCreatorId,
    client_email: order.client.email,
    client_name: order.client.fullName,
    company_name: typeof metadata.company_name === "string" ? metadata.company_name : order.client.fullName,
    client_locale: order.client.language === "zh" ? "zh" : "en",
    title: order.serviceProject,
    requirements: typeof metadata.requirements === "string" ? metadata.requirements : order.serviceProject,
    budget_range: `${order.currency} ${Number(order.orderAmount).toLocaleString()}`,
    work_id: typeof metadata.work_id === "string" ? metadata.work_id : null,
    amount: Number(order.orderAmount),
    platform_fee: Number(order.platformCommission),
    creator_payout: Number(order.creatorIncome),
    payment_status: order.status === "COMPLETED" ? "released" : order.status === "PENDING" ? "unpaid" : "escrowed",
    status,
    payout_status: order.status === "COMPLETED" ? "approved" : "held",
    created_at: order.createdAt.toISOString(),
    paid_at: order.status === "PENDING" ? null : order.updatedAt.toISOString(),
    completed_at: order.completedAt?.toISOString() ?? null,
    cancelled_at: order.cancelledAt?.toISOString() ?? null,
    cancelled_by: cancelledBy,
    cancel_reason: cancelReason
  };
}

export async function createQuote(input: CreateQuoteInput): Promise<StoredQuote> {
  const store = await readStore();

  for (const quote of store.quotes) {
    if (quote.inquiry_id === input.inquiry_id && quote.status === "pending") {
      quote.status = "superseded";
    }
  }

  const quote: StoredQuote = {
    id: createId("quote"),
    inquiry_id: input.inquiry_id,
    creator_id: input.creator_id,
    client_email: input.client_email,
    amount: input.amount,
    summary: input.summary.trim(),
    delivery_days: input.delivery_days,
    status: "pending",
    created_at: new Date().toISOString()
  };

  store.quotes.unshift(quote);
  await writeStore(store);
  return quote;
}

export async function getActiveQuote(inquiryId: string): Promise<StoredQuote | null> {
  const store = await readStore();
  return (
    store.quotes.find((item) => item.inquiry_id === inquiryId && item.status === "pending") ?? null
  );
}

export async function getActiveQuoteForPair(
  clientEmail: string,
  creatorId: string
): Promise<StoredQuote | null> {
  const store = await readStore();
  const normalized = clientEmail.toLowerCase();
  return (
    store.quotes
      .filter(
        (item) =>
          item.status === "pending" &&
          item.creator_id === creatorId &&
          item.client_email.toLowerCase() === normalized
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null
  );
}

export async function getOrderForPair(
  clientEmail: string,
  creatorId: string
): Promise<StoredOrder | null> {
  const store = await readStore();
  const normalized = clientEmail.toLowerCase();
  return (
    store.orders
      .filter(
        (item) => item.creator_id === creatorId && item.client_email.toLowerCase() === normalized
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null
  );
}

export async function getQuote(id: string): Promise<StoredQuote | null> {
  const store = await readStore();
  return store.quotes.find((item) => item.id === id) ?? null;
}

export async function acceptQuote(
  quoteId: string,
  inquiry: {
    id: string;
    creator_id: string;
    client_email: string;
    client_name: string;
    company_name: string;
    message: string;
    budget_range: string;
    work_id: string | null;
    project_id?: string | null;
  }
): Promise<StoredOrder | null> {
  const store = await readStore();
  const quote = store.quotes.find((item) => item.id === quoteId);
  if (!quote || quote.status !== "pending" || quote.inquiry_id !== inquiry.id) {
    return null;
  }

  quote.status = "accepted";
  const { platform_fee, creator_payout } = splitFees(quote.amount);

  const order: StoredOrder = {
    id: createId("ord"),
    project_id: inquiry.project_id ?? null,
    inquiry_id: inquiry.id,
    quote_id: quote.id,
    creator_id: inquiry.creator_id,
    client_email: inquiry.client_email,
    client_name: inquiry.client_name,
    company_name: inquiry.company_name,
    title: quote.summary,
    requirements: inquiry.message,
    budget_range: inquiry.budget_range,
    work_id: inquiry.work_id,
    amount: quote.amount,
    platform_fee,
    creator_payout,
    payment_status: "unpaid",
    status: "waiting_payment",
    payout_status: "held",
    created_at: new Date().toISOString(),
    paid_at: null,
    completed_at: null
  };

  if (hasDatabaseUrl()) {
    const [client, creatorProfileId, campaign] = await Promise.all([
      userRepository.findByEmail(inquiry.client_email.toLowerCase()),
      resolveCreatorProfileIdForLegacyId(inquiry.creator_id),
      inquiry.project_id ? campaignRepository.findByLegacyProjectId(inquiry.project_id) : Promise.resolve(null)
    ]);
    const creatorProfile = creatorProfileId
      ? await userRepository.findCreatorProfileById(creatorProfileId)
      : null;

    if (client && creatorProfile?.userId) {
      const persisted = await orderRepository.create({
        campaignId: campaign?.id ?? null,
        clientId: client.id,
        creatorId: creatorProfile.userId,
        creatorProfileId: creatorProfile.id,
        serviceProject: order.title,
        currency: "USD",
        orderAmount: order.amount,
        platformCommission: order.platform_fee,
        creatorIncome: order.creator_payout,
        metadataJson: {
          legacy_order_id: order.id,
          project_id: order.project_id,
          inquiry_id: order.inquiry_id,
          quote_id: order.quote_id,
          company_name: order.company_name,
          requirements: order.requirements,
          budget_range: order.budget_range,
          work_id: order.work_id
        }
      });
      await writeStore(store);
      const hydrated = await orderRepository.findById(persisted.id);
      if (hydrated) return prismaOrderToStored(hydrated);
    }
  }

  store.orders.unshift(order);
  await writeStore(store);
  return order;
}

/** Moves order to in_production only after escrow payment is confirmed. */
export async function beginOrderProduction(orderId: string): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) {
    return null;
  }

  if (["in_production", "revision", "review", "completed"].includes(order.status)) {
    return order;
  }

  if (order.payment_status === "unpaid") {
    return order;
  }

  order.status = "in_production";
  await writeStore(store);
  return order;
}

export async function linkOrderToProject(orderId: string, projectId: string): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) {
    return null;
  }
  order.project_id = projectId;
  await writeStore(store);
  return order;
}

export async function listOrdersForProject(projectId: string): Promise<StoredOrder[]> {
  const store = await readStore();
  const jsonOrders = store.orders
    .filter((item) => item.project_id === projectId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (hasDatabaseUrl()) {
    const rows = await orderRepository.listAll();
    const details = await Promise.all(rows.map((item) => orderRepository.findById(item.id)));
    const prismaOrders = details
      .filter((item): item is PrismaOrderLike => Boolean(item))
      .map(prismaOrderToStored)
      .filter((item) => item.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (prismaOrders.length > 0) {
      return prismaOrders;
    }
  }

  return jsonOrders;
}

export async function getOrder(id: string): Promise<StoredOrder | null> {
  if (hasDatabaseUrl()) {
    const order = await orderRepository.findById(id);
    if (order) {
      return prismaOrderToStored(order);
    }
  }

  const store = await readStore();
  return store.orders.find((item) => item.id === id) ?? null;
}

export async function updateOrderRequirements(
  orderId: string,
  requirements: string
): Promise<StoredOrder | null> {
  const trimmed = requirements.trim();
  if (!trimmed) {
    return getOrder(orderId);
  }

  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) {
    return null;
  }

  order.requirements = trimmed;
  await writeStore(store);
  return order;
}

export async function getOrderByInquiry(inquiryId: string): Promise<StoredOrder | null> {
  const store = await readStore();
  return store.orders.find((item) => item.inquiry_id === inquiryId) ?? null;
}

export async function reassignQuotesToInquiry(
  clientEmail: string,
  creatorId: string,
  inquiryId: string
): Promise<void> {
  const store = await readStore();
  const normalized = clientEmail.toLowerCase();
  let changed = false;

  for (const quote of store.quotes) {
    if (
      quote.creator_id === creatorId &&
      quote.client_email.toLowerCase() === normalized &&
      quote.inquiry_id !== inquiryId
    ) {
      quote.inquiry_id = inquiryId;
      changed = true;
    }
  }

  if (changed) {
    await writeStore(store);
  }
}

export async function listOrdersForClient(clientEmail: string): Promise<StoredOrder[]> {
  if (hasDatabaseUrl()) {
    const rows = await orderRepository.listAll();
    const details = await Promise.all(rows.map((item) => orderRepository.findById(item.id)));
    const normalized = clientEmail.toLowerCase();
    return details
      .filter((item): item is PrismaOrderLike => Boolean(item))
      .map(prismaOrderToStored)
      .filter((item) => item.client_email.toLowerCase() === normalized)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const store = await readStore();
  const normalized = clientEmail.toLowerCase();
  return store.orders
    .filter((item) => item.client_email.toLowerCase() === normalized)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function listOrdersForCreator(creatorId: string): Promise<StoredOrder[]> {
  const store = await readStore();
  const jsonOrders = store.orders.filter((item) => item.creator_id === creatorId);

  if (hasDatabaseUrl()) {
    const rows = await orderRepository.listAll();
    const details = await Promise.all(rows.map((item) => orderRepository.findById(item.id)));
    const prismaOrders = details
      .filter((item): item is PrismaOrderLike => Boolean(item))
      .map(prismaOrderToStored)
      .filter((item) => item.creator_id === creatorId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const seenIds = new Set(prismaOrders.map((item) => item.id));
    const seenProjects = new Set(prismaOrders.map((item) => item.project_id).filter(Boolean));
    const merged = [
      ...prismaOrders,
      ...jsonOrders.filter((item) => !seenIds.has(item.id) && !seenProjects.has(item.project_id))
    ];
    return merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return jsonOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function markOrderPaid(orderId: string): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order || order.payment_status !== "unpaid") {
    return null;
  }

  order.payment_status = "escrowed";
  const isCampaignEscrow = order.creator_id === CAMPAIGN_PENDING_CREATOR_ID;
  order.status = isCampaignEscrow ? "waiting_payment" : "in_production";
  order.paid_at = new Date().toISOString();
  await writeStore(store);

  if (isCampaignEscrow) {
    return order;
  }

  await syncProjectFromOrderEvent(order.project_id, "project.payment_received", "brand");

  const project = order.project_id ? await getProject(order.project_id) : null;
  const { notifyCreatorAssignment } = await import("@/lib/studioos/creator-assignment-notify");
  await notifyCreatorAssignment({
    type: "project_funded",
    creatorId: order.creator_id,
    order,
    project,
    locale: order.client_locale ?? "en"
  });

  return order;
}

export async function markLegacyOrderPaidForProject(projectId: string): Promise<StoredOrder | null> {
  const store = await readStore();
  const order =
    store.orders
      .filter((item) => item.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ??
    null;

  if (!order) {
    return null;
  }

  let currentOrder = order;

  if (order.payment_status === "unpaid") {
    const paidOrder = await markOrderPaid(order.id);
    if (!paidOrder) {
      return null;
    }
    currentOrder = paidOrder;
  }

  if (currentOrder.creator_id === CAMPAIGN_PENDING_CREATOR_ID) {
    const project = await getProject(projectId);
    if (project?.selected_studio_id) {
      return (
        (await assignOrderCreator({
          orderId: currentOrder.id,
          creatorId: project.selected_studio_id,
          inquiryId: currentOrder.inquiry_id,
          workId: currentOrder.work_id
        })) ?? currentOrder
      );
    }
  }

  return currentOrder;
}

async function isDatabaseEscrowFundedForProject(projectId: string) {
  if (!hasDatabaseUrl()) {
    return false;
  }

  const campaign = await campaignRepository.findByLegacyProjectId(projectId);
  if (!campaign) {
    return false;
  }

  const escrow = await paymentRepository.findByCampaignId(campaign.id);
  return escrow ? FUNDED_ESCROW_STATES.has(escrow.status) : false;
}

export async function repairSelectedCreatorCampaignOrders(creatorId: string): Promise<void> {
  if (hasDatabaseUrl()) {
    const rows = await orderRepository.listAll();
    await Promise.all(
      rows.map(async (row) => {
        const detail = await orderRepository.findById(row.id);
        if (!detail || detail.status !== "PENDING") return;

        const stored = prismaOrderToStored(detail);
        if (stored.creator_id !== creatorId || !stored.project_id) return;
        if (!(await isDatabaseEscrowFundedForProject(stored.project_id))) return;

        await orderRepository.updateStatus(detail.id, "CONFIRMED");
      })
    );
  }

  const store = await readStore();
  let changed = false;

  for (const order of store.orders) {
    if (order.creator_id !== CAMPAIGN_PENDING_CREATOR_ID || !order.project_id) {
      continue;
    }

    const project = await getProject(order.project_id);
    if (project?.selected_studio_id !== creatorId) {
      continue;
    }

    order.creator_id = creatorId;

    if (
      order.payment_status === "unpaid" &&
      (await isDatabaseEscrowFundedForProject(order.project_id))
    ) {
      order.payment_status = "escrowed";
      order.paid_at = order.paid_at ?? new Date().toISOString();
    }

    if (order.payment_status !== "unpaid" && order.status === "waiting_payment") {
      order.status = "in_production";
    }

    changed = true;
  }

  if (changed) {
    await writeStore(store);
  }
}

type OrderCancellationSnapshot = {
  reason: string | null;
  actorRole: OrderCancellationActor;
  cancelledAt: string;
  orderId: string;
  projectId?: string | null;
};

function createCancellationSnapshot(
  orderId: string,
  options: { reason?: string | null; actorRole?: OrderCancellationActor; projectId?: string | null } = {}
): OrderCancellationSnapshot {
  const reason = options.reason?.trim() || null;
  return {
    reason,
    actorRole: options.actorRole ?? "system",
    cancelledAt: new Date().toISOString(),
    orderId,
    projectId: options.projectId ?? null
  };
}

function cancellationMetadata(snapshot: OrderCancellationSnapshot) {
  return {
    reason: snapshot.reason,
    cancelled_at: snapshot.cancelledAt,
    cancelled_by: snapshot.actorRole,
    order_id: snapshot.orderId
  };
}

async function syncProjectCancellation(
  order: StoredOrder,
  snapshot: OrderCancellationSnapshot
) {
  const projectId = snapshot.projectId ?? order.project_id;
  if (!projectId) return;

  const cancellation = cancellationMetadata(snapshot);

  if (hasDatabaseUrl()) {
    const campaign = await campaignRepository.findByLegacyProjectId(projectId);
    if (!campaign) return;

    const campaignMemory =
      typeof campaign.campaignMemoryJson === "object" &&
      campaign.campaignMemoryJson !== null &&
      !Array.isArray(campaign.campaignMemoryJson)
        ? (campaign.campaignMemoryJson as BrandCampaignMemory)
        : {};

    await campaignRepository.updateBrandCampaign(campaign.id, {
      status: "CANCELLED",
      campaignMemoryJson: {
        ...campaignMemory,
        cancellation
      }
    });
    return;
  }

  await syncProjectFromOrderEvent(projectId, "project.cancelled", snapshot.actorRole);
  const project = await getProject(projectId);
  if (!project) return;

  await updateProject(projectId, {
    settings_json: {
      ...project.settings_json,
      cancellation
    }
  });
}

export async function cancelUnpaidOrder(
  orderId: string,
  options: { reason?: string | null; actorRole?: OrderCancellationActor; projectId?: string | null } = {}
): Promise<StoredOrder | null> {
  const snapshot = createCancellationSnapshot(orderId, options);

  if (hasDatabaseUrl()) {
    const prismaOrder = await orderRepository.findById(orderId);
    if (prismaOrder) {
      const order = prismaOrderToStored(prismaOrder);
      if (order.payment_status !== "unpaid" || order.status === "cancelled") {
        return null;
      }

      const existingMetadata =
        typeof prismaOrder.metadataJson === "object" &&
        prismaOrder.metadataJson !== null &&
        !Array.isArray(prismaOrder.metadataJson)
          ? (prismaOrder.metadataJson as Record<string, unknown>)
          : {};

      await orderRepository.cancelPendingOrder(orderId, {
        ...existingMetadata,
        project_id: snapshot.projectId ?? existingMetadata.project_id ?? order.project_id,
        cancel_reason: snapshot.reason,
        cancelled_by: snapshot.actorRole,
        cancelled_at: snapshot.cancelledAt
      });

      const cancelled = await orderRepository.findById(orderId);
      const stored = cancelled
        ? prismaOrderToStored(cancelled)
        : {
            ...order,
            status: "cancelled" as const,
            cancelled_at: snapshot.cancelledAt,
            cancelled_by: snapshot.actorRole,
            cancel_reason: snapshot.reason
          };
      await syncProjectCancellation(stored, snapshot);
      return stored;
    }
  }

  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order || order.payment_status !== "unpaid" || order.status === "cancelled") {
    return null;
  }

  order.status = "cancelled";
  order.cancelled_at = snapshot.cancelledAt;
  order.cancelled_by = snapshot.actorRole;
  order.cancel_reason = snapshot.reason;
  await writeStore(store);
  await syncProjectCancellation(order, snapshot);
  return order;
}

export async function addDeliverable(
  orderId: string,
  input: {
    file_url: string;
    thumbnail_url?: string;
    notes?: string;
    notes_for_client?: string;
    notes_client_locale?: "en" | "zh";
  }
): Promise<StoredDeliverable | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order || !["paid", "in_production", "revision", "review"].includes(order.status)) {
    return null;
  }

  const version =
    store.deliverables.filter((item) => item.order_id === orderId).length + 1;
  const { assertReviewVersionUploadAllowed } = await import("@/features/review/review-round-policy");
  const uploadGate = assertReviewVersionUploadAllowed({
    targetVersion: version,
    paidSlotsUnlocked: order.paid_revision_slots_unlocked ?? 0
  });
  if (!uploadGate.ok) {
    return null;
  }

  const notes = input.notes?.trim() || "";
  const notesForClient = input.notes_for_client?.trim() || notes;

  const deliverable: StoredDeliverable = {
    id: createId("del"),
    order_id: orderId,
    file_url: input.file_url.trim(),
    thumbnail_url: input.thumbnail_url?.trim() || input.file_url.trim(),
    notes,
    notes_for_client: notesForClient,
    notes_client_locale: input.notes_client_locale,
    version,
    created_at: new Date().toISOString()
  };

  store.deliverables.push(deliverable);
  order.status = "review";
  await writeStore(store);
  await syncProjectAfterDeliverable(order.project_id);

  return deliverable;
}

export async function upsertJsonDeliverable(
  orderId: string,
  deliverable: StoredDeliverable
): Promise<StoredDeliverable | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) {
    return null;
  }

  const index = store.deliverables.findIndex(
    (item) => item.order_id === orderId && item.version === deliverable.version
  );

  if (index >= 0) {
    store.deliverables[index] = {
      ...store.deliverables[index],
      ...deliverable,
      order_id: orderId,
      version: deliverable.version
    };
  } else {
    store.deliverables.push({
      ...deliverable,
      order_id: orderId
    });
  }

  if (["paid", "in_production", "revision", "review"].includes(order.status)) {
    order.status = "review";
  }

  await writeStore(store);
  await syncProjectAfterDeliverable(order.project_id);

  return (
    store.deliverables.find(
      (item) => item.order_id === orderId && item.version === deliverable.version
    ) ?? null
  );
}

export async function requestOrderRevision(orderId: string, notes: string): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order || order.status !== "review") {
    return null;
  }

  const deliverables = store.deliverables
    .filter((item) => item.order_id === orderId)
    .sort((a, b) => b.version - a.version);
  const latestSubmitted = deliverables.find(
    (item) => item.file_url.trim() && !item.file_url.includes("demo")
  )?.version;
  if (latestSubmitted) {
    const { assertRevisionRequestAllowed } = await import("@/features/review/review-round-policy");
    const gate = assertRevisionRequestAllowed({
      currentVersionNumber: latestSubmitted,
      paidSlotsUnlocked: order.paid_revision_slots_unlocked ?? 0
    });
    if (!gate.ok) {
      return null;
    }
    order.review_round = gate.nextRevisionRound;
  }

  order.status = "revision";
  if (order.review_round == null && latestSubmitted) {
    order.review_round = latestSubmitted + 1;
  }
  await writeStore(store);
  await syncProjectAfterRevisionRequest(order.project_id);

  if (notes.trim() && canPersistLocalDataStore()) {
    await fs.mkdir(REVISION_NOTES_DIR, { recursive: true });
    const notePath = path.join(REVISION_NOTES_DIR, `revision-${orderId}.txt`);
    await fs.writeFile(notePath, notes.trim(), "utf8");
  }

  const { notifyCreatorRevisionRequested } = await import("@/lib/studioos/commercial-interaction-notify");
  await notifyCreatorRevisionRequested({ order, notes, locale: order.client_locale });

  return order;
}

export async function syncOrderPaidRevisionSlots(
  orderId: string,
  paidRevisionSlotsUnlocked: number
): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) return null;
  order.paid_revision_slots_unlocked = paidRevisionSlotsUnlocked >= 1 ? 1 : 0;
  await writeStore(store);
  return order;
}

export async function syncOrderToReadyForCompletion(orderId: string): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) return null;
  if (!["review", "revision"].includes(order.status)) return null;

  order.status = "ready_for_completion";
  await writeStore(store);
  return order;
}

export async function resumeReviewFromReadyForCompletion(orderId: string): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) return null;
  if (order.status !== "ready_for_completion") return null;

  order.status = "review";
  await writeStore(store);
  return order;
}

/** Write-through bridge helpers — sync JSON order phase from Prisma without duplicating side effects. */
export async function syncOrderToReviewPhase(orderId: string): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) return null;
  if (["review", "completed"].includes(order.status)) return order;
  if (!["paid", "in_production", "revision", "review"].includes(order.status)) return order;

  order.status = "review";
  await writeStore(store);
  await syncProjectAfterDeliverable(order.project_id);
  return order;
}

/** Creator withdrew a submitted draft before brand review — back to upload. */
export async function syncOrderToCreatorReuploadPhase(
  orderId: string,
  reviewRound?: number
): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) return null;
  if (order.status !== "review") return order;

  order.status = "in_production";
  if (reviewRound != null && reviewRound > 0) {
    order.review_round = reviewRound;
  }
  await writeStore(store);
  return order;
}

export async function syncOrderToRevisionPhase(orderId: string): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) return null;
  if (order.status === "revision") return order;
  if (!["review", "revision"].includes(order.status)) return order;

  order.status = "revision";
  await writeStore(store);
  await syncProjectAfterRevisionRequest(order.project_id);
  return order;
}

export async function syncOrderToApprovedPhase(orderId: string): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) return null;
  if (order.status === "completed") {
    const { notifyCreatorDeliveryApproved, notifyCreatorEscrowReleased } = await import(
      "@/lib/studioos/commercial-interaction-notify"
    );
    await notifyCreatorDeliveryApproved({ order, locale: order.client_locale });
    await notifyCreatorEscrowReleased({ order, locale: order.client_locale });
    return order;
  }
  if (!["review", "revision", "completed"].includes(order.status)) return order;

  order.status = "completed";
  if (order.payout_status === "held") {
    order.payout_status = "approved";
  }
  order.completed_at = order.completed_at ?? new Date().toISOString();
  await writeStore(store);
  await syncProjectAfterApproval(order.project_id);
  return order;
}

export async function syncOrderToInProduction(orderId: string): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) return null;
  if (order.payment_status === "unpaid") {
    return order;
  }
  if (["in_production", "review", "revision", "completed"].includes(order.status)) {
    return order;
  }

  order.status = "in_production";
  await writeStore(store);
  return order;
}

/** Sync legacy JSON order after Prisma settlement — does not release wallet. */
export async function markOrderEscrowReleased(orderId: string): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) return null;

  order.payment_status = "released";
  if (order.payout_status === "held") {
    order.payout_status = "approved";
  }
  await writeStore(store);
  return order;
}

export async function approveOrderDelivery(orderId: string): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) {
    return null;
  }
  if (order.status === "completed") return order;
  if (!["review", "revision", "ready_for_completion", "settling"].includes(order.status)) return null;

  order.status = "completed";
  order.payment_status = "released";
  order.payout_status = "approved";
  order.completed_at = new Date().toISOString();
  await writeStore(store);
  await syncProjectAfterApproval(order.project_id);

  const { notifyCreatorDeliveryApproved, notifyCreatorEscrowReleased } = await import(
    "@/lib/studioos/commercial-interaction-notify"
  );
  await notifyCreatorDeliveryApproved({ order, locale: order.client_locale });
  await notifyCreatorEscrowReleased({ order, locale: order.client_locale });

  return order;
}

export async function createCampaignEscrowOrder(input: {
  project: StoredProject;
  client: { client_name: string; client_email: string; company_name: string };
  locale: "en" | "zh";
  requirements: string;
}): Promise<StoredOrder> {
  const store = await readStore();
  const amount = parseBudgetMidpoint(input.project.budget_range);
  const { platform_fee, creator_payout } = splitFees(amount);
  const inquiryId = createId("inq");
  const quoteId = createId("quote");
  const now = new Date().toISOString();

  store.quotes.unshift({
    id: quoteId,
    inquiry_id: inquiryId,
    creator_id: CAMPAIGN_PENDING_CREATOR_ID,
    client_email: input.client.client_email,
    amount,
    summary: buildQuoteSummary({
      title: input.project.title || input.project.product_name || input.project.company_name,
      videoCount: input.project.video_count ?? input.project.output_quantity,
      targetPlatform: input.project.target_platform,
      locale: input.locale
    }),
    delivery_days: deliveryDaysFromDeadline(input.project.deadline),
    status: "accepted",
    created_at: now
  });

  const order: StoredOrder = {
    id: createId("ord"),
    project_id: input.project.id,
    inquiry_id: inquiryId,
    quote_id: quoteId,
    creator_id: CAMPAIGN_PENDING_CREATOR_ID,
    client_email: input.client.client_email,
    client_name: input.client.client_name,
    company_name: input.project.company_name || input.client.company_name,
    client_locale: input.locale,
    title: input.project.title || input.project.product_name || input.project.company_name,
    requirements: input.requirements,
    budget_range: input.project.budget_range,
    work_id: null,
    amount,
    platform_fee,
    creator_payout,
    payment_status: "unpaid",
    status: "waiting_payment",
    payout_status: "held",
    created_at: now,
    paid_at: null,
    completed_at: null
  };

  store.orders.unshift(order);
  await writeStore(store);
  return order;
}

export async function assignOrderCreator(input: {
  orderId: string;
  creatorId: string;
  inquiryId: string;
  workId: string | null;
}): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === input.orderId);
  if (!order) {
    return null;
  }

  order.creator_id = input.creatorId;
  order.inquiry_id = input.inquiryId;
  order.work_id = input.workId;
  if (order.payment_status !== "unpaid") {
    order.status = "in_production";
  }
  await writeStore(store);
  return order;
}

export async function getOrderForProject(projectId: string): Promise<StoredOrder | null> {
  const orders = await listOrdersForProject(projectId);
  if (orders.length > 0) {
    return orders[0] ?? null;
  }

  const store = await readStore();
  return (
    store.orders
      .filter((item) => item.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null
  );
}

export async function removeJsonDeliverableVersion(orderId: string, version: number): Promise<void> {
  const store = await readStore();
  const before = store.deliverables.length;
  store.deliverables = store.deliverables.filter(
    (item) => !(item.order_id === orderId && item.version === version)
  );
  if (store.deliverables.length !== before) {
    await writeStore(store);
    readStore.invalidate?.();
  }
}

async function fetchRawDeliverablesForOrder(orderId: string): Promise<StoredDeliverable[]> {
  const order = await getOrder(orderId);
  const store = await readStore();
  const fromJson = store.deliverables
    .filter((item) => item.order_id === orderId)
    .sort((a, b) => b.version - a.version);

  if (order?.project_id) {
    const fromPrisma = await versionService.listDeliverablesForLegacyProject(order.project_id, orderId);
    if (fromPrisma !== null && fromPrisma.length > 0) {
      return fromPrisma.sort((a, b) => b.version - a.version);
    }
  }

  return fromJson;
}

async function repairPhantomReviewVersions(orderId: string, projectId: string | null) {
  const raw = await fetchRawDeliverablesForOrder(orderId);
  const sorted = [...raw].sort((a, b) => b.version - a.version);

  for (const item of sorted) {
    if (item.version <= 1 || isUnsubmittedDeliverable(item)) continue;
    if (await hasReviewVideoFileOnDisk(orderId, item.version)) continue;
    if (!(await hasReviewVideoFileOnDisk(orderId, item.version - 1))) continue;

    if (hasDatabaseUrl() && projectId) {
      const campaign = await campaignRepository.findByLegacyProjectId(projectId);
      if (campaign) {
        const { versionRepository } = await import("@/features/delivery/version.repository");
        await versionRepository.softDeleteVersion({
          campaignId: campaign.id,
          versionNumber: item.version
        });
      }
    }

    await removeJsonDeliverableVersion(orderId, item.version);
  }
}

export async function listDeliverablesForUpload(orderId: string): Promise<StoredDeliverable[]> {
  const order = await getOrder(orderId);
  await repairPhantomReviewVersions(orderId, order?.project_id ?? null);
  const raw = await fetchRawDeliverablesForOrder(orderId);
  return prunePhantomReviewDeliverables(orderId, raw);
}

export async function getDeliverables(orderId: string): Promise<StoredDeliverable[]> {
  const merged = await listDeliverablesForUpload(orderId);
  const normalized = await normalizeReviewDeliverableCatalog(orderId, merged);
  const playable = await filterPlayableDeliverables(orderId, normalized);

  return playable.sort((a, b) => b.version - a.version);
}


export function canDeleteOrder(order: Pick<StoredOrder, "status" | "payment_status">) {
  return order.status === "completed";
}

export async function deleteOrdersForProjectId(
  projectId: string,
  clientEmail: string
): Promise<string[]> {
  const store = await readStore();
  const normalized = clientEmail.toLowerCase();
  const removed: string[] = [];

  store.orders = store.orders.filter((item) => {
    if (item.project_id !== projectId || item.client_email.toLowerCase() !== normalized) {
      return true;
    }
    removed.push(item.id);
    return false;
  });

  if (!removed.length) {
    return removed;
  }

  store.deliverables = store.deliverables.filter((item) => !removed.includes(item.order_id));
  for (const orderId of removed) {
    dismissDemoOrder(store, orderId);
  }
  await writeStore(store);
  readStore.invalidate?.();
  return removed;
}

export async function deleteOrderForClient(
  orderId: string,
  clientEmail: string
): Promise<{ ok: true } | { ok: false; code: "NOT_FOUND" | "FORBIDDEN" | "LOCKED"; message: string }> {
  const store = await readStore();
  const normalized = clientEmail.toLowerCase();
  const index = store.orders.findIndex(
    (item) => item.id === orderId && item.client_email.toLowerCase() === normalized
  );

  if (index < 0) {
    return { ok: false, code: "NOT_FOUND", message: "Order not found" };
  }

  const order = store.orders[index];
  if (!canDeleteOrder(order)) {
    return {
      ok: false,
      code: "LOCKED",
      message: "Only completed orders can be deleted"
    };
  }

  store.orders.splice(index, 1);
  store.deliverables = store.deliverables.filter((item) => item.order_id !== orderId);
  dismissDemoOrder(store, orderId);
  await writeStore(store);
  readStore.invalidate?.();

  return { ok: true };
}

export async function clearDeliverableVideoFile(deliverableId: string): Promise<boolean> {
  const store = await readStore();
  const deliverable = store.deliverables.find((item) => item.id === deliverableId);
  if (!deliverable) {
    return false;
  }

  deliverable.file_url = "";
  deliverable.thumbnail_url = "";
  await writeStore(store);
  readStore.invalidate?.();
  return true;
}
