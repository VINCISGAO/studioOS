import { z } from "zod";
import { creditWalletService } from "@/features/credit-wallet/credit-wallet.service";
import { earningInputToUsdMinor, marketCurrencyForUiLocale } from "@/lib/credits/market-currency";
import { getAppUiLocale } from "@/lib/app-language";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

const quoteSchema = z.object({
  earningAmountMinor: z.number().int().positive()
});

const convertSchema = z.object({
  earningAmountMinor: z.number().int().positive(),
  idempotencyKey: z.string().uuid(),
  confirmed: z.literal(true)
});

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const uiLocale = await getAppUiLocale();
    const marketCurrency = marketCurrencyForUiLocale(uiLocale);
    const url = new URL(request.url);
    const inputMinor = Number(url.searchParams.get("earningAmountMinor") ?? "0");
    const earningAmountUsdMinor = earningInputToUsdMinor(inputMinor, marketCurrency);
    const quote = await creditWalletService.quoteEarningConversion(
      user.id,
      earningAmountUsdMinor,
      uiLocale
    );
    return apiSuccess(quote);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const input = convertSchema.parse(await request.json());
    const result = await creditWalletService.convertEarnings(user, input);
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
