import { creators } from "@/lib/data";
import type { DepositStatus } from "@/lib/types";
import type { PayoutMethodType } from "@/lib/studioos/withdrawal-types";
import { CREATOR_DEPOSIT_USD } from "@/lib/studioos/deposit-copy";
import type {
  CreatorDepositOverlay,
  CreatorDepositSnapshot,
  DepositPayment,
  DepositStore
} from "@/lib/studioos/deposit-types";
import { dataStorePath, readDataJson, writeDataJson } from "@/lib/serverless-store-core";

const STORE_PATH = dataStorePath("deposit-store.json");

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function seedOverlays(): Record<string, CreatorDepositOverlay> {
  const overlays: Record<string, CreatorDepositOverlay> = {};
  for (const creator of creators) {
    overlays[creator.id] = {
      deposit_status: creator.deposit_status ?? "unpaid",
      deposit_amount: CREATOR_DEPOSIT_USD,
      paid_at: creator.deposit_status === "paid" ? creator.created_at : null
    };
  }
  return overlays;
}

function emptyStore(): DepositStore {
  return { creator_overlays: seedOverlays(), payments: [] };
}

function normalizeStore(parsed: DepositStore): DepositStore {
  if (!parsed.creator_overlays) {
    parsed.creator_overlays = seedOverlays();
  }
  for (const creator of creators) {
    if (!parsed.creator_overlays[creator.id]) {
      parsed.creator_overlays[creator.id] = {
        deposit_status: creator.deposit_status ?? "unpaid",
        deposit_amount: CREATOR_DEPOSIT_USD,
        paid_at: creator.deposit_status === "paid" ? creator.created_at : null
      };
    }
  }
  parsed.payments ??= [];
  return parsed;
}

async function readStore(): Promise<DepositStore> {
  const parsed = await readDataJson<DepositStore>(STORE_PATH, emptyStore);
  return normalizeStore(parsed);
}

async function writeStore(store: DepositStore) {
  await writeDataJson(STORE_PATH, store);
}

function isActiveDepositPayment(status: DepositPayment["status"]) {
  return status === "pending" || status === "under_review";
}

function applyDepositConfirmation(store: DepositStore, payment: DepositPayment) {
  payment.status = "confirmed";
  payment.confirmed_at = new Date().toISOString();
  const overlay = store.creator_overlays[payment.creator_id];
  if (overlay) {
    overlay.deposit_status = "paid";
    overlay.deposit_amount = payment.amount_usd;
    overlay.paid_at = payment.confirmed_at;
  } else {
    store.creator_overlays[payment.creator_id] = {
      deposit_status: "paid",
      deposit_amount: payment.amount_usd,
      paid_at: payment.confirmed_at
    };
  }
  return { creatorId: payment.creator_id, paymentId: payment.id };
}

async function runPostDepositConfirmationSideEffects(
  items: Array<{ creatorId: string; paymentId: string }>
) {
  if (!items.length) {
    return;
  }

  const { ensureCertificationFormAndMessage } = await import(
    "@/lib/studioos/certification-form-notify"
  );

  for (const item of items) {
    await ensureCertificationFormAndMessage({
      creatorId: item.creatorId,
      depositPaymentId: item.paymentId
    }).catch(() => undefined);
  }
}

async function advanceDemoDepositPayments(store: DepositStore) {
  const now = Date.now();
  let changed = false;
  const confirmedCreatorIds: Array<{ creatorId: string; paymentId: string }> = [];

  for (const payment of store.payments) {
    const ageMs = now - new Date(payment.created_at).getTime();

    if (payment.status === "pending" && ageMs > 3_000) {
      payment.status = "under_review";
      changed = true;
    }

    if (payment.status === "under_review" && ageMs > 8_000) {
      confirmedCreatorIds.push(applyDepositConfirmation(store, payment));
      changed = true;
    }
  }

  if (changed) {
    await writeStore(store);
  }

  await runPostDepositConfirmationSideEffects(confirmedCreatorIds);
}

