import { canvasDirectorService } from "@/features/canvas/canvas-director.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { canvasDirectorApplySchema } from "@/lib/canvas/validation";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const input = canvasDirectorApplySchema.parse(await request.json());
    const snapshot = await canvasDirectorService.applyPlan(input.projectId, input.plan, user);
    return apiSuccess(snapshot);
  } catch (error) {
    return handleRouteError(error);
  }
}
