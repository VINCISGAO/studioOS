import { creatorPortalService } from "@/features/creator/creator-portal.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { getCurrentCreatorId } from "@/features/auth/session-context";
import { listOrdersForCreator } from "@/lib/order-service";

export async function GET() {
  try {
    const user = await requireApiUser();
    const creatorId = await getCurrentCreatorId();
    const orders = creatorId ? await listOrdersForCreator(creatorId) : [];
    const dashboard = await creatorPortalService.getDashboard(user, orders);
    return apiSuccess({ dashboard, orders });
  } catch (error) {
    return handleRouteError(error);
  }
}
