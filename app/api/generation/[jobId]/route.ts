import { canvasService } from "@/features/canvas/canvas.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ jobId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    const { jobId } = await params;
    const job = await canvasService.getJob(jobId, user);
    return apiSuccess(job);
  } catch (error) {
    return handleRouteError(error);
  }
}
