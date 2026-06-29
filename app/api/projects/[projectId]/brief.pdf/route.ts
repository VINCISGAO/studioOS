import { NextResponse } from "next/server";
import { getCurrentCreatorId } from "@/lib/creator-session";
import { getLocale, type SearchParams } from "@/lib/i18n";
import { listNotificationsForCreator } from "@/lib/notification-service";
import { getOrderForProject } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { generateBriefPdfBuffer } from "@/lib/studioos/brief-pdf";
import { getConfirmedBriefFields } from "@/lib/studioos/confirmed-brief";

type RouteContext = { params: Promise<{ projectId: string }> };

async function creatorCanAccessProject(creatorId: string, projectId: string) {
  const notifications = await listNotificationsForCreator(creatorId);
  if (notifications.some((item) => item.project_id === projectId)) {
    return true;
  }

  const order = await getOrderForProject(projectId);
  return order?.creator_id === creatorId;
}

export async function GET(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await creatorCanAccessProject(creatorId, projectId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const lang = url.searchParams.get("lang") ?? "zh";
  const locale = getLocale({ lang } as SearchParams);
  const fields = getConfirmedBriefFields(project, locale);
  const download = url.searchParams.get("download") === "1";

  const pdf = generateBriefPdfBuffer({
    title: project.title || project.product_name,
    formId: project.id.slice(-10).toUpperCase(),
    locale,
    fields
  });

  const filename = `${(project.title || "brief").replace(/[^\w\-]+/g, "_")}_form.pdf`;

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, max-age=60"
    }
  });
}