export async function getCreatorDepositOverlay(creatorId: string): Promise<CreatorDepositOverlay | null> {
  const store = await readStore();
  await advanceDemoDepositPayments(store);
  return store.creator_overlays[creatorId] ?? null;
}

export type AdminDepositRow = {
  id: string;
  legacyCreatorId: string;
  creatorProfileId: string | null;
  amount: number;
  status: string;
  reason: string | null;
  refundableAfter: string | null;
};

export async function listAdminDepositRows(): Promise<AdminDepositRow[]> {
  const store = await readStore();
  await advanceDemoDepositPayments(store);

  const rows: AdminDepositRow[] = [];
  for (const [legacyCreatorId, overlay] of Object.entries(store.creator_overlays)) {
    rows.push({
      id: `dep_${legacyCreatorId}`,
      legacyCreatorId,
      creatorProfileId: null,
      amount: overlay.deposit_amount || CREATOR_DEPOSIT_USD,
      status: overlay.deposit_status,
      reason: overlay.deposit_status === "paid" ? "Paid studio guarantee deposit" : "Required before accepting orders",
      refundableAfter: overlay.paid_at ?? null
    });
  }

  return rows;
}

export async function getCreatorDepositSnapshot(creatorId: string): Promise<CreatorDepositSnapshot> {
  const store = await readStore();
  await advanceDemoDepositPayments(store);

  const overlay = store.creator_overlays[creatorId] ?? {
    deposit_status: "unpaid" as DepositStatus,
    deposit_amount: CREATOR_DEPOSIT_USD,
    paid_at: null
  };

  const payments = store.payments
    .filter((item) => item.creator_id === creatorId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const latestConfirmed = payments.find((item) => item.status === "confirmed");
  if (latestConfirmed && overlay.deposit_status !== "paid") {
    overlay.deposit_status = "paid";
    overlay.deposit_amount = latestConfirmed.amount_usd;
    overlay.paid_at = latestConfirmed.confirmed_at ?? latestConfirmed.created_at;
    store.creator_overlays[creatorId] = overlay;
    await writeStore(store);
    await runPostDepositConfirmationSideEffects([
      { creatorId, paymentId: latestConfirmed.id }
    ]);
  }

  const pending_payment = payments.find((item) => isActiveDepositPayment(item.status)) ?? null;

  return {
    amount_usd: overlay.deposit_amount || CREATOR_DEPOSIT_USD,
    deposit_status: overlay.deposit_status,
    paid_at: overlay.paid_at ?? null,
    can_accept_orders: overlay.deposit_status === "paid",
    pending_payment,
    payments
  };
}

export async function submitDepositPayment(
  creatorId: string,
  input: {
    payment_method: PayoutMethodType;
    payment_reference?: string;
    locale: "en" | "zh";
  }
): Promise<{ ok: true; payment: DepositPayment } | { ok: false; error: string }> {
  const store = await readStore();
  await advanceDemoDepositPayments(store);

  const overlay = store.creator_overlays[creatorId];
  if (overlay?.deposit_status === "paid") {
    return {
      ok: false,
      error: input.locale === "zh" ? "保证金已缴纳" : "Deposit already paid"
    };
  }

  const hasPending = store.payments.some(
    (item) => item.creator_id === creatorId && isActiveDepositPayment(item.status)
  );
  if (hasPending) {
    return {
      ok: false,
      error: input.locale === "zh" ? "已有待确认的保证金付款" : "A deposit payment is already pending review"
    };
  }

  const payment: DepositPayment = {
    id: createId("dep_pay"),
    creator_id: creatorId,
    amount_usd: CREATOR_DEPOSIT_USD,
    payment_method: input.payment_method,
    payment_reference: input.payment_reference?.trim() || undefined,
    status: "pending",
    created_at: new Date().toISOString(),
    confirmed_at: null
  };

  store.payments.unshift(payment);
  const confirmed = applyDepositConfirmation(store, payment);
  await writeStore(store);
  await runPostDepositConfirmationSideEffects([confirmed]);
  return { ok: true, payment };
}
