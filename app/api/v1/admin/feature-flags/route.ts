import { featureFlagService } from "@/features/admin/feature-flag.service";
import { featureFlagSchema } from "@/features/admin/admin.schemas";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function GET() {
  try {
    const user = await requireApiUser();
    const flags = await featureFlagService.list(user);
    return apiSuccess({ flags });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireApiUser();
    const body = featureFlagSchema.parse(await request.json());
    const flag = await featureFlagService.upsert(user, body);
    return apiSuccess({ flag });
  } catch (error) {
    return handleRouteError(error);
  }
}
