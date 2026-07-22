import { creditWalletRepository } from "@/features/credit-wallet/credit-wallet.repository";
import {
  serializeCreditPackage,
  serializeCreditPurchaseOrder,
  serializeCreditTransaction,
  serializeCreditWalletSummary,
  serializeEarningConversion
} from "@/features/credit-wallet/credit-wallet.serializer";
import { creditPurchaseService } from "@/features/credit-wallet/credit-purchase.service";
import type { AuthUserDto } from "@/features/auth/auth.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import {
  earningDisplayFromUsdMinor,
  formatMarketAmount,
  marketCurrencyForUiLocale,
  usdMinorToCnyMinor
} from "@/lib/credits/market-currency";
import type { Locale } from "@/lib/i18n";

function monthStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export class CreditWalletService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  async getDashboard(user: AuthUserDto, uiLocale?: Locale | null) {
    this.assertDb();
    const marketCurrency = marketCurrencyForUiLocale(uiLocale);
    const [wallet, earningWallet, recentTransactions, monthSpentAgg] = await Promise.all([
      creditWalletRepository.getOrCreateWallet(user.id),
      creditWalletRepository.getOrCreateEarningWallet(user.id),
      creditWalletRepository.listTransactions(user.id, 8),
      creditWalletRepository.sumMonthSpent(user.id, monthStart())
    ]);

    const earningDisplay = earningDisplayFromUsdMinor(
      earningWallet.availableBalanceMinor,
      marketCurrency
    );
    const tokenUsdMinor = wallet.availableCredits + wallet.reservedCredits;
    const totalUsdMinor = tokenUsdMinor + earningWallet.availableBalanceMinor;
    const accountNetMinor =
      marketCurrency === "CNY" ? usdMinorToCnyMinor(totalUsdMinor) : totalUsdMinor;

    return {
      summary: serializeCreditWalletSummary({
        wallet,
        monthSpent: monthSpentAgg._sum.amount ?? 0,
        expiringCredits: 0
      }),
      earningAvailableMinor: earningDisplay.amountMinor,
      earningCurrency: earningDisplay.currency,
      accountNetDisplay: formatMarketAmount(marketCurrency, accountNetMinor, uiLocale),
      recentTransactions: recentTransactions.map(serializeCreditTransaction)
    };
  }

  async getBalance(userId: string) {
    this.assertDb();
    const wallet = await creditWalletRepository.getOrCreateWallet(userId);
    return {
      availableCredits: wallet.availableCredits,
      reservedCredits: wallet.reservedCredits,
      totalCredits: wallet.availableCredits + wallet.reservedCredits
    };
  }

  async listPackages() {
    this.assertDb();
    const rows = await creditWalletRepository.listActivePackages();
    return rows.map(serializeCreditPackage);
  }

  async listTransactions(userId: string, limit = 50) {
    this.assertDb();
    const rows = await creditWalletRepository.listTransactions(userId, limit);
    return rows.map(serializeCreditTransaction);
  }

  async listPurchaseOrders(userId: string, limit = 20) {
    this.assertDb();
    const rows = await creditWalletRepository.listPurchaseOrders(userId, limit);
    return rows.map(serializeCreditPurchaseOrder);
  }

  async getPurchaseOrder(user: AuthUserDto, orderId: string) {
    this.assertDb();
    const order = await creditPurchaseService.getOrderForUser(user.id, orderId);
    return serializeCreditPurchaseOrder(order);
  }

  async quoteEarningConversion(
    userId: string,
    earningAmountUsdMinor: number,
    uiLocale?: Locale | null
  ) {
    this.assertDb();
    if (!Number.isInteger(earningAmountUsdMinor) || earningAmountUsdMinor <= 0) {
      throw appError("VALIDATION_ERROR", "Invalid conversion amount");
    }

    const marketCurrency = marketCurrencyForUiLocale(uiLocale);
    const [config, earningWallet] = await Promise.all([
      creditWalletRepository.getExchangeRateConfig("USD"),
      creditWalletRepository.getOrCreateEarningWallet(userId)
    ]);
    if (!config) throw appError("SYSTEM_ERROR", "Credit exchange rate is not configured");

    const creditsPerDollar = config.creditsPerUnitMinor;
    const creditsGranted = Math.floor((earningAmountUsdMinor * creditsPerDollar) / 100);
    const earningAvailableDisplay = earningDisplayFromUsdMinor(
      earningWallet.availableBalanceMinor,
      marketCurrency
    );

    return {
      earningAmountMinor: earningAmountUsdMinor,
      displayAmountMinor: earningDisplayFromUsdMinor(earningAmountUsdMinor, marketCurrency).amountMinor,
      displayCurrency: marketCurrency,
      earningAvailableMinor: earningAvailableDisplay.amountMinor,
      earningAvailableUsdMinor: earningWallet.availableBalanceMinor,
      creditsGranted,
      exchangeRateSnapshot: {
        currency: config.currency,
        creditsPerUnitMinor: config.creditsPerUnitMinor,
        proBonusPercent: config.proBonusPercent,
        promoBonusPercent: config.promoBonusPercent,
        quotedAt: new Date().toISOString()
      },
      irreversible: true as const
    };
  }

  async convertEarnings(
    user: AuthUserDto,
    input: { earningAmountMinor: number; idempotencyKey: string; confirmed?: boolean }
  ) {
    this.assertDb();
    if (input.confirmed !== true) {
      throw appError("VALIDATION_ERROR", "Conversion requires explicit confirmation");
    }

    const quote = await this.quoteEarningConversion(user.id, input.earningAmountMinor);
    if (quote.earningAvailableUsdMinor < input.earningAmountMinor) {
      throw appError("VALIDATION_ERROR", "Insufficient earning balance");
    }
    if (quote.creditsGranted <= 0) {
      throw appError("VALIDATION_ERROR", "Conversion amount too small");
    }

    const conversion = await creditWalletRepository.convertEarnings({
      userId: user.id,
      earningAmountMinor: input.earningAmountMinor,
      creditsGranted: quote.creditsGranted,
      exchangeRateSnapshot: quote.exchangeRateSnapshot,
      idempotencyKey: input.idempotencyKey
    });

    return {
      conversionId: conversion.id,
      creditsGranted: conversion.creditsGranted,
      earningAmountMinor: conversion.earningAmountMinor,
      exchangeRateSnapshot: conversion.exchangeRateSnapshot,
      earningTransactionId: conversion.earningTransactionId,
      creditTransactionId: conversion.creditTransactionId,
      completedAt: conversion.completedAt?.toISOString() ?? null
    };
  }

  async listEarningConversions(userId: string, limit = 20) {
    this.assertDb();
    const rows = await creditWalletRepository.listEarningConversions(userId, limit);
    return rows.map(serializeEarningConversion);
  }
}

export const creditWalletService = new CreditWalletService();
