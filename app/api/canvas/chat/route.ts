import { z } from "zod";
import { canvasChatService } from "@/features/canvas/canvas-chat.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

const canvasChatSchema = z
  .object({
    projectId: z.string().uuid(),
    message: z.string().trim().max(4000),
    sessionId: z.string().optional().nullable(),
    languageCode: z.string().max(20).optional().nullable(),
    referenceAssetId: z.string().uuid().optional().nullable()
  })
  .refine((value) => value.message.length >= 1 || Boolean(value.referenceAssetId), {
    message: "Message or reference image is required"
  });

const resetSchema = z.object({
  projectId: z.string().uuid(),
  sessionId: z.string().uuid().optional().nullable()
});

const feedbackSchema = z.object({
  projectId: z.string().uuid(),
  messageId: z.string().min(1),
  rating: z.enum(["HELPFUL", "NOT_HELPFUL"]),
  languageCode: z.string().max(20).optional().nullable()
});

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      return handleRouteError(new Error("projectId is required"));
    }
    z.string().uuid().parse(projectId);
    const data = await canvasChatService.getHistory(user, projectId);
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const input = canvasChatSchema.parse(await request.json());
    const data = await canvasChatService.chat(user, input);
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireApiUser(request);
    const input = feedbackSchema.parse(await request.json());
    const data = await canvasChatService.recordFeedback(user, input);
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireApiUser(request);
    const url = new URL(request.url);
    const body =
      request.headers.get("content-length") === "0"
        ? {}
        : ((await request.json().catch(() => ({}))) as Record<string, unknown>);
    const input = resetSchema.parse({
      projectId: url.searchParams.get("projectId") ?? body.projectId,
      sessionId: url.searchParams.get("sessionId") ?? body.sessionId
    });
    const data = await canvasChatService.resetSession(user, input.projectId, input.sessionId);
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
