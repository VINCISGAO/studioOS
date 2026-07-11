import { NextResponse } from "next/server";
import { projectAssetObjectKey } from "@/lib/studioos/project-asset-upload";
import { getObject } from "@/lib/studioos/object-storage";
import { getCurrentClientEmail } from "@/features/auth/session-context";
import { getCurrentCreatorId } from "@/features/auth/session-context";
import { getOrderForProject } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { listInvitationsForProject } from "@/lib/studioos/creator-invitation-store";

async function canReadProjectAsset(projectId: string) {
  const [project, clientEmail, creatorId] = await Promise.all([
    getProject(projectId),
    getCurrentClientEmail().catch(() => null),
    getCurrentCreatorId().catch(() => null)
  ]);
  if (!project) return false;
  if (clientEmail && project.client_email.toLowerCase() === clientEmail.toLowerCase()) {
    return true;
  }
  if (!creatorId) return false;

  const [order, invitations] = await Promise.all([
    getOrderForProject(projectId).catch(() => null),
    listInvitationsForProject(projectId).catch(() => [])
  ]);
  if (order?.creator_id === creatorId) return true;
  return invitations.some((item) => item.creatorId === creatorId);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string; filename: string }> }
) {
  const { projectId, filename } = await context.params;
  if (!projectId || !filename) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!(await canReadProjectAsset(projectId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const safeName = decodeURIComponent(filename).replace(/[/\\]/g, "");
  const fileKey = projectAssetObjectKey(projectId, safeName);

  try {
    const data = await getObject(fileKey);
    if (!data) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
    const ext = safeName.split(".").pop()?.toLowerCase();
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : ext === "mp4"
              ? "video/mp4"
              : ext === "mov"
                ? "video/quicktime"
                : ext === "webm"
                  ? "video/webm"
                  : "image/jpeg";

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
}
