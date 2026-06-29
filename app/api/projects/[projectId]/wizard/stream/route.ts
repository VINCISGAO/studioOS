import { readWizardProgress } from "@/lib/campaign/wizard-progress.service";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getProject } from "@/lib/project-service";

type Params = { params: Promise<{ projectId: string }> };

async function assertBrandProjectAccess(projectId: string) {
  const email = await getCurrentClientEmail();
  if (!email) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const project = await getProject(projectId);
  if (!project || project.client_email.toLowerCase() !== email.toLowerCase()) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }
  return project;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    await assertBrandProjectAccess(projectId);

    const encoder = new TextEncoder();
    let lastUpdatedAt = "";

    const stream = new ReadableStream({
      start(controller) {
        const push = (payload: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };

        push({ type: "connected", projectId, at: new Date().toISOString() });

        const tick = async () => {
          try {
            const draft = await readWizardProgress(projectId);
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
        const interval = setInterval(() => void tick(), 1500);

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
    if (error instanceof Response) return error;
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
}
