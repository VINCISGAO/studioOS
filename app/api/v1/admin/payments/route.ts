import { paymentCollectionService } from "@/features/payment/payment-collection.service";
import { requireAdminAuthUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    const user = await requireAdminAuthUser(request);
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 100);
    const offset = Number(searchParams.get("offset") ?? 0);
    const records = await paymentCollectionService.listForAdmin(user, { limit, offset });
    return apiSuccess({ items: records, total: records.length });
  } catch (error) {
    return handleRouteError(error);
  }
}
