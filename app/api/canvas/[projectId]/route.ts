import { canvasService } from "@/features/canvas/canvas.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    const { projectId } = await params;
    const snapshot = await canvasService.getOrCreateSnapshot(projectId, user);
    return apiSuccess(snapshot);
  } catch (error) {
    return handleRouteError(error);
  }
}
