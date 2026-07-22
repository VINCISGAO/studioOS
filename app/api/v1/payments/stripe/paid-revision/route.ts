import { z } from "zod";
import { platformPaymentService } from "@/features/payment/platform-payment.service";
import { getAppUiLocale } from "@/lib/app-language";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

const schema = z.object({
  orderId: z.string().min(1),
  projectId: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    if (user.role !== "BRAND") {
      return handleRouteError(new Error("Brand account required"));
    }
    const locale = await getAppUiLocale();
    const input = schema.parse(await request.json());
    const checkout = await platformPaymentService.createPaidRevisionCheckout({
      orderId: input.orderId,
      projectId: input.projectId ?? null,
      brandEmail: user.email,
      locale
    });
    return apiSuccess(checkout, 202);
  } catch (error) {
    return handleRouteError(error);
  }
}
