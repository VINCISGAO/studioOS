import { aiWorkerService } from "@/features/ai/ai-worker.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

/** Dev/admin — process next queued AI job. */
export async function POST() {
  try {
    const user = await requireApiUser();
    if (user.role.toUpperCase() !== "ADMIN") {
      throw appError("FORBIDDEN", "Admin only");
    }
    const result = await aiWorkerService.processNextWaiting();
    return apiSuccess({ processed: result });
  } catch (error) {
    return handleRouteError(error);
  }
}
