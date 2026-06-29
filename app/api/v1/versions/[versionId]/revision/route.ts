import { z } from "zod";
import { reviewDecisionService } from "@/features/review/review-decision.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

const revisionSchema = z.object({
  note: z.string().trim().max(2000).optional()
});

type Params = { params: Promise<{ versionId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { versionId } = await params;
    let note: string | undefined;
    try {
      const body = await request.json();
      note = revisionSchema.parse(body).note;
    } catch {
      note = undefined;
    }

    const result = await reviewDecisionService.requestRevision(versionId, {
      id: user.id,
      role: user.role
    }, note);

    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
