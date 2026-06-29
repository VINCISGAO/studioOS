import { bootstrapEventSystem } from "@/features/events/bootstrap";
import { notificationService } from "@/features/notification/notification.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function POST() {
  try {
    bootstrapEventSystem();
    const user = await requireApiUser();
    const result = await notificationService.markAllRead({ id: user.id, role: user.role });
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
