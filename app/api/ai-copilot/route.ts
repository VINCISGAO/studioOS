import { z } from "zod";
import { requireAiCopilotUser } from "@/features/ai-copilot/ai-copilot-auth";
import { aiCopilotService } from "@/features/ai-copilot/ai-copilot.service";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";
import { readOpenAIApiKey } from "@/lib/core/config/openai-key";

const copilotRequestSchema = z.object({
  sessionId: z.string().optional().nullable(),
  message: z.string().min(1).max(4000),
  pagePath: z.string().max(500).optional().nullable(),
  entityType: z.string().max(100).optional().nullable(),
  entityId: z.string().max(200).optional().nullable(),
  languageCode: z.string().max(20).optional().nullable()
});

const copilotFeedbackSchema = z.object({
  messageId: z.string().min(1),
  rating: z.enum(["HELPFUL", "NOT_HELPFUL"]),
  languageCode: z.string().max(20).optional().nullable()
});

export async function GET(request: Request) {
  try {
    const user = await requireAiCopilotUser(request);
    const searchParams = new URL(request.url).searchParams;
    const sessionId = searchParams.get("sessionId");
    const languageCode = searchParams.get("languageCode");
    if (sessionId) {
      const data = await aiCopilotService.getSession(user, sessionId, { languageCode });
      return apiSuccess(data);
    }
    const data = await aiCopilotService.listSessions(user, { languageCode });
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    readOpenAIApiKey();
    const user = await requireAiCopilotUser(request);
    const body = copilotRequestSchema.parse(await request.json());
    const data = await aiCopilotService.answer(user, body);
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAiCopilotUser(request);
    const body = copilotFeedbackSchema.parse(await request.json());
    const data = await aiCopilotService.recordFeedback(user, body);
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
