import { canvasDirectorService } from "@/features/canvas/canvas-director.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { canvasDirectorRequestSchema } from "@/lib/canvas/validation";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const input = canvasDirectorRequestSchema.parse(await request.json());
    const plan = await canvasDirectorService.createPlan(input, user);
    return apiSuccess(plan, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
