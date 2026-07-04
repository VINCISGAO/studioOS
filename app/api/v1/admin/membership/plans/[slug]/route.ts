import { membershipAdminService } from "@/features/membership/membership-admin.service";
import { membershipPlanSchema } from "@/features/membership/membership.schemas";
import { requireAdminMutationUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

type Params = { params: Promise<{ slug: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireAdminMutationUser(request);
    const { slug } = await params;
    const body = membershipPlanSchema.parse(await request.json());
    const plan = await membershipAdminService.updatePlan(user, slug, body);
    return apiSuccess({ plan });
  } catch (error) {
    return handleRouteError(error);
  }
}
