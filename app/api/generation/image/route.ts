import { canvasService } from "@/features/canvas/canvas.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { imageGenerationSchema } from "@/lib/canvas/validation";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const input = imageGenerationSchema.parse(await request.json());
    const job = await canvasService.createMockGeneration(
      {
        projectId: input.projectId,
        nodeId: input.nodeId,
        type: "IMAGE",
        prompt: input.prompt,
        model: input.model,
        idempotencyKey: input.idempotencyKey,
        parameters: {
          aspectRatio: input.aspectRatio,
          resolution: input.resolution,
          outputs: input.outputs,
          quality: input.quality,
          width: input.width,
          height: input.height,
          referenceAssetId: input.referenceAssetId,
          referenceUrl: input.referenceUrl,
          referenceNodeId: input.referenceNodeId
        }
      },
      user
    );
    return apiSuccess(job, 202);
  } catch (error) {
    return handleRouteError(error);
  }
}
