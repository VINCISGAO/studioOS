import { canvasRepository } from "@/features/canvas/canvas.repository";
import { logger } from "@/lib/core/logger";
import type { SeedanceTask } from "@/lib/canvas/seedance-client";
import { readSeedanceWebhookSecret } from "@/lib/core/config/seedance-key";

function readBearerToken(request: Request) {
  const header = request.headers.get("authorization")?.trim() ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim();
}

function assertSeedanceWebhookAuthorized(request: Request) {
  const secret = readSeedanceWebhookSecret();
  if (!secret) return;

  const token = readBearerToken(request);
  if (!token || token !== secret) {
    return new Response(null, { status: 401 });
  }

  return null;
}

export async function POST(request: Request) {
  const unauthorized = assertSeedanceWebhookAuthorized(request);
  if (unauthorized) return unauthorized;

  let payload: SeedanceTask;
  try {
    payload = (await request.json()) as SeedanceTask;
  } catch {
    return new Response(null, { status: 400 });
  }

  const taskId = payload.id?.trim();
  if (!taskId) {
    return new Response(null, { status: 400 });
  }

  const job = await canvasRepository.findGenerationJobByProviderTaskId(taskId);
  if (!job) {
    logger.warn("Seedance webhook received unknown task", {
      service: "SeedanceWebhook",
      taskId,
      status: payload.status
    });
    return new Response(null, { status: 200 });
  }

  logger.info("Seedance webhook received", {
    service: "SeedanceWebhook",
    taskId,
    jobId: job.id,
    status: payload.status,
    billingStatus: payload.billing_status ?? null
  });

  return new Response(null, { status: 200 });
}
