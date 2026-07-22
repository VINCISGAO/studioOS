import { canvasService } from "@/features/canvas/canvas.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { videoGenerationSchema } from "@/lib/canvas/validation";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const input = videoGenerationSchema.parse(await request.json());
    const job = await canvasService.createMockGeneration(
      {
        projectId: input.projectId,
        nodeId: input.nodeId,
        type: "VIDEO",
        prompt: input.prompt,
        model: input.model,
        idempotencyKey: input.idempotencyKey,
        parameters: {
          aspectRatio: input.aspectRatio,
          duration: input.duration,
          quality: input.quality,
          audio: input.audio,
          webSearch: input.webSearch,
          cameraMovements: input.cameraMovements,
          referenceAssetId: input.referenceAssetId,
          referenceUrl: input.referenceUrl,
          referenceNodeId: input.referenceNodeId,
          mode: input.mode
        }
      },
      user
    );
    return apiSuccess(job, 202);
  } catch (error) {
    return handleRouteError(error);
  }
}
