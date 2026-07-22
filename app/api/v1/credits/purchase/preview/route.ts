import { z } from "zod";
import { creditPurchaseService } from "@/features/credit-wallet/credit-purchase.service";
import { getAppUiLocale } from "@/lib/app-language";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

const purchaseInputSchema = z
  .object({
    packageId: z.string().min(1).optional(),
    customCredits: z.number().int().positive().optional(),
    selectedRegion: z.string().optional()
  })
  .refine((value) => Boolean(value.packageId) !== Boolean(value.customCredits), {
    message: "Provide either packageId or customCredits"
  });

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const uiLocale = await getAppUiLocale();
    const input = purchaseInputSchema.parse(await request.json());
    const preview = await creditPurchaseService.previewCheckout(user, input, request, uiLocale);
    return apiSuccess({ preview });
  } catch (error) {
    return handleRouteError(error);
  }
}
