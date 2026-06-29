import { wizardDraftService } from "@/features/campaign/wizard-draft.service";
import { campaignService } from "@/features/campaign/campaign.service";
import { handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ campaignId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    await campaignService.getDetail(campaignId, { id: user.id, role: user.role });

    const encoder = new TextEncoder();
    let lastUpdatedAt = "";

    const stream = new ReadableStream({
      start(controller) {
        const push = (payload: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };

        push({ type: "connected", campaignId, at: new Date().toISOString() });

        const tick = async () => {
          try {
            const draft = await wizardDraftService.getDraft(campaignId);
            const updatedAt = draft?.updatedAt ?? "";
            if (updatedAt && updatedAt !== lastUpdatedAt) {
              lastUpdatedAt = updatedAt;
              push({ type: "WizardProgress", draft });
            } else {
              push({ type: "heartbeat", at: new Date().toISOString() });
            }
          } catch {
            push({ type: "error", message: "poll_failed" });
          }
        };

        void tick();
        const interval = setInterval(() => void tick(), 2000);

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

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    await campaignService.getDetail(campaignId, { id: user.id, role: user.role });

    const body = (await request.json()) as {
      step?: number;
      completedSteps?: number[];
      phase?: "idle" | "analyzing" | "matching" | "publishing";
      progressMessage?: string;
    };

    const draft = await wizardDraftService.saveDraft(campaignId, body);
    return Response.json({ ok: true, draft });
  } catch (error) {
    return handleRouteError(error);
  }
}
