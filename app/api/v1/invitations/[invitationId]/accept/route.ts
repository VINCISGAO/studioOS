import { invitationService } from "@/features/matching/invitation.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ invitationId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { invitationId } = await params;
    const invitation = await invitationService.accept(invitationId, { id: user.id, role: user.role });
    return apiSuccess({ invitation });
  } catch (error) {
    return handleRouteError(error);
  }
}
