import { executeCreativeCollaborationRequest } from "@/features/creative-collaboration/creative-collaboration.api";
import { getCurrentClientEmail } from "@/lib/client-session";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await requireApiUser(request);
    const { projectId } = await params;
    const clientEmail = await getCurrentClientEmail();
    if (!clientEmail) {
      throw appError("UNAUTHORIZED", "Brand session required", 401);
    }

    const payload = await executeCreativeCollaborationRequest({
      projectId,
      request,
      actor: {
        role: "brand",
        userId: clientEmail,
        brandEmail: clientEmail
      }
    });

    return apiSuccess(payload);
  } catch (error) {
    return handleRouteError(error);
  }
}
