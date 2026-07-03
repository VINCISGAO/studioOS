import { invitationService } from "@/features/matching/invitation.service";
import { parseInvitationDeclineFeedback } from "@/features/matching/invitation-decline-feedback";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

type Params = { params: Promise<{ invitationId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { invitationId } = await params;
    const feedback = parseInvitationDeclineFeedback(await request.json());
    if (!feedback.success) {
      throw appError("VALIDATION_ERROR", "Structured decline feedback is required");
    }
    const invitation = await invitationService.decline(
      invitationId,
      { id: user.id, role: user.role },
      feedback.data
    );
    return apiSuccess({ invitation });
  } catch (error) {
    return handleRouteError(error);
  }
}
