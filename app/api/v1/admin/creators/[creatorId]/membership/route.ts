import { membershipAdminService } from "@/features/membership/membership-admin.service";
import {
  extendMembershipSchema,
  refundMembershipSchema
} from "@/features/membership/membership.schemas";
import { requireAdminAuthUser, requireAdminMutationUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

type Params = { params: Promise<{ creatorId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireAdminAuthUser(request);
    const { creatorId } = await params;
    const [history, commissions] = await Promise.all([
      membershipAdminService.getCreatorHistory(user, creatorId),
      membershipAdminService.getCommissionHistory(user, creatorId)
    ]);
    return apiSuccess({ history, commissions });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireAdminMutationUser(request);
    const { creatorId } = await params;
    const body = (await request.json()) as { action: string; note?: string; extraDays?: number; membershipId?: string };

    switch (body.action) {
      case "upgrade":
        return apiSuccess(await membershipAdminService.manualUpgrade(user, creatorId, body.note));
      case "downgrade":
        return apiSuccess(await membershipAdminService.manualDowngrade(user, creatorId, body.note));
      case "extend": {
        const parsed = extendMembershipSchema.parse(body);
        return apiSuccess(
          await membershipAdminService.extendMembership(user, creatorId, parsed.extraDays, parsed.note)
        );
      }
      case "refund": {
        const parsed = refundMembershipSchema.parse(body);
        return apiSuccess(
          await membershipAdminService.refundMembership(user, creatorId, parsed.membershipId, parsed.note)
        );
      }
      default:
        return handleRouteError(new Error("Unknown action"));
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
