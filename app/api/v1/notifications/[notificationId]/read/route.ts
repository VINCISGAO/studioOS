import { bootstrapEventSystem } from "@/features/events/bootstrap";
import { notificationService } from "@/features/notification/notification.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ notificationId: string }> };

export async function PATCH(_request: Request, { params }: Params) {
  try {
    bootstrapEventSystem();
    const user = await requireApiUser();
    const { notificationId } = await params;
    const result = await notificationService.markRead(notificationId, { id: user.id, role: user.role });
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
