import { creativeDirectionService } from "@/features/ai/creative-direction.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ campaignId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const bundle = await creativeDirectionService.getCreativeBundle(campaignId, {
      id: user.id,
      role: user.role
    });
    return apiSuccess(bundle);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const url = new URL(request.url);
    const asyncMode = url.searchParams.get("async") === "1";

    if (asyncMode) {
      const queued = await creativeDirectionService.generateAsync(campaignId, {
        id: user.id,
        role: user.role
      });
      return apiSuccess(queued, 202);
    }

    const directions = await creativeDirectionService.generate(campaignId, {
      id: user.id,
      role: user.role
    });
    return apiSuccess({ directions, count: directions.length }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
