import { walletRepository } from "@/features/wallet/wallet.repository";
import { serializeTransaction, serializeWallet } from "@/features/wallet/wallet.serializer";
import { userRepository } from "@/features/auth/user.repository";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { allowDemoPaymentFallback, isPaymentStubMode } from "@/lib/payment/payment-stub";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function createInvoiceId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function allowManualWalletRecharge() {
  return (
    process.env.VINCIS_ENABLE_MANUAL_WALLET_RECHARGE === "1" ||
    process.env.STUDIOOS_ENABLE_MANUAL_WALLET_RECHARGE === "1" ||
    !isProductionRuntime()
  );
}

function allowSyntheticInvoicePayment() {
  return allowDemoPaymentFallback();
}

export type BrandWalletChargeResult = {
  paymentSource: "balance" | "invoice";
  invoiceId: string | null;
  availableBefore: number;
  shortfallAmount: number;
  balanceAfter: number;
  paid: boolean;
};

export async function getBrandWalletSnapshot(brandEmail: string, limit = 12) {
  if (!hasDatabaseUrl()) {
    return { enabled: false as const };
  }

  const user = await userRepository.findByEmail(brandEmail.trim().toLowerCase());
  if (!user || (user.role !== "BRAND" && !user.brandProfile)) {
    return { enabled: false as const };
  }

  const wallet = await walletRepository.getOrCreate(user.id);
  const transactions = await walletRepository.listTransactions(wallet.id, limit);
  return {
    enabled: true as const,
    user,
    wallet: serializeWallet(wallet),
    transactions: transactions.map(serializeTransaction)
  };
}

export async function rechargeBrandWallet(input: {
  brandEmail: string;
  amount: number;
  description?: string;
}) {
  if (!allowManualWalletRecharge()) {
    return { ok: false as const, error: "production-disabled" };
  }

  const snapshot = await getBrandWalletSnapshot(input.brandEmail, 1);
  if (!snapshot.enabled) {
    return { ok: false as const, error: "wallet-unavailable" };
  }

  const amount = roundMoney(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false as const, error: "invalid-amount" };
  }

  const before = snapshot.wallet.availableBalance;
  const after = roundMoney(before + amount);
  const result = await walletRepository.applyLedgerUpdate({
    walletId: snapshot.wallet.id,
    availableDelta: amount,
    entries: [
      {
        type: "ESCROW_DEPOSIT",
        amount,
        balanceAfter: after,
        description: input.description ?? `Brand account recharge ${amount.toFixed(2)}`
      }
    ]
  });

  return {
    ok: true as const,
    wallet: serializeWallet(result.wallet),
    transaction: serializeTransaction(result.transactions[0]!)
  };
}

export async function resetBrandWalletBalanceForTesting(input: {
  brandEmail: string;
  description?: string;
}) {
  if (isProductionRuntime()) {
    return { ok: false as const, error: "production-disabled" };
  }

  const snapshot = await getBrandWalletSnapshot(input.brandEmail, 1);
  if (!snapshot.enabled) {
    return { ok: false as const, error: "wallet-unavailable" };
  }

  const available = roundMoney(snapshot.wallet.availableBalance);
  if (available <= 0) {
    return { ok: true as const, wallet: snapshot.wallet, transaction: null };
  }

  const result = await walletRepository.applyLedgerUpdate({
    walletId: snapshot.wallet.id,
    availableDelta: -available,
    entries: [
      {
        type: "PENALTY",
        amount: available,
        balanceAfter: 0,
        description: input.description ?? "Local test reset brand account balance"
      }
    ]
  });

  return {
    ok: true as const,
    wallet: serializeWallet(result.wallet),
    transaction: serializeTransaction(result.transactions[0]!)
  };
}

export async function payBrandWalletCharge(input: {
  brandUserId: string;
  campaignId?: string;
  amount: number;
  description: string;
  invoicePrefix: string;
  payInvoice?: boolean;
}): Promise<BrandWalletChargeResult> {
  const chargeInput = isPaymentStubMode() ? { ...input, payInvoice: true } : input;
  const wallet = await walletRepository.getOrCreate(chargeInput.brandUserId);
  const amount = roundMoney(chargeInput.amount);
  const availableBefore = roundMoney(Number(wallet.availableBalance));

  if (availableBefore >= amount) {
    const balanceAfter = roundMoney(availableBefore - amount);
    await walletRepository.applyLedgerUpdate({
      walletId: wallet.id,
      campaignId: chargeInput.campaignId,
      availableDelta: -amount,
      entries: [
        {
          type: "CLIENT_SERVICE_FEE",
          amount,
          balanceAfter,
          description: chargeInput.description
        }
      ]
    });

    return {
      paymentSource: "balance",
      invoiceId: null,
      availableBefore,
      shortfallAmount: 0,
      balanceAfter,
      paid: true
    };
  }

  const shortfallAmount = roundMoney(amount - availableBefore);
  const invoiceId = createInvoiceId(chargeInput.invoicePrefix);
  if (chargeInput.payInvoice) {
    if (!allowSyntheticInvoicePayment()) {
      return {
        paymentSource: "invoice",
        invoiceId,
        availableBefore,
        shortfallAmount,
        balanceAfter: availableBefore,
        paid: false
      };
    }

    await walletRepository.applyLedgerUpdate({
      walletId: wallet.id,
      campaignId: chargeInput.campaignId,
      availableDelta: roundMoney(shortfallAmount - amount),
      entries: [
        {
          type: "ESCROW_DEPOSIT",
          amount: shortfallAmount,
          balanceAfter: roundMoney(availableBefore + shortfallAmount),
          description: `Invoice ${invoiceId} paid for ${chargeInput.description}`
        },
        {
          type: "CLIENT_SERVICE_FEE",
          amount,
          balanceAfter: 0,
          description: chargeInput.description
        }
      ]
    });

    return {
      paymentSource: "invoice",
      invoiceId,
      availableBefore,
      shortfallAmount,
      balanceAfter: 0,
      paid: true
    };
  }

  return {
    paymentSource: "invoice",
    invoiceId,
    availableBefore,
    shortfallAmount,
    balanceAfter: availableBefore,
    paid: false
  };
}
