import "server-only";

import type { PaymentMethod } from "@prisma/client";
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
import { dataStorePath, readDataJson, writeDataJson } from "@/lib/serverless-store-core";
import { settlementService } from "@/features/settlement/settlement.service";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import {
  MIN_WITHDRAWAL_USD,
  computeWithdrawalFee,
  estimateArrival,
  estimateCryptoAmount
} from "@/lib/studioos/withdrawal-utils";

const STORE_PATH = dataStorePath("withdrawal-store.json");

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyStore(): WithdrawalStore {
  return { payout_methods: [], withdrawals: [] };
}

async function readStore(): Promise<WithdrawalStore> {
  const parsed = await readDataJson(STORE_PATH, () => emptyStore());
  const { store, changed } = ensureDemoPayoutMethods(parsed);
  if (changed) {
    await writeStore(store);
  }
  return store;
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
  await writeDataJson(STORE_PATH, store);
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

async function resolveCreatorUserId(creatorId: string): Promise<string | null> {
  if (!hasDatabaseUrl()) return null;
  const profileId = await resolveCreatorProfileIdForLegacyId(creatorId);
  if (!profileId) return null;
  const profile = await prisma.creatorProfile.findUnique({
    where: { id: profileId },
    select: { userId: true }
  });
  return profile?.userId ?? null;
}

function paymentMethodToPayoutMethod(creatorId: string, method: PaymentMethod): PayoutMethod {
  const metadata =
    typeof method.metadataJson === "object" && method.metadataJson !== null && !Array.isArray(method.metadataJson)
      ? (method.metadataJson as Record<string, unknown>)
      : {};
  const type = String(metadata.payout_type ?? method.type.toLowerCase()) as PayoutMethod["type"];

  return {
    id: method.id,
    creator_id: creatorId,
    type,
    label: method.accountName ?? String(metadata.label ?? method.provider),
    is_default: method.isDefault,
    verified: method.status === "VERIFIED",
    account_holder: typeof metadata.account_holder === "string" ? metadata.account_holder : undefined,
    bank_name: typeof metadata.bank_name === "string" ? metadata.bank_name : undefined,
    account_last4: method.accountNumber ?? undefined,
    routing_last4: typeof metadata.routing_last4 === "string" ? metadata.routing_last4 : undefined,
    swift_code: typeof metadata.swift_code === "string" ? metadata.swift_code : undefined,
    paypal_email: method.accountEmail ?? undefined,
    alipay_account: typeof metadata.alipay_account === "string" ? metadata.alipay_account : undefined,
    wechat_account: typeof metadata.wechat_account === "string" ? metadata.wechat_account : undefined,
    qr_code_url: typeof metadata.qr_code_url === "string" ? metadata.qr_code_url : undefined,
    crypto_asset: method.currency === "USDT" || method.currency === "USDC" ? method.currency : undefined,
    crypto_network: method.network === "TRC20" || method.network === "ERC20" ? method.network : undefined,
    wallet_address: method.walletAddress ?? undefined,
    created_at: method.createdAt.toISOString()
  };
}

function withdrawalRowToRequest(creatorId: string, row: {
  id: string;
  paymentMethodId: string | null;
  amount: { toString(): string };
  status: string;
  note: string | null;
  metadataJson: unknown;
  createdAt: Date;
  resolvedAt: Date | null;
}): WithdrawalRequest {
  const metadata =
    typeof row.metadataJson === "object" && row.metadataJson !== null && !Array.isArray(row.metadataJson)
      ? (row.metadataJson as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    creator_id: creatorId,
    payout_method_id: row.paymentMethodId ?? "",
    amount_usd: Number(row.amount),
    fee_usd: Number(metadata.fee_usd ?? 0),
    net_usd: Number(metadata.net_usd ?? row.amount),
    status:
      row.status === "APPROVED"
        ? "under_review"
        : row.status === "PROCESSING"
          ? "processing"
          : row.status === "COMPLETED"
            ? "completed"
            : row.status === "REJECTED"
              ? "failed"
              : row.status === "CANCELLED"
                ? "cancelled"
                : "pending",
    status_note: row.note ?? undefined,
    estimated_arrival: typeof metadata.estimated_arrival === "string" ? metadata.estimated_arrival : "",
    crypto_asset: metadata.crypto_asset === "USDT" || metadata.crypto_asset === "USDC" ? metadata.crypto_asset : undefined,
    crypto_network: metadata.crypto_network === "TRC20" || metadata.crypto_network === "ERC20" ? metadata.crypto_network : undefined,
    wallet_address: typeof metadata.wallet_address === "string" ? metadata.wallet_address : undefined,
    crypto_amount: typeof metadata.crypto_amount === "number" ? metadata.crypto_amount : undefined,
    created_at: row.createdAt.toISOString(),
    completed_at: row.resolvedAt?.toISOString() ?? null
  };
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
  const prismaSnapshot = await resolvePrismaIncomeSnapshot(creatorId);
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
  const userId = await resolveCreatorUserId(creatorId);
  if (userId) {
    const rows = await prisma.paymentMethod.findMany({
      where: { userId, status: { not: "DISABLED" } },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
    });
    return rows.map((item) => paymentMethodToPayoutMethod(creatorId, item));
  }

  const store = await readStore();
  return store.payout_methods
    .filter((item) => item.creator_id === creatorId)
    .sort((a, b) => Number(b.is_default) - Number(a.is_default));
}

export async function listWithdrawals(creatorId: string): Promise<WithdrawalRequest[]> {
  const userId = await resolveCreatorUserId(creatorId);
  if (userId) {
    const account = await prisma.walletAccount.findUnique({ where: { userId } });
    if (!account) return [];
    const rows = await prisma.withdrawalRequest.findMany({
      where: { walletAccountId: account.id },
      orderBy: { createdAt: "desc" }
    });
    return rows.map((item) => withdrawalRowToRequest(creatorId, item));
  }

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
  const userId = await resolveCreatorUserId(creatorId);
  if (userId) {
    const existingCount = await prisma.paymentMethod.count({
      where: { userId, status: { not: "DISABLED" } }
    });
    const isDefault = input.is_default ?? existingCount === 0;
    if (isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }
    const type =
      input.type === "bank_wire"
        ? "BANK_WIRE"
        : input.type === "wechat"
          ? "WECHAT"
          : input.type === "crypto"
            ? "CRYPTO"
            : input.type === "alipay"
              ? "ALIPAY"
              : "PAYPAL";
    const provider =
      input.type === "bank_wire"
        ? "BANK_TRANSFER"
        : input.type === "wechat"
          ? "WECHAT_PAY"
          : input.type === "crypto"
            ? "CRYPTO"
            : input.type === "alipay"
              ? "ALIPAY"
              : "PAYPAL";
    const method = await prisma.paymentMethod.create({
      data: {
        userId,
        type,
        provider,
        accountName: input.label,
        accountNumber: input.account_last4 ?? undefined,
        accountEmail: input.paypal_email ?? undefined,
        walletAddress: input.wallet_address ?? undefined,
        network: input.crypto_network ?? undefined,
        currency: input.crypto_asset ?? "USD",
        isDefault,
        status: input.verified ? "VERIFIED" : "PENDING",
        metadataJson: {
          payout_type: input.type,
          label: input.label,
          account_holder: input.account_holder,
          bank_name: input.bank_name,
          routing_last4: input.routing_last4,
          swift_code: input.swift_code,
          alipay_account: input.alipay_account,
          wechat_account: input.wechat_account,
          qr_code_url: input.qr_code_url
        }
      }
    });
    return paymentMethodToPayoutMethod(creatorId, method);
  }

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
  const userId = await resolveCreatorUserId(creatorId);
  if (userId) {
    const activeWithdrawal = await prisma.withdrawalRequest.findFirst({
      where: {
        paymentMethodId: methodId,
        status: { in: ["PENDING", "APPROVED"] }
      }
    });
    if (activeWithdrawal) return { ok: false, code: "IN_USE" };

    const method = await prisma.paymentMethod.findFirst({ where: { id: methodId, userId } });
    if (!method) return { ok: false, code: "NOT_FOUND" };

    await prisma.paymentMethod.update({
      where: { id: methodId },
      data: { status: "DISABLED", isDefault: false }
    });
    if (method.isDefault) {
      const next = await prisma.paymentMethod.findFirst({
        where: { userId, status: { not: "DISABLED" }, id: { not: methodId } },
        orderBy: { createdAt: "desc" }
      });
      if (next) {
        await prisma.paymentMethod.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }
    return { ok: true };
  }

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
  const userId = await resolveCreatorUserId(creatorId);
  if (userId) {
    const target = await prisma.paymentMethod.findFirst({
      where: { id: methodId, userId, status: { not: "DISABLED" } }
    });
    if (!target) return { ok: false, code: "NOT_FOUND" };
    await prisma.paymentMethod.updateMany({ where: { userId }, data: { isDefault: false } });
    const method = await prisma.paymentMethod.update({
      where: { id: methodId },
      data: { isDefault: true }
    });
    return { ok: true, method: paymentMethodToPayoutMethod(creatorId, method) };
  }

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

  const userId = await resolveCreatorUserId(creatorId);
  if (userId) {
    const account = await prisma.walletAccount.upsert({
      where: { userId },
      update: {},
      create: { userId }
    });
    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        walletAccountId: account.id,
        paymentMethodId: method.id,
        assetCode: "USD",
        amount,
        status: "PENDING",
        metadataJson: {
          fee_usd: fee,
          net_usd: net,
          estimated_arrival: estimateArrival(method.type, input.locale),
          crypto_asset: method.crypto_asset,
          crypto_network: method.crypto_network,
          wallet_address: method.wallet_address,
          crypto_amount:
            method.type === "crypto" && method.crypto_asset ? estimateCryptoAmount(method.crypto_asset, net) : undefined
        }
      }
    });
    return { ok: true, withdrawal: withdrawalRowToRequest(creatorId, withdrawal) };
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
