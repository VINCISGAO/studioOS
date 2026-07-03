import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { listOrdersForCreator } from "@/lib/order-service";
import { markOrdersPaidForWithdrawal } from "@/lib/order-service";
import type {
  CreatorIncomeSnapshot,
  CryptoAsset,
  CryptoNetwork,
  PayoutMethod,
  WithdrawalRequest,
  WithdrawalStatus,
  WithdrawalStore
} from "@/lib/studioos/withdrawal-types";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { settlementService } from "@/features/settlement/settlement.service";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import {
  MIN_WITHDRAWAL_USD,
  computeWithdrawalFee,
  estimateArrival,
  estimateCryptoAmount
} from "@/lib/studioos/withdrawal-utils";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(STORE_DIR, "withdrawal-store.json");

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyStore(): WithdrawalStore {
  return { payout_methods: [], withdrawals: [] };
}

async function readStore(): Promise<WithdrawalStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as WithdrawalStore;
    const { store, changed } = ensureDemoPayoutMethods(parsed);
    if (changed) {
      await writeStore(store);
    }
    return store;
  } catch {
    const { store: seeded, changed } = ensureDemoPayoutMethods(emptyStore());
    await writeStore(seeded);
    return seeded;
  }
}

function ensureDemoPayoutMethods(store: WithdrawalStore): { store: WithdrawalStore; changed: boolean } {
  const creatorId = "creator_02";
  const demoIds = [
    "pm_demo_signal_bank",
    "pm_demo_signal_paypal",
    "pm_demo_signal_alipay",
    "pm_demo_signal_wechat",
    "pm_demo_signal_crypto"
  ];

  if (demoIds.every((id) => store.payout_methods.some((item) => item.id === id))) {
    return { store, changed: false };
  }

  const now = "2026-06-01T09:00:00.000Z";
  const seeds: PayoutMethod[] = [
    {
      id: "pm_demo_signal_bank",
      creator_id: creatorId,
      type: "bank_wire",
      label: "Santander Bank",
      is_default: true,
      verified: true,
      account_holder: "Signal Frame Lab",
      bank_name: "Santander Bank",
      account_last4: "4242",
      routing_last4: "0210",
      created_at: now
    },
    {
      id: "pm_demo_signal_paypal",
      creator_id: creatorId,
      type: "paypal",
      label: "PayPal",
      is_default: false,
      verified: true,
      paypal_email: "hello@signalframe.ai",
      created_at: now
    },
    {
      id: "pm_demo_signal_alipay",
      creator_id: creatorId,
      type: "alipay",
      label: "Alipay",
      is_default: false,
      verified: false,
      alipay_account: "hello@signalframe.ai",
      created_at: now
    },
    {
      id: "pm_demo_signal_wechat",
      creator_id: creatorId,
      type: "wechat",
      label: "WeChat Pay",
      is_default: false,
      verified: false,
      wechat_account: "SignalFrame",
      created_at: now
    },
    {
      id: "pm_demo_signal_crypto",
      creator_id: creatorId,
      type: "crypto",
      label: "USDT Wallet",
      is_default: false,
      verified: false,
      crypto_asset: "USDT",
      crypto_network: "TRC20",
      wallet_address: "0x8a12f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
      created_at: now
    }
  ];

  let changed = false;
  for (const seed of seeds) {
    if (!store.payout_methods.some((item) => item.id === seed.id)) {
      store.payout_methods.push(seed);
      changed = true;
    }
  }

  return { store, changed };
}

