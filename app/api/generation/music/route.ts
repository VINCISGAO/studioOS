import { canvasService } from "@/features/canvas/canvas.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { musicGenerationSchema } from "@/lib/canvas/validation";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const input = musicGenerationSchema.parse(await request.json());
    const job = await canvasService.createMockGeneration(
      {
        projectId: input.projectId,
        nodeId: input.nodeId,
        type: "MUSIC",
        prompt: input.prompt,
        model: input.model,
        idempotencyKey: input.idempotencyKey,
        parameters: {
          duration: input.duration,
          instrumental: input.instrumental,
          mode: input.mode,
          style: input.style,
          mood: input.mood
        }
      },
      user
    );
    return apiSuccess(job, 202);
  } catch (error) {
    return handleRouteError(error);
  }
}
