import { z } from "zod";
import { stripeConnectWithdrawalService } from "@/features/payment/stripe-connect-withdrawal.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

const schema = z.object({
  amountUsd: z.number().positive()
});

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    if (user.role !== "CREATOR") {
      return handleRouteError(new Error("Creator account required"));
    }
    const input = schema.parse(await request.json());
    const result = await stripeConnectWithdrawalService.submitWithdrawal(user, input.amountUsd);
    return apiSuccess(result, 202);
  } catch (error) {
    return handleRouteError(error);
  }
}