async function writeStore(store: WithdrawalStore) {
  await fs.mkdir(STORE_DIR, { recursive: true });
  const tempPath = `${STORE_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tempPath, STORE_PATH);
}

function isActiveWithdrawal(status: WithdrawalStatus) {
  return ["pending", "under_review", "processing"].includes(status);
}


async function resolvePrismaIncomeSnapshot(creatorId: string) {
  if (!hasDatabaseUrl()) return null;

  const profileId = await resolveCreatorProfileIdForLegacyId(creatorId);
  if (!profileId) return null;

  const profile = await prisma.creatorProfile.findUnique({
    where: { id: profileId },
    select: { userId: true }
  });
  if (!profile) return null;

  return settlementService.getCreatorIncomeSnapshot(profile.userId);
}

async function advanceDemoWithdrawals(store: WithdrawalStore) {
  const now = Date.now();
  let changed = false;

  for (const withdrawal of store.withdrawals) {
    const ageMs = now - new Date(withdrawal.created_at).getTime();

    if (withdrawal.status === "pending" && ageMs > 4_000) {
      withdrawal.status = "under_review";
      changed = true;
    }

    if (withdrawal.status === "under_review" && ageMs > 10_000) {
      withdrawal.status = "processing";
      changed = true;
    }

    if (withdrawal.status === "processing" && ageMs > 18_000) {
      withdrawal.status = "completed";
      withdrawal.completed_at = new Date().toISOString();
      changed = true;
      await markOrdersPaidForWithdrawal(withdrawal.creator_id, withdrawal.net_usd);
    }
  }

  if (changed) {
    await writeStore(store);
  }
}

export async function getCreatorIncomeSnapshot(creatorId: string): Promise<CreatorIncomeSnapshot> {
  const prismaSnapshot = creatorId.startsWith("creator_")
    ? null
    : await resolvePrismaIncomeSnapshot(creatorId);
  if (prismaSnapshot) {
    const store = await readStore();
    await advanceDemoWithdrawals(store);
    const pendingWithdrawals = store.withdrawals
      .filter((item) => item.creator_id === creatorId && isActiveWithdrawal(item.status))
      .reduce((sum, item) => sum + item.amount_usd, 0);

    return {
      ...prismaSnapshot,
      pending_withdrawal_usd: Math.round(pendingWithdrawals * 100) / 100,
      available_usd: Math.max(
        0,
        Math.round((prismaSnapshot.available_usd - pendingWithdrawals) * 100) / 100
      )
    };
  }

  const [orders, store] = await Promise.all([listOrdersForCreator(creatorId), readStore()]);
  await advanceDemoWithdrawals(store);

  const released = orders
    .filter((order) => ["approved", "paid"].includes(order.payout_status))
    .reduce((sum, order) => sum + order.creator_payout, 0);
  const held = orders
    .filter((order) => order.payout_status === "held" && order.payment_status === "escrowed")
    .reduce((sum, order) => sum + order.creator_payout, 0);

  const pendingWithdrawals = store.withdrawals
    .filter((item) => item.creator_id === creatorId && isActiveWithdrawal(item.status))
    .reduce((sum, item) => sum + item.amount_usd, 0);

  const lifetimeWithdrawn = store.withdrawals
    .filter((item) => item.creator_id === creatorId && item.status === "completed")
    .reduce((sum, item) => sum + item.net_usd, 0);

  const completedWithdrawals = store.withdrawals
    .filter((item) => item.creator_id === creatorId && item.status === "completed")
    .reduce((sum, item) => sum + item.amount_usd, 0);

  return {
    available_usd: Math.max(
      0,
      Math.round((released - pendingWithdrawals - completedWithdrawals) * 100) / 100
    ),
    held_usd: Math.round(held * 100) / 100,
    pending_withdrawal_usd: Math.round(pendingWithdrawals * 100) / 100,
    lifetime_withdrawn_usd: Math.round(lifetimeWithdrawn * 100) / 100,
    min_withdrawal_usd: MIN_WITHDRAWAL_USD
  };
}

export async function listPayoutMethods(creatorId: string): Promise<PayoutMethod[]> {
  const store = await readStore();
  return store.payout_methods
    .filter((item) => item.creator_id === creatorId)
    .sort((a, b) => Number(b.is_default) - Number(a.is_default));
}

export async function listWithdrawals(creatorId: string): Promise<WithdrawalRequest[]> {
  const store = await readStore();
  await advanceDemoWithdrawals(store);
  return store.withdrawals
    .filter((item) => item.creator_id === creatorId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function addPayoutMethod(
  creatorId: string,
  input: Omit<PayoutMethod, "id" | "creator_id" | "created_at" | "is_default"> & { is_default?: boolean }
): Promise<PayoutMethod> {
  const store = await readStore();
  const methods = store.payout_methods.filter((item) => item.creator_id === creatorId);
  const isDefault = input.is_default ?? methods.length === 0;

  if (isDefault) {
    for (const method of store.payout_methods) {
      if (method.creator_id === creatorId) {
        method.is_default = false;
      }
    }
  }

  const method: PayoutMethod = {
    id: createId("pm"),
    creator_id: creatorId,
    is_default: isDefault,
    created_at: new Date().toISOString(),
    ...input
  };

  store.payout_methods.unshift(method);
  await writeStore(store);
  return method;
}

export async function deletePayoutMethod(
  creatorId: string,
  methodId: string
): Promise<{ ok: true } | { ok: false; code: "NOT_FOUND" | "IN_USE" }> {
  const store = await readStore();
  const index = store.payout_methods.findIndex(
    (item) => item.id === methodId && item.creator_id === creatorId
  );

  if (index < 0) {
    return { ok: false, code: "NOT_FOUND" };
  }

  const hasActiveWithdrawal = store.withdrawals.some(
    (item) =>
      item.creator_id === creatorId &&
      item.payout_method_id === methodId &&
      isActiveWithdrawal(item.status)
  );

  if (hasActiveWithdrawal) {
    return { ok: false, code: "IN_USE" };
  }

  const [removed] = store.payout_methods.splice(index, 1);
  if (removed.is_default) {
    const next = store.payout_methods.find((item) => item.creator_id === creatorId);
    if (next) {
      next.is_default = true;
    }
  }

  await writeStore(store);
  return { ok: true };
}

export async function setDefaultPayoutMethod(
  creatorId: string,
  methodId: string
): Promise<{ ok: true; method: PayoutMethod } | { ok: false; code: "NOT_FOUND" }> {
  const store = await readStore();
  const target = store.payout_methods.find(
    (item) => item.id === methodId && item.creator_id === creatorId
  );

  if (!target) {
    return { ok: false, code: "NOT_FOUND" };
  }

  for (const method of store.payout_methods) {
    if (method.creator_id === creatorId) {
      method.is_default = method.id === methodId;
    }
  }

  await writeStore(store);
  return { ok: true, method: target };
}

export async function updatePayoutMethod(
  creatorId: string,
  methodId: string,
  input: {
    label: string;
    is_default?: boolean;
    account_holder?: string;
    bank_name?: string;
    account_number?: string;
    routing_number?: string;
    swift_code?: string;
    paypal_email?: string;
    alipay_account?: string;
    wechat_account?: string;
    qr_code_url?: string;
    crypto_asset?: CryptoAsset;
    crypto_network?: CryptoNetwork;
    wallet_address?: string;
  }
): Promise<{ ok: true; method: PayoutMethod } | { ok: false; code: "NOT_FOUND" }> {
  const store = await readStore();
  const method = store.payout_methods.find(
    (item) => item.id === methodId && item.creator_id === creatorId
  );

  if (!method) {
    return { ok: false, code: "NOT_FOUND" };
  }

  method.label = input.label;

  if (method.type === "bank_wire") {
    if (input.account_holder) method.account_holder = input.account_holder;
    if (input.bank_name) method.bank_name = input.bank_name;
    if (input.account_number && input.account_number.length >= 4) {
      method.account_last4 = input.account_number.slice(-4);
    }
    if (input.routing_number && input.routing_number.length >= 4) {
      method.routing_last4 = input.routing_number.slice(-4);
    }
    if (input.swift_code !== undefined) {
      method.swift_code = input.swift_code.trim() || undefined;
    }
  }

  if (method.type === "paypal" && input.paypal_email) {
    method.paypal_email = input.paypal_email;
  }

  if (method.type === "alipay") {
    if (input.alipay_account !== undefined) {
      method.alipay_account = input.alipay_account.trim() || undefined;
    }
    if (input.qr_code_url !== undefined) {
      method.qr_code_url = input.qr_code_url || undefined;
    }
  }

  if (method.type === "wechat") {
    if (input.wechat_account !== undefined) {
      method.wechat_account = input.wechat_account.trim() || undefined;
    }
    if (input.qr_code_url !== undefined) {
      method.qr_code_url = input.qr_code_url || undefined;
    }
  }

  if (method.type === "crypto") {
    if (input.crypto_asset) method.crypto_asset = input.crypto_asset;
    if (input.crypto_network) method.crypto_network = input.crypto_network;
    if (input.wallet_address) method.wallet_address = input.wallet_address;
  }

  if (input.is_default) {
    for (const item of store.payout_methods) {
      if (item.creator_id === creatorId) {
        item.is_default = item.id === methodId;
      }
    }
  } else if (input.is_default === false && method.is_default) {
    method.is_default = false;
    const next = store.payout_methods.find(
      (item) => item.creator_id === creatorId && item.id !== methodId
    );
    if (next) {
      next.is_default = true;
    } else {
      method.is_default = true;
    }
  }

  await writeStore(store);
  return { ok: true, method };
}

export async function createWithdrawal(
  creatorId: string,
  input: {
    payout_method_id: string;
    amount_usd: number;
    locale: "en" | "zh";
  }
): Promise<{ ok: true; withdrawal: WithdrawalRequest } | { ok: false; error: string }> {
  const snapshot = await getCreatorIncomeSnapshot(creatorId);
  const amount = Math.round(input.amount_usd * 100) / 100;

  if (amount < MIN_WITHDRAWAL_USD) {
    return {
      ok: false,
      error: input.locale === "zh" ? `最低提现金额为 $${MIN_WITHDRAWAL_USD}` : `Minimum withdrawal is $${MIN_WITHDRAWAL_USD}`
    };
  }

  if (amount > snapshot.available_usd) {
    return {
      ok: false,
      error: input.locale === "zh" ? "提现金额超过可用余额" : "Amount exceeds available balance"
    };
  }

  const store = await readStore();
  const method = store.payout_methods.find(
    (item) => item.id === input.payout_method_id && item.creator_id === creatorId
  );

  if (!method) {
    return {
      ok: false,
      error: input.locale === "zh" ? "请选择有效的收款方式" : "Select a valid payout method"
    };
  }

  const fee = computeWithdrawalFee(method.type, amount);
  const net = Math.round((amount - fee) * 100) / 100;

  if (net <= 0) {
    return {
      ok: false,
      error: input.locale === "zh" ? "扣除手续费后金额无效" : "Amount is too low after fees"
    };
  }

  const withdrawal: WithdrawalRequest = {
    id: createId("wd"),
    creator_id: creatorId,
    payout_method_id: method.id,
    amount_usd: amount,
    fee_usd: fee,
    net_usd: net,
    status: "pending",
    estimated_arrival: estimateArrival(method.type, input.locale),
    created_at: new Date().toISOString(),
    completed_at: null
  };

  if (method.type === "crypto" && method.crypto_asset && method.crypto_network && method.wallet_address) {
    withdrawal.crypto_asset = method.crypto_asset;
    withdrawal.crypto_network = method.crypto_network;
    withdrawal.wallet_address = method.wallet_address;
    withdrawal.crypto_amount = estimateCryptoAmount(method.crypto_asset, net);
  }

  store.withdrawals.unshift(withdrawal);
  await writeStore(store);

  return { ok: true, withdrawal };
}

export async function cancelWithdrawal(
  creatorId: string,
  withdrawalId: string,
  locale: "en" | "zh"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const store = await readStore();
  const withdrawal = store.withdrawals.find(
    (item) => item.id === withdrawalId && item.creator_id === creatorId
  );

  if (!withdrawal) {
    return { ok: false, error: locale === "zh" ? "未找到提现记录" : "Withdrawal not found" };
  }

  if (withdrawal.status !== "pending") {
    return {
      ok: false,
      error: locale === "zh" ? "仅待审核的提现可以取消" : "Only pending withdrawals can be cancelled"
    };
  }

  withdrawal.status = "cancelled";
  withdrawal.status_note = locale === "zh" ? "用户已取消" : "Cancelled by studio";
  await writeStore(store);
  return { ok: true };
}
