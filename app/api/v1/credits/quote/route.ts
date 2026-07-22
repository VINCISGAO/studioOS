import { z } from "zod";
import { creditGenerationBillingService } from "@/features/credit-wallet/credit-generation-billing.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

const quoteSchema = z.object({
  type: z.enum(["IMAGE", "VIDEO", "MUSIC"]),
  model: z.string().trim().min(1).max(120),
  parameters: z.record(z.unknown()).default({})
});

export async function POST(request: Request) {
  try {
    await requireApiUser(request);
    const input = quoteSchema.parse(await request.json());
    const quote = await creditGenerationBillingService.quoteGenerationDetailed(input);
    return apiSuccess({ quote });
  } catch (error) {
    return handleRouteError(error);
  }
}
