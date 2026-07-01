import type {
  CreateQuoteInput,
  OrderStore,
  StoredDeliverable,
  StoredOrder,
  StoredQuote
} from "@/lib/order-types";
import { createSerializedStoreReader, writeJsonFileAtomic } from "@/lib/json-file-store-core";
import { canPersistLocalDataStore } from "@/lib/can-persist-local-store";
import { getProject } from "@/lib/project-service";
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
import { MAX_CAMPAIGN_VERSIONS } from "@/features/delivery/version.repository";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
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
      file_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
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
      file_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
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
}

function ensureDemoIncomeOrders(store: OrderStore): OrderStore {
  const now = new Date().toISOString();

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

  if (order.payment_status === "unpaid" || order.status === "waiting_payment") {
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
  return store.orders.filter((item) => item.project_id === projectId);
}

export async function getOrder(id: string): Promise<StoredOrder | null> {
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
  const store = await readStore();
  const normalized = clientEmail.toLowerCase();
  return store.orders
    .filter((item) => item.client_email.toLowerCase() === normalized)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function listOrdersForCreator(creatorId: string): Promise<StoredOrder[]> {
  const store = await readStore();
  return store.orders
    .filter((item) => item.creator_id === creatorId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

export async function cancelUnpaidOrder(orderId: string): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order || order.payment_status !== "unpaid" || order.status === "cancelled") {
    return null;
  }

  order.status = "cancelled";
  await writeStore(store);
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
  if (!order || !["in_production", "revision", "review"].includes(order.status)) {
    return null;
  }

  const version =
    store.deliverables.filter((item) => item.order_id === orderId).length + 1;

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

  const { notifyBrandDeliverableUploaded } = await import("@/lib/studioos/brand-deliverable-notify");
  await notifyBrandDeliverableUploaded({
    order,
    deliverable,
    locale: input.notes_client_locale ?? order.client_locale
  });

  return deliverable;
}

export async function requestOrderRevision(orderId: string, notes: string): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order || order.status !== "review") {
    return null;
  }

  order.status = "revision";
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

/** Write-through bridge helpers — sync JSON order phase from Prisma without duplicating side effects. */
export async function syncOrderToReviewPhase(orderId: string): Promise<StoredOrder | null> {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) return null;
  if (["review", "completed"].includes(order.status)) return order;
  if (!["in_production", "revision", "review"].includes(order.status)) return order;

  order.status = "review";
  await writeStore(store);
  await syncProjectAfterDeliverable(order.project_id);
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
  if (order.status === "completed") return order;
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
  if (order.payment_status === "unpaid" || order.status === "waiting_payment") {
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
  if (!order || !["review", "revision"].includes(order.status)) {
    return null;
  }

  order.status = "completed";
  order.payment_status = "released";
  order.payout_status = "paid";
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
  const store = await readStore();
  return (
    store.orders
      .filter((item) => item.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null
  );
}

export async function getDeliverables(orderId: string): Promise<StoredDeliverable[]> {
  const order = await getOrder(orderId);
  if (order?.project_id) {
    const fromPrisma = await versionService.listDeliverablesForLegacyProject(order.project_id, orderId);
    if (fromPrisma) {
      return fromPrisma.sort((a, b) => b.version - a.version);
    }
  }

  const store = await readStore();
  return store.deliverables
    .filter((item) => item.order_id === orderId)
    .sort((a, b) => b.version - a.version);
}


export function canDeleteOrder(_order: Pick<StoredOrder, "status" | "payment_status">) {
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  return false;
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

  if (process.env.NODE_ENV !== "development") {
    return {
      ok: false,
      code: "LOCKED",
      message: "Orders cannot be deleted"
    };
  }

  const order = store.orders[index];
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
