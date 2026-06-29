import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentClientEmail } from "@/lib/client-session";
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
            ? "图片上传失败，请尝试更小的 JPG/PNG 文件"
            : "Upload failed — try a smaller JPG or PNG"
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

  const result = await uploadBrandProductImage({
    projectId,
    clientEmail,
    file,
    locale: lang
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status ?? 400 });
  }

  revalidatePath("/brand");
  revalidatePath("/brand/projects/new");
  revalidatePath(`/brand/projects/${projectId}`);

  return NextResponse.json({
    ok: true,
    original: result.original,
    preview_url: result.preview_url
  });
}
