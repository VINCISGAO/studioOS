import { membershipService } from "@/features/membership/membership.service";
import { PermissionService } from "@/features/auth/permission.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function GET() {
  try {
    const user = await requireApiUser();
    PermissionService.assert(user, "membership.read");
    const status = await membershipService.getCreatorMembershipStatus(user.id);
    const eligibility = await membershipService.getUpgradeEligibility(user.id);
    return apiSuccess({ status, eligibility });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireApiUser();
    PermissionService.assert(user, "membership.upgrade");
    const body = (await request.json()) as { action?: string };
    if (body.action === "decline_upgrade") {
      await membershipService.recordUpgradeDeclined(user.id);
      return apiSuccess({ ok: true });
    }
    return handleRouteError(new Error("Unknown action"));
  } catch (error) {
    return handleRouteError(error);
  }
}
