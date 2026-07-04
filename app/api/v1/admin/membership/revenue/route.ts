import { membershipAdminService } from "@/features/membership/membership-admin.service";
import { requireAdminAuthUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    const user = await requireAdminAuthUser(request);
    const url = new URL(request.url);
    const since = url.searchParams.get("since");
    const revenue = await membershipAdminService.getPlatformRevenue(
      user,
      since ? new Date(since) : undefined
    );
    return apiSuccess(revenue);
  } catch (error) {
    return handleRouteError(error);
  }
}
