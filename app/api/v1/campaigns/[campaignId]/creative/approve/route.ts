import { z } from "zod";
import { creativeDirectionService } from "@/features/ai/creative-direction.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

const approveSchema = z.object({
  direction_id: z.string().uuid()
});

type Params = { params: Promise<{ campaignId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const body = approveSchema.parse(await request.json());
    const { selected, frozen } = await creativeDirectionService.approve(
      campaignId,
      { id: user.id, role: user.role },
      body.direction_id
    );
    return apiSuccess({ selected, frozen });
  } catch (error) {
    return handleRouteError(error);
  }
}
