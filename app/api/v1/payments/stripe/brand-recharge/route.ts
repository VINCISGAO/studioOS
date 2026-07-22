import { z } from "zod";
import { platformPaymentService } from "@/features/payment/platform-payment.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

const schema = z.object({
  amountUsd: z.number().positive().max(100_000),
  successPath: z.string().max(500).optional(),
  cancelPath: z.string().max(500).optional()
});

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    if (user.role !== "BRAND") {
      return handleRouteError(new Error("Brand account required"));
    }
    const input = schema.parse(await request.json());
    const checkout = await platformPaymentService.createBrandWalletRechargeCheckout({
      brandUserId: user.id,
      amountUsd: input.amountUsd,
      successPath: input.successPath,
      cancelPath: input.cancelPath
    });
    return apiSuccess(checkout, 202);
  } catch (error) {
    return handleRouteError(error);
  }
}
