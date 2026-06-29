import { aiJobService } from "@/features/ai/ai-job.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { jobId } = await params;
    const job = await aiJobService.getJob(jobId, { id: user.id, role: user.role });
    return apiSuccess(job);
  } catch (error) {
    return handleRouteError(error);
  }
}
