import { promises as fs } from "fs";
import { hasOpenAI, openAIImageModel } from "@/lib/studioos/config";
import {
  fileNameFromAssetUrl,
  projectAssetFilePath,
  saveProjectAssetBuffer
} from "@/lib/studioos/project-asset-upload";

export type RefineSource = "openai" | "local";

function buildEditPrompt(prompt: string, locale: "en" | "zh") {
  const base =
    locale === "zh"
      ? "将这张产品照片精修为高端商业广告主图。保持产品本身、品牌标签和包装细节不变。"
      : "Refine this product photo into a premium commercial hero shot. Keep the exact product, brand labels, and packaging details.";
  return `${base} ${prompt}. Professional studio lighting, photorealistic, clean composition, e-commerce quality.`;
}

function parseOpenAIError(body: string, locale: "en" | "zh") {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    const message = parsed.error?.message?.trim();
    if (message) {
      return message;
    }
  } catch {
    // ignore
  }
  return locale === "zh" ? "OpenAI 图片精修失败" : "OpenAI image refinement failed";
}

async function refineWithImageEdit(
  buffer: Buffer,
  mime: string,
  prompt: string,
  locale: "en" | "zh"
): Promise<
  | { ok: true; buffer: Buffer; mime: string; model: string }
  | { ok: false; error: string; retryable: boolean }
> {
  const models = [openAIImageModel(), "gpt-image-1", "dall-e-2"].filter(
    (value, index, list) => list.indexOf(value) === index
  );

  let lastError = locale === "zh" ? "OpenAI 图片精修失败" : "OpenAI image refinement failed";

  for (const model of models) {
    const form = new FormData();
    form.append("image", new Blob([buffer], { type: mime }), mime.includes("png") ? "product.png" : "product.jpg");
    form.append("model", model);
    form.append("prompt", buildEditPrompt(prompt, locale));
    form.append("size", "1024x1024");

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: form,
      signal: AbortSignal.timeout(120_000)
    });

    if (!res.ok) {
      const body = await res.text();
      lastError = parseOpenAIError(body, locale);
      continue;
    }

    const data = (await res.json()) as {
      data?: { b64_json?: string; url?: string }[];
    };

    const b64 = data.data?.[0]?.b64_json;
    if (b64) {
      return { ok: true, buffer: Buffer.from(b64, "base64"), mime: "image/png", model };
    }

    const url = data.data?.[0]?.url;
    if (url) {
      const imageRes = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (!imageRes.ok) {
        lastError =
          locale === "zh" ? "OpenAI 返回的图片无法下载" : "Failed to download OpenAI image";
        continue;
      }
      return {
        ok: true,
        buffer: Buffer.from(await imageRes.arrayBuffer()),
        mime: "image/png",
        model
      };
    }

    lastError = locale === "zh" ? "OpenAI 未返回图片" : "OpenAI returned no image";
  }

  return { ok: false, error: lastError, retryable: true };
}

export async function refineProductImageWithAI(input: {
  projectId: string;
  originalUrl: string;
  prompt: string;
  locale: "en" | "zh";
  category?: string;
}): Promise<
  | { ok: true; url: string; file_name: string; mime_type: string; size_bytes: number; source: RefineSource }
  | { ok: false; error: string; code: "NO_OPENAI" | "OPENAI_FAILED" }
> {
  const fileName = fileNameFromAssetUrl(input.originalUrl);
  const originalPath = projectAssetFilePath(input.projectId, fileName);

  let buffer: Buffer;
  try {
    buffer = await fs.readFile(originalPath);
  } catch {
    return {
      ok: false,
      error: input.locale === "zh" ? "找不到原图" : "Original image not found",
      code: "OPENAI_FAILED"
    };
  }

  if (!hasOpenAI()) {
    return { ok: false, error: "NO_OPENAI", code: "NO_OPENAI" };
  }

  const mime = fileName.endsWith(".png") ? "image/png" : "image/jpeg";

  try {
    const edited = await refineWithImageEdit(buffer, mime, input.prompt, input.locale);
    if (!edited.ok) {
      return { ok: false, error: edited.error, code: "OPENAI_FAILED" };
    }

    const saved = await saveProjectAssetBuffer(
      input.projectId,
      edited.buffer,
      "product_refined",
      edited.mime
    );
    return { ...saved, source: "openai" as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error:
        input.locale === "zh"
          ? `OpenAI 调用异常：${message}`
          : `OpenAI request failed: ${message}`,
      code: "OPENAI_FAILED"
    };
  }
}
