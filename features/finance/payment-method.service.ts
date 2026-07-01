import type {
  PaymentMethodProvider,
  PaymentMethodType,
  WalletAssetCode
} from "@prisma/client";
import { paymentMethodRepository } from "@/features/finance/payment-method.repository";
import { serializePaymentMethod } from "@/features/finance/finance.serializer";
import type { PaymentMethodView } from "@/features/finance/finance.types";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

const CRYPTO_TYPES = new Set<PaymentMethodType>(["CRYPTO"]);

export class PaymentMethodService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  private assertDb() {
    if (!this.isEnabled()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  async listForUser(userId: string): Promise<PaymentMethodView[]> {
    this.assertDb();
    const rows = await paymentMethodRepository.listByUserId(userId);
    return rows.map(serializePaymentMethod);
  }

  async createForUser(
    userId: string,
    input: {
      type: PaymentMethodType;
      provider: PaymentMethodProvider;
      accountName?: string | null;
      accountNumber?: string | null;
      accountEmail?: string | null;
      walletAddress?: string | null;
      network?: string | null;
      currency?: WalletAssetCode;
      isDefault?: boolean;
    }
  ): Promise<PaymentMethodView> {
    this.assertDb();
    this.validateInput(input);

    const row = await paymentMethodRepository.create({
      userId,
      ...input,
      status: "PENDING"
    });

    return serializePaymentMethod(row);
  }

  async updateForUser(
    userId: string,
    methodId: string,
    input: {
      accountName?: string | null;
      accountNumber?: string | null;
      accountEmail?: string | null;
      walletAddress?: string | null;
      network?: string | null;
      currency?: WalletAssetCode;
      isDefault?: boolean;
      status?: "PENDING" | "VERIFIED";
    }
  ): Promise<PaymentMethodView | null> {
    this.assertDb();
    const row = await paymentMethodRepository.update(methodId, userId, input);
    return row ? serializePaymentMethod(row) : null;
  }

  async setDefault(userId: string, methodId: string): Promise<PaymentMethodView | null> {
    this.assertDb();
    const row = await paymentMethodRepository.setDefault(methodId, userId);
    return row ? serializePaymentMethod(row) : null;
  }

  async disable(userId: string, methodId: string): Promise<boolean> {
    this.assertDb();
    const row = await paymentMethodRepository.disable(methodId, userId);
    return Boolean(row);
  }

  private validateInput(input: {
    type: PaymentMethodType;
    provider: PaymentMethodProvider;
    accountNumber?: string | null;
    accountEmail?: string | null;
    walletAddress?: string | null;
    network?: string | null;
  }) {
    if (CRYPTO_TYPES.has(input.type)) {
      if (!input.walletAddress?.trim()) {
        throw appError("VALIDATION_ERROR", "Crypto payout method requires walletAddress");
      }
      if (!input.network?.trim()) {
        throw appError("VALIDATION_ERROR", "Crypto payout method requires network");
      }
      return;
    }

    if (input.type === "PAYPAL" && !input.accountEmail?.trim()) {
      throw appError("VALIDATION_ERROR", "PayPal payout method requires accountEmail");
    }

    if (
      (input.type === "BANK_WIRE" || input.type === "LOCAL_BANK" || input.type === "WISE") &&
      !input.accountNumber?.trim()
    ) {
      throw appError("VALIDATION_ERROR", "Bank payout method requires accountNumber");
    }
  }
}

export const paymentMethodService = new PaymentMethodService();
