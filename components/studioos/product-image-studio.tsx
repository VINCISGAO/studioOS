"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { refineProductImageAction, uploadProductImageAction } from "@/app/project-wizard-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StoredProjectAsset } from "@/lib/campaign-types";
import type { Locale } from "@/lib/i18n";
import {
  loadImageFromFile,
  loadImageFromUrl,
  renderCommercialProductImage
} from "@/lib/studioos/product-image-client";
import { cn } from "@/lib/utils";
import { ArrowRight, ImagePlus, Loader2, Sparkles, Upload } from "lucide-react";

function assetPreviewUrl(fileUrl: string) {
  if (fileUrl.startsWith("blob:") || fileUrl.startsWith("http")) {
    return fileUrl;
  }
  return `${fileUrl}${fileUrl.includes("?") ? "&" : "?"}v=1`;
}

const PROMPT_PRESETS = {
  en: [
    "White seamless background, soft studio lighting, premium e-commerce hero shot",
    "Minimal lifestyle scene, natural window light, shallow depth of field",
    "Dark premium backdrop, dramatic rim light, luxury campaign look"
  ],
  zh: [
    "纯白背景，柔和棚拍光，高端电商主图质感",
    "简约生活场景，自然窗光，浅景深",
    "深色高级背景，轮廓光，奢侈品广告风格"
  ]
};

type Props = {
  locale: Locale;
  projectId: string;
  originalAsset?: StoredProjectAsset | null;
  commercialAsset?: StoredProjectAsset | null;
  onUpdated: () => void;
};

export function ProductImageStudio({
  locale,
  projectId,
  originalAsset,
  commercialAsset,
  onUpdated
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(PROMPT_PRESETS[locale][0]);
  const [localOriginalPreview, setLocalOriginalPreview] = useState<string | null>(null);
  const [localRefinedPreview, setLocalRefinedPreview] = useState<string | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [refineSource, setRefineSource] = useState<"openai" | "local" | null>(null);

  const originalUrl =
    localOriginalPreview ?? (originalAsset?.file_url ? assetPreviewUrl(originalAsset.file_url) : null);
  const commercialUrl =
    localRefinedPreview ?? (commercialAsset?.file_url ? assetPreviewUrl(commercialAsset.file_url) : null);
  const presets = useMemo(() => PROMPT_PRESETS[locale], [locale]);

  function handlePick() {
    inputRef.current?.click();
  }

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setLocalRefinedPreview(null);
    setRefineSource(null);
    setLocalFile(file);
    setLocalOriginalPreview(URL.createObjectURL(file));

    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("project_id", projectId);
      fd.set("image_file", file);
      const result = await uploadProductImageAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onUpdated();
    });
  }

  function handleRefine() {
    if (!originalUrl) {
      setError(locale === "zh" ? "请先上传产品图" : "Upload a product image first");
      return;
    }

    if (!prompt.trim()) {
      setError(locale === "zh" ? "请输入精修提示词" : "Enter a refinement prompt");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const img = localFile
          ? await loadImageFromFile(localFile)
          : await loadImageFromUrl(originalUrl);

        const refinedBlob = await renderCommercialProductImage(img, { prompt, locale });

        const fd = new FormData();
        fd.set("lang", locale);
        fd.set("project_id", projectId);
        fd.set("prompt", prompt);
        fd.set("refined_file", refinedBlob, "refined.jpg");

        const result = await refineProductImageAction(fd);
        if (!result.ok) {
          setError(result.error);
          return;
        }

        setLocalRefinedPreview(
          result.source === "openai"
            ? assetPreviewUrl(result.asset.file_url)
            : URL.createObjectURL(refinedBlob)
        );
        setRefineSource(result.source);
        onUpdated();
      } catch {
        setError(locale === "zh" ? "精修失败，请重试" : "Refinement failed, please retry");
      }
    });
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label>{locale === "zh" ? "产品图 *" : "Product image *"}</Label>
        <span className="text-xs text-zinc-500">
          {locale === "zh" ? "上传普通照片 → AI 精修为商用图" : "Upload photo → refine for commercial use"}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleUpload}
      />

      {!originalUrl ? (
        <button
          type="button"
          onClick={handlePick}
          disabled={isPending}
          className={cn(
            "flex h-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 text-sm text-zinc-500 transition hover:border-zinc-400 hover:bg-zinc-50",
            isPending && "pointer-events-none opacity-60"
          )}
        >
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          {locale === "zh" ? "点击上传产品图（手机拍即可）" : "Click to upload product photo"}
        </button>
      ) : (
        <div className="space-y-4 rounded-xl border p-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                {locale === "zh" ? "原图" : "Original"}
              </p>
              <div className="relative overflow-hidden rounded-lg border bg-zinc-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={originalUrl} alt="Original product" className="h-40 w-full object-contain p-3" />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute right-2 top-2 h-8 w-8 rounded-full"
                  onClick={handlePick}
                  disabled={isPending}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ArrowRight className="mx-auto hidden h-5 w-5 text-zinc-400 sm:block" />

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                {locale === "zh" ? "商用精修" : "Commercial"}
              </p>
              <div className="overflow-hidden rounded-lg border bg-zinc-50">
                {commercialUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={commercialUrl} alt="Refined product" className="h-40 w-full object-contain p-3" />
                    {refineSource ? (
                      <p className="border-t px-3 py-2 text-xs text-emerald-700">
                        {refineSource === "openai"
                          ? locale === "zh"
                            ? "OpenAI 生成商用图"
                            : "OpenAI commercial render"
                          : locale === "zh"
                            ? "本地演示精修（配置 OpenAI 后可生成更高质量）"
                            : "Local demo refine (configure OpenAI for higher quality)"}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <div className="flex h-40 items-center justify-center px-4 text-center text-xs text-zinc-500">
                    {locale === "zh" ? "输入提示词后点击精修" : "Enter prompt and refine"}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>{locale === "zh" ? "精修提示词" : "Refinement prompt"}</Label>
            <Textarea
              rows={3}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={
                locale === "zh"
                  ? "例如：纯白背景，专业棚拍，柔和侧光，突出产品质感…"
                  : "e.g. white background, studio lighting, highlight product texture…"
              }
            />
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPrompt(preset)}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:border-zinc-400"
                >
                  {preset.length > 42 ? `${preset.slice(0, 42)}…` : preset}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleRefine}
            disabled={isPending}
            className="rounded-full"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {locale === "zh" ? "生成商用产品图" : "Generate commercial image"}
          </Button>
        </div>
      )}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
