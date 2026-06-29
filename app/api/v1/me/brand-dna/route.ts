import { memoryService } from "@/features/memory/memory.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function GET() {
  try {
    const user = await requireApiUser();
    const dna = await memoryService.getBrandDna({ id: user.id, role: user.role });
    return apiSuccess({ brandDna: dna });
  } catch (error) {
    return handleRouteError(error);
  }
}
