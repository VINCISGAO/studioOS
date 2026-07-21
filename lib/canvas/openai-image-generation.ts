import "server-only";

import { openAIApiKey } from "@/lib/core/config/ai";
import { logger } from "@/lib/core/logger";
import { hasOpenAI, openAIImageModel } from "@/lib/studioos/config";

type ImageGenerationResult =
  | { ok: true; buffer: Buffer; mimeType: string; model: string }
  | { ok: false; error: string };

function parseOpenAIError(body: string, locale: "en" | "zh") {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    const message = parsed.error?.message?.trim();
    if (message) return message;
  } catch {
    // ignore
  }
  return locale === "zh" ? "OpenAI 图片生成失败" : "OpenAI image generation failed";
}

function uniqueModels(models: string[]) {
  return models.filter((value, index, list) => list.indexOf(value) === index);
}

function gptImageModels() {
  return uniqueModels([openAIImageModel(), "gpt-image-1.5", "gpt-image-1"]);
}

function isGptImageModel(model: string) {
  return model.startsWith("gpt-image");
}

export function buildDirectImageEditPrompt(message: string, locale: "en" | "zh") {
  const trimmed = message.trim();
  const photorealism =
    locale === "zh"
      ? "保持原图构图、建筑/人物细节与镜头透视，输出真实摄影质感，避免插画、3D 渲染或过度 AI 风格化。"
      : "Preserve the original composition, architecture or subject details, and camera perspective. Output photorealistic photography, not illustration, 3D render, or stylized AI art.";

  if (!trimmed) {
    return locale === "zh"
      ? `基于这张参考图进行高质量编辑。${photorealism}`
      : `Edit this reference image with high fidelity. ${photorealism}`;
  }

  return locale === "zh"
    ? `基于这张参考图：${trimmed}。${photorealism}`
    : `Edit this reference image: ${trimmed}. ${photorealism}`;
}

export function buildDirectImageGenerationPrompt(message: string, locale: "en" | "zh") {
  const trimmed = message.trim();
  const photorealism =
    locale === "zh"
      ? "真实摄影质感，商业广告级构图，避免插画或 CGI 感。"
      : "Photorealistic photography with commercial composition, not illustration or CGI.";

  if (!trimmed) {
    return locale === "zh" ? `生成一张高质量图片。${photorealism}` : `Generate a high-quality image. ${photorealism}`;
  }

  return `${trimmed}. ${photorealism}`;
}

function appendGptImageFields(form: FormData, model: string) {
  if (!isGptImageModel(model)) return;
  form.append("quality", "high");
  form.append("output_format", "png");
  form.append("size", "auto");
}

function appendGptImageEditFields(form: FormData, model: string) {
  appendGptImageFields(form, model);
  if (!isGptImageModel(model)) return;
  form.append("input_fidelity", "high");
}

async function readImageResult(
  response: Response,
  model: string,
  locale: "en" | "zh"
): Promise<ImageGenerationResult | null> {
  const data = (await response.json()) as {
    data?: { b64_json?: string; url?: string }[];
  };

  const b64 = data.data?.[0]?.b64_json;
  if (b64) {
    return { ok: true, buffer: Buffer.from(b64, "base64"), mimeType: "image/png", model };
  }

  const url = data.data?.[0]?.url;
  if (url) {
    const imageResponse = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!imageResponse.ok) {
      return {
        ok: false,
        error: locale === "zh" ? "OpenAI 返回的图片无法下载" : "Failed to download OpenAI image"
      };
    }
    return {
      ok: true,
      buffer: Buffer.from(await imageResponse.arrayBuffer()),
      mimeType: "image/png",
      model
    };
  }

  return null;
}

export async function generateOpenAIImage(
  prompt: string,
  locale: "en" | "zh" = "zh"
): Promise<ImageGenerationResult> {
  if (!hasOpenAI()) {
    return {
      ok: false,
      error: locale === "zh" ? "OpenAI 未配置" : "OpenAI is not configured"
    };
  }

  const models = gptImageModels();
  let lastError = locale === "zh" ? "OpenAI 图片生成失败" : "OpenAI image generation failed";

  for (const model of models) {
    const body: Record<string, unknown> = {
      model,
      prompt,
      n: 1
    };
    if (isGptImageModel(model)) {
      body.quality = "high";
      body.output_format = "png";
      body.size = "auto";
    } else {
      body.size = "1024x1024";
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      lastError = parseOpenAIError(errorBody, locale);
      logger.error("OpenAI image generation failed", {
        service: "OpenAIImageGeneration",
        model,
        status: response.status,
        body: errorBody
      });
      continue;
    }

    const result = await readImageResult(response, model, locale);
    if (result?.ok) return result;
    if (result && !result.ok) lastError = result.error;
    else lastError = locale === "zh" ? "OpenAI 未返回图片" : "OpenAI returned no image";
  }

  return { ok: false, error: lastError };
}

export async function editOpenAIImage(input: {
  buffer: Buffer;
  mimeType: string;
  prompt: string;
  locale?: "en" | "zh";
}): Promise<ImageGenerationResult> {
  const locale = input.locale ?? "zh";
  if (!hasOpenAI()) {
    return {
      ok: false,
      error: locale === "zh" ? "OpenAI 未配置" : "OpenAI is not configured"
    };
  }

  const models = gptImageModels();
  let lastError = locale === "zh" ? "OpenAI 图生图失败" : "OpenAI image edit failed";
  const extension = input.mimeType.includes("png") ? "png" : "jpg";

  for (const model of models) {
    const form = new FormData();
    form.append(
      "image",
      new Blob([new Uint8Array(input.buffer)], { type: input.mimeType }),
      `reference.${extension}`
    );
    form.append("model", model);
    form.append("prompt", input.prompt);
    appendGptImageEditFields(form, model);
    if (!isGptImageModel(model)) {
      form.append("size", "1024x1024");
    }

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey()}`
      },
      body: form,
      signal: AbortSignal.timeout(120_000)
    });

    if (!response.ok) {
      const body = await response.text();
      lastError = parseOpenAIError(body, locale);
      logger.error("OpenAI image edit failed", {
        service: "OpenAIImageGeneration",
        model,
        status: response.status,
        body
      });
      continue;
    }

    const result = await readImageResult(response, model, locale);
    if (result?.ok) return result;
    if (result && !result.ok) lastError = result.error;
    else lastError = locale === "zh" ? "OpenAI 未返回图片" : "OpenAI returned no image";
  }

  return { ok: false, error: lastError };
}
