import { brandPortalService } from "@/features/brand/brand-portal.service";
import { getCurrentClientEmail } from "@/lib/client-session";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { listOrdersForClient } from "@/lib/order-service";
import { listProjectsForClient } from "@/lib/project-service";

export async function GET() {
  try {
    const user = await requireApiUser();
    const clientEmail = await getCurrentClientEmail();
    const [orders, projects] = clientEmail
      ? await Promise.all([
          listOrdersForClient(clientEmail),
          listProjectsForClient(clientEmail)
        ])
      : [[], []];

    const dashboard = await brandPortalService.getDashboard(user, orders, projects);

    return apiSuccess({ dashboard, orders, projects });
  } catch (error) {
    return handleRouteError(error);
  }
}
