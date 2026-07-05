import { aiWorkerService } from "@/features/ai/ai-worker.service";
import { requireAdminMutationUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

/** Dev/admin — process next queued AI job. */
export async function POST(request: Request) {
  try {
    await requireAdminMutationUser(request);
    const result = await aiWorkerService.processNextWaiting();
    return apiSuccess({ processed: result });
  } catch (error) {
    return handleRouteError(error);
  }
}
