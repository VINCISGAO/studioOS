import { membershipStripeService } from "@/features/membership/membership-expiration.service";
import { stripeCheckoutSchema } from "@/features/membership/membership.schemas";
import { PermissionService } from "@/features/auth/permission.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    PermissionService.assert(user, "membership.upgrade");
    const body = stripeCheckoutSchema.parse(await request.json());
    const session = await membershipStripeService.createUpgradeCheckoutSession(
      user.id,
      body.successUrl,
      body.cancelUrl
    );
    return apiSuccess(session);
  } catch (error) {
    return handleRouteError(error);
  }
}
