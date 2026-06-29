import { z } from "zod";
import { invitationService } from "@/features/matching/invitation.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

const sendSchema = z.object({
  creator_profile_ids: z.array(z.string().uuid()).min(1).max(5)
});

type Params = { params: Promise<{ campaignId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const items = await invitationService.list(campaignId, { id: user.id, role: user.role });
    return apiSuccess({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const body = sendSchema.parse(await request.json());
    const items = await invitationService.send(campaignId, { id: user.id, role: user.role }, body.creator_profile_ids);
    return apiSuccess({ items }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
