import { communicationService } from "@/features/communication/communication.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ campaignId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const url = new URL(request.url);
    const since = url.searchParams.get("since") ?? new Date(Date.now() - 60_000).toISOString();

    const encoder = new TextEncoder();
    let cursor = since;

    const stream = new ReadableStream({
      start(controller) {
        const push = (payload: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };

        push({ type: "connected", campaignId, at: new Date().toISOString() });

        const tick = async () => {
          try {
            const items = await communicationService.pollCampaignStream(
              campaignId,
              { id: user.id, role: user.role },
              cursor
            );
            if (items.length) {
              cursor = items[items.length - 1]!.updatedAt;
              push({ type: "MessageTranslated", messages: items });
            } else {
              push({ type: "heartbeat", at: new Date().toISOString() });
            }
          } catch {
            push({ type: "error", message: "poll_failed" });
          }
        };

        void tick();
        const interval = setInterval(() => void tick(), 2500);

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
