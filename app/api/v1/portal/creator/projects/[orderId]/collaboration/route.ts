import { executeCreativeCollaborationRequest } from "@/features/creative-collaboration/creative-collaboration.api";
import { getCurrentCreatorId } from "@/lib/creator-session";
import { getOrder } from "@/lib/order-service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await requireApiUser(request);
    const { orderId } = await params;
    const creatorId = await getCurrentCreatorId();
    if (!creatorId) {
      throw appError("UNAUTHORIZED", "Creator session required", 401);
    }

    const order = await getOrder(orderId);
    if (!order || order.creator_id !== creatorId || !order.project_id) {
      throw appError("FORBIDDEN", "Access denied", 403);
    }

    const payload = await executeCreativeCollaborationRequest({
      projectId: order.project_id,
      request,
      actor: {
        role: "creator",
        userId: creatorId,
        creatorId
      }
    });

    return apiSuccess(payload);
  } catch (error) {
    return handleRouteError(error);
  }
}
