import { NextResponse } from "next/server";
import { getCurrentClientEmail } from "@/features/auth/session-context";
import { logger } from "@/lib/core/logger";
import { uploadBrandProductImage } from "@/lib/studioos/brand-product-image-service";

export const runtime = "nodejs";

function normalizeLang(raw: string | null): "en" | "zh" {
  return raw === "zh" ? "zh" : "en";
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
      {
        ok: false,
        error: lang === "zh" ? "请先登录 Brand 账号" : "Sign in as a brand user first"
      },
      { status: 401 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error:
          lang === "zh"
            ? "图片过大，请选择 10MB 以内的 JPG/PNG/WebP 图片"
            : "Image is too large. Choose a JPG/PNG/WebP image under 10MB."
      },
      { status: 413 }
    );
  }

  const file = formData.get("image_file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: lang === "zh" ? "请选择图片" : "Choose an image file" },
      { status: 400 }
    );
  }

  let result: Awaited<ReturnType<typeof uploadBrandProductImage>>;
  try {
    result = await uploadBrandProductImage({
      projectId,
      clientEmail,
      file,
      locale: lang
    });
  } catch (error) {
    logger.error("Brand product image upload failed", {
      projectId,
      clientEmail,
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      {
        ok: false,
        error:
          lang === "zh"
            ? "产品图上传失败，请稍后重试或检查 Vercel 日志"
            : "Product image upload failed. Try again or check Vercel logs."
      },
      { status: 500 }
    );
  }

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json({
    ok: true,
    original: result.original,
    preview_url: result.preview_url
  });
}
