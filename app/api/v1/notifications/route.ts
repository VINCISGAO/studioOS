import { bootstrapEventSystem } from "@/features/events/bootstrap";
import { notificationService } from "@/features/notification/notification.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    bootstrapEventSystem();
    const user = await requireApiUser();
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "30");
    const result = await notificationService.listForUser(
      { id: user.id, role: user.role },
      Number.isFinite(limit) ? limit : 30
    );
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
