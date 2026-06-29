import { z } from "zod";
import { withdrawService } from "@/features/wallet/withdraw.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

const withdrawSchema = z.object({
  amount_usd: z.number().positive()
});

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = withdrawSchema.parse(await request.json());
    const result = await withdrawService.requestWithdraw(
      { id: user.id, role: user.role },
      body.amount_usd
    );
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
