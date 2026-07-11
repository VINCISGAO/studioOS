import { z } from "zod";
import { publicLucienService } from "@/features/ai-copilot/public-lucien.service";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";
import { enforceApiRateLimit } from "@/lib/core/security/rate-limit.service";
import { normalizePublicLucienPagePath } from "@/lib/marketing/public-lucien-paths";

const publicLucienRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  languageCode: z.string().max(20).optional().nullable(),
  guestSessionId: z.string().max(64).optional().nullable(),
  pagePath: z.string().max(200).optional().nullable()
});

export async function POST(request: Request) {
  try {
    await enforceApiRateLimit(request, "/api/public-lucien");
    const body = publicLucienRequestSchema.parse(await request.json());
    const data = await publicLucienService.answer({
      ...body,
      pagePath: normalizePublicLucienPagePath(body.pagePath)
    });
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
