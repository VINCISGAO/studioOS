import { z } from "zod";
import { canvasService } from "@/features/canvas/canvas.service";
import { handleRouteError, requireApiUser } from "@/lib/core/api-route";

const querySchema = z.object({ projectId: z.string().uuid() });

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const { projectId } = querySchema.parse({
      projectId: new URL(request.url).searchParams.get("projectId")
    });
    await canvasService.assertAccess(projectId, user);

    const encoder = new TextEncoder();
    let interval: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let busy = false;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const send = async () => {
          if (busy) return;
          busy = true;
          try {
            const jobs = await canvasService.listJobEvents(projectId, user);
            controller.enqueue(encoder.encode(`event: jobs\ndata: ${JSON.stringify(jobs)}\n\n`));
          } catch {
            controller.enqueue(encoder.encode("event: heartbeat\ndata: {}\n\n"));
          } finally {
            busy = false;
          }
        };

        void send();
        interval = setInterval(() => void send(), 1000);
        timeout = setTimeout(() => {
          if (interval) clearInterval(interval);
          controller.close();
        }, 25_000);

        request.signal.addEventListener("abort", () => {
          if (interval) clearInterval(interval);
          if (timeout) clearTimeout(timeout);
        });
      },
      cancel() {
        if (interval) clearInterval(interval);
        if (timeout) clearTimeout(timeout);
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no"
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
