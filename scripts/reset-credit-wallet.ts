/**
 * Reset Token / Credits wallet test data for one creator account.
 *
 * Run:
 *   VINCIS_RESET_CREDIT_WALLET=YES VINCIS_RESET_CREDIT_WALLET_EMAIL=you@example.com npm run reset:credit-wallet
 *
 * Clears credit transactions, purchase orders, reservations, conversions;
 * zeros credit wallet counters; restores earnings deducted by past conversions.
 */
import { PrismaClient } from "@prisma/client";

const CONFIRM_ENV = "VINCIS_RESET_CREDIT_WALLET";
const CONFIRM_VALUE = "YES";
const EMAIL_ENV = "VINCIS_RESET_CREDIT_WALLET_EMAIL";
const ZERO_EARNINGS_ENV = "VINCIS_RESET_CREDIT_WALLET_ZERO_EARNINGS";

async function resetUserCreditWallet(
  prisma: PrismaClient,
  userId: string,
  email: string,
  zeroEarnings: boolean
) {
  const summary = await prisma.$transaction(async (tx) => {
    const conversions = await tx.earningToCreditConversion.findMany({
      where: { userId },
      select: { earningAmountMinor: true }
    });
    const restoredEarningsMinor = conversions.reduce(
      (sum, row) => sum + row.earningAmountMinor,
      0
    );

    const [
      transactionsBefore,
      ordersBefore,
      reservationsBefore,
      conversionsBefore
    ] = await Promise.all([
      tx.creditTransaction.count({ where: { userId } }),
      tx.creditPurchaseOrder.count({ where: { userId } }),
      tx.creditReservation.count({ where: { userId } }),
      tx.earningToCreditConversion.count({ where: { userId } })
    ]);

    await tx.generationJob.updateMany({
      where: { ownerId: userId, creditReservationId: { not: null } },
      data: { creditReservationId: null }
    });

    const orderIds = (
      await tx.creditPurchaseOrder.findMany({
        where: { userId },
        select: { id: true }
      })
    ).map((order) => order.id);

    if (orderIds.length > 0) {
      await tx.creditPurchaseRefundEvent.deleteMany({
        where: { orderId: { in: orderIds } }
      });
    }

    await tx.earningToCreditConversion.deleteMany({ where: { userId } });
    await tx.creatorEarningTransaction.deleteMany({
      where: { userId, type: "CONVERSION_OUT" }
    });
    await tx.creditTransaction.deleteMany({ where: { userId } });
    await tx.creditReservation.deleteMany({ where: { userId } });
    await tx.creditPurchaseOrder.deleteMany({ where: { userId } });

    const wallet = await tx.creditWallet.findUnique({ where: { userId } });
    if (wallet) {
      await tx.creditWallet.update({
        where: { id: wallet.id },
        data: {
          availableCredits: 0,
          reservedCredits: 0,
          lifetimePurchased: 0,
          lifetimeBonus: 0,
          lifetimeSpent: 0,
          lifetimeRefunded: 0,
          purchaseBlocked: false,
          version: wallet.version + 1
        }
      });
    }

    if (zeroEarnings) {
      const earningWallet = await tx.creatorEarningWallet.findUnique({ where: { userId } });
      if (earningWallet) {
        await tx.creatorEarningWallet.update({
          where: { id: earningWallet.id },
          data: {
            availableBalanceMinor: 0,
            version: earningWallet.version + 1
          }
        });
      }
    } else if (restoredEarningsMinor > 0) {
      const earningWallet = await tx.creatorEarningWallet.findUnique({ where: { userId } });
      if (earningWallet) {
        await tx.creatorEarningWallet.update({
          where: { id: earningWallet.id },
          data: {
            availableBalanceMinor: earningWallet.availableBalanceMinor + restoredEarningsMinor,
            version: earningWallet.version + 1
          }
        });
      }
    }

    return {
      email,
      transactionsBefore,
      ordersBefore,
      reservationsBefore,
      conversionsBefore,
      restoredEarningsMinor
    };
  }, { timeout: 60_000 });

  return summary;
}

async function main() {
  if (process.env[CONFIRM_ENV] !== CONFIRM_VALUE) {
    throw new Error(`Refusing reset. Set ${CONFIRM_ENV}=${CONFIRM_VALUE}.`);
  }

  const email = process.env[EMAIL_ENV]?.trim().toLowerCase();
  if (!email) {
    throw new Error(`Set ${EMAIL_ENV} to the creator account email to reset.`);
  }

  const databaseUrl =
    process.env.DIRECT_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim() || "";
  if (!databaseUrl) throw new Error("DATABASE_URL is not set.");

  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true }
    });
    if (!user) throw new Error(`User not found: ${email}`);
    if (user.role !== "CREATOR") {
      throw new Error(`User ${email} is not a CREATOR account.`);
    }

    const result = await resetUserCreditWallet(
      prisma,
      user.id,
      user.email,
      process.env[ZERO_EARNINGS_ENV] === CONFIRM_VALUE
    );
    const wallet = await prisma.creditWallet.findUnique({ where: { userId: user.id } });
    const earningWallet = await prisma.creatorEarningWallet.findUnique({
      where: { userId: user.id }
    });

    console.log("Credit wallet reset complete.");
    console.log(`  user: ${result.email}`);
    console.log(`  removed transactions: ${result.transactionsBefore}`);
    console.log(`  removed purchase orders: ${result.ordersBefore}`);
    console.log(`  removed reservations: ${result.reservationsBefore}`);
    console.log(`  removed conversions: ${result.conversionsBefore}`);
    console.log(
      `  restored earnings: $${(result.restoredEarningsMinor / 100).toFixed(2)}`
    );
    console.log(`  token balance: ${wallet?.availableCredits ?? 0}`);
    console.log(
      `  available earnings: $${((earningWallet?.availableBalanceMinor ?? 0) / 100).toFixed(2)}`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
