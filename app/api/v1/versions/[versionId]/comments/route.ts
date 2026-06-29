import { createReviewCommentSchema } from "@/features/review/review.schemas";
import { reviewService } from "@/features/review/review.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ versionId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { versionId } = await params;
    const items = await reviewService.listComments(versionId, { id: user.id, role: user.role });
    return apiSuccess({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { versionId } = await params;
    const body = createReviewCommentSchema.parse(await request.json());
    const comment = await reviewService.createCommentForUser(versionId, { id: user.id, role: user.role }, body);
    return apiSuccess(comment, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
