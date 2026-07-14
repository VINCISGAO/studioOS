import { NextResponse } from "next/server";
import { brandCampaignRepository } from "@/features/campaign/brand-campaign/brand-campaign.repository";
import { getCurrentClientEmail } from "@/features/auth/session-context";
import { addProjectReference } from "@/lib/campaign-store";
import { logger } from "@/lib/core/logger";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { getProject } from "@/lib/project-service";
import { saveProjectReferenceImageUpload } from "@/lib/studioos/project-asset-upload";

export const runtime = "nodejs";

function normalizeLang(raw: string | null): "en" | "zh" {
  return raw === "zh" ? "zh" : "en";
}

async function canWriteProject(projectId: string, clientEmail: string) {
  const normalizedEmail = clientEmail.toLowerCase();
  const project = await getProject(projectId);
  if (project?.client_email.toLowerCase() === normalizedEmail) {
    return true;
  }

  if (hasDatabaseUrl()) {
    const campaign = await brandCampaignRepository.findUploadContextByLegacyProjectId(projectId).catch(() => null);
    return campaign?.brand?.email?.toLowerCase() === normalizedEmail;
  }

  return false;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  const lang = normalizeLang(new URL(request.url).searchParams.get("lang"));

  const clientEmail = await getCurrentClientEmail();
  if (!clientEmail) {
    return NextResponse.json(
      { ok: false, error: lang === "zh" ? "请先登录 Brand 账号" : "Sign in as a brand user first" },
      { status: 401 }
    );
  }

  if (!(await canWriteProject(projectId, clientEmail))) {
    return NextResponse.json(
      { ok: false, error: lang === "zh" ? "无权操作此 Campaign" : "Not allowed for this campaign" },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: lang === "zh" ? "图片过大，请上传 10MB 以内的截图" : "Image is too large. Upload an image under 10MB."
      },
      { status: 413 }
    );
  }

  const file = formData.get("image_file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: lang === "zh" ? "请选择参考截图" : "Choose a reference image" },
      { status: 400 }
    );
  }

  const saved = await saveProjectReferenceImageUpload(projectId, file);
  if (!saved.ok) {
    return NextResponse.json({ ok: false, error: saved.error }, { status: 400 });
  }

  try {
    const reference = await addProjectReference({
      project_id: projectId,
      source_url: saved.url,
      note: saved.file_name,
      input_kind: "uploaded_image",
      locale: lang
    });
    if (!reference) {
      return NextResponse.json(
        { ok: false, error: lang === "zh" ? "参考截图保存失败，请稍后重试" : "Reference image upload failed. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      reference,
      image: {
        file_name: saved.file_name,
        file_url: saved.url,
        mime_type: saved.mime_type,
        size_bytes: saved.size_bytes
      }
    });
  } catch (error) {
    logger.error("Brand reference image upload failed", {
      projectId,
      clientEmail,
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { ok: false, error: lang === "zh" ? "参考截图保存失败，请稍后重试" : "Reference image upload failed. Try again." },
      { status: 500 }
    );
  }
}
