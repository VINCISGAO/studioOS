import { NextResponse } from "next/server";
import { brandCampaignRepository } from "@/features/campaign/brand-campaign/brand-campaign.repository";
import { getCurrentClientEmail } from "@/features/auth/session-context";
import { addProjectReference } from "@/lib/campaign-store";
import { logger } from "@/lib/core/logger";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { getProject } from "@/lib/project-service";
import { saveProjectReferenceVideoUpload } from "@/lib/studioos/project-asset-upload";

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
        error: lang === "zh" ? "视频过大，建议上传 200MB 以内的视频" : "Video is too large. Upload a video under 200MB."
      },
      { status: 413 }
    );
  }

  const file = formData.get("video_file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: lang === "zh" ? "请选择参考视频" : "Choose a reference video" },
      { status: 400 }
    );
  }

  const saved = await saveProjectReferenceVideoUpload(projectId, file);
  if (!saved.ok) {
    const error =
      lang === "zh"
        ? saved.error.includes("200MB")
          ? "参考视频建议控制在 200MB 以内"
          : saved.error.includes("Only MP4")
            ? "仅支持 MP4、MOV、WebM 参考视频"
            : saved.error.includes("content")
              ? "视频文件格式不匹配，请重新选择 MP4、MOV 或 WebM"
              : "参考视频上传失败，请稍后重试"
        : saved.error;
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }

  try {
    const reference = await addProjectReference({
      project_id: projectId,
      source_url: saved.url,
      note: saved.file_name,
      input_kind: "uploaded_video"
    });
    if (!reference) {
      return NextResponse.json(
        { ok: false, error: lang === "zh" ? "参考视频保存失败，请稍后重试" : "Reference video upload failed. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      reference,
      video: {
        file_name: saved.file_name,
        file_url: saved.url,
        mime_type: saved.mime_type,
        size_bytes: saved.size_bytes
      }
    });
  } catch (error) {
    logger.error("Brand reference video upload failed", {
      projectId,
      clientEmail,
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { ok: false, error: lang === "zh" ? "参考视频保存失败，请稍后重试" : "Reference video upload failed. Try again." },
      { status: 500 }
    );
  }
}
