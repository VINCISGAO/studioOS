import { brandProjectPortalService } from "@/features/portal/brand-project-portal.service";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getAppUiLocale } from "@/lib/app-language";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import type { BrandProjectPortalDetailResponse } from "@/features/portal/portal.types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await requireApiUser(request);
    const { projectId } = await params;
    const clientEmail = await getCurrentClientEmail();
    const tab = new URL(request.url).searchParams.get("tab");
    const locale = await getAppUiLocale();

    const detail = await brandProjectPortalService.getDetail({
      projectId,
      locale,
      clientEmail,
      tab
    });

    const payload: BrandProjectPortalDetailResponse = {
      version: "v1",
      generatedAt: new Date().toISOString(),
      detail
    };

    return apiSuccess(payload);
  } catch (error) {
    return handleRouteError(error);
  }
}
