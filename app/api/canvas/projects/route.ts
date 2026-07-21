import { canvasService } from "@/features/canvas/canvas.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { z } from "zod";

const createProjectSchema = z.object({
  title: z.string().trim().max(120).optional()
});

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const input = createProjectSchema.parse(await request.json().catch(() => ({})));
    const project = await canvasService.createStandaloneProject(user, input.title);
    return apiSuccess({ id: project.id, title: project.title });
  } catch (error) {
    return handleRouteError(error);
  }
}
