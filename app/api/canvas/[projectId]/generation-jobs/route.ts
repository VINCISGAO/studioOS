import { canvasService } from "@/features/canvas/canvas.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    const { projectId } = await params;
    const jobs = await canvasService.listReconcileJobEvents(projectId, user);
    return apiSuccess(jobs);
  } catch (error) {
    return handleRouteError(error);
  }
}
