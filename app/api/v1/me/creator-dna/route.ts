import { memoryService } from "@/features/memory/memory.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function GET() {
  try {
    const user = await requireApiUser();
    const dna = await memoryService.getCreatorDna(user);
    return apiSuccess({ creatorDna: dna });
  } catch (error) {
    return handleRouteError(error);
  }
}
