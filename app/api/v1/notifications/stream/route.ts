import { bootstrapEventSystem } from "@/features/events/bootstrap";
import { notificationService } from "@/features/notification/notification.service";
import { requireApiUser, handleRouteError } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    bootstrapEventSystem();
    const user = await requireApiUser();
    const url = new URL(request.url);
    const since = url.searchParams.get("since") ?? new Date(Date.now() - 60_000).toISOString();

    const encoder = new TextEncoder();
    let cursor = since;

    const stream = new ReadableStream({
      start(controller) {
        const push = (payload: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };

        push({ type: "connected", userId: user.id, at: new Date().toISOString() });

        const tick = async () => {
          try {
            const items = await notificationService.pollSince({ id: user.id, role: user.role }, cursor);
            if (items.length) {
              cursor = items[items.length - 1]!.createdAt;
              push({ type: "notifications", items });
            } else {
              push({ type: "heartbeat", at: new Date().toISOString() });
            }
          } catch {
            push({ type: "error", message: "poll_failed" });
          }
        };

        void tick();
        const interval = setInterval(() => void tick(), 3000);

        request.signal.addEventListener("abort", () => {
          clearInterval(interval);
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
