import { creatorProjectPortalService } from "@/features/portal/creator-project-portal.service";
import { getCurrentCreatorId } from "@/features/auth/session-context";
import { getAppUiLocale } from "@/lib/app-language";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";
import type { CreatorProjectPortalDetailResponse } from "@/features/portal/portal.types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await requireApiUser(request);
    const { orderId } = await params;
    const creatorId = await getCurrentCreatorId();
    if (!creatorId) {
      throw appError("UNAUTHORIZED", "Not authenticated", 401);
    }
    const locale = await getAppUiLocale();

    const detail = await creatorProjectPortalService.getDetail({
      orderId,
      locale,
      creatorId
    });

    const payload: CreatorProjectPortalDetailResponse = {
      version: "v1",
      generatedAt: new Date().toISOString(),
      detail
    };

    return apiSuccess(payload);
  } catch (error) {
    return handleRouteError(error);
  }
}
