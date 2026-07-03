"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import {
  refineProductImageAction,
  uploadLogoAssetAction,
  uploadProductImageAction
} from "@/app/project-wizard-actions";
import { Button } from "@/components/ui/button";
import type { StoredProjectAsset } from "@/lib/campaign-types";
import type { Locale } from "@/lib/i18n";
import {
  loadImageFromFile,
  loadImageFromUrl,
  renderCommercialProductImage
} from "@/lib/studioos/product-image-client";
import { cn } from "@/lib/utils";
import { CheckCircle2, ImagePlus, Loader2, Upload } from "lucide-react";

const DEFAULT_PROMPT = {
  zh: "纯白背景，柔和棚拍光，高端电商主图质感",
  en: "White seamless background, soft studio lighting, premium e-commerce hero shot"
};

const copy = {
  en: {
    product: "Product photo",
    productHint: "Phone photo is fine — we will clean it up automatically.",
    drop: "Drop photo here",
    browse: "or click to browse",
    optimizing: "Optimizing product photo…",
    ready: "Product photo ready",
    logo: "Brand logo",
    logoOptional: "Optional",
    logoHint: "PNG with transparent background works best.",
    uploadLogo: "Upload logo"
  },
  zh: {
    product: "产品照片",
    productHint: "手机拍一张就行，我们会自动帮你优化成广告可用素材。",
    drop: "拖拽图片到此处",
    browse: "或点击选择文件",
    optimizing: "正在优化产品图…",
    ready: "产品图已就绪",
    logo: "品牌 Logo",
    logoOptional: "可选",
    logoHint: "透明底 PNG 效果最佳。",
    uploadLogo: "上传 Logo"
  }
};

function previewUrl(fileUrl: string) {
  if (fileUrl.startsWith("blob:") || fileUrl.startsWith("http")) return fileUrl;
  return `${fileUrl}${fileUrl.includes("?") ? "&" : "?"}v=1`;
}

export function WizardProductHero({
  locale,
  projectId,
  originalAsset,
  commercialAsset,
  logoAsset,
  onUpdated
}: {
  locale: Locale;
  projectId: string;
  originalAsset?: StoredProjectAsset | null;
  commercialAsset?: StoredProjectAsset | null;
  logoAsset?: StoredProjectAsset | null;
  onUpdated: () => void;
}) {
  const t = copy[locale];
  const productInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localProductPreview, setLocalProductPreview] = useState<string | null>(null);
  const [localLogoPreview, setLocalLogoPreview] = useState<string | null>(
    logoAsset?.file_url ? previewUrl(logoAsset.file_url) : null
  );
  const [phase, setPhase] = useState<"idle" | "uploading" | "optimizing" | "done">("idle");

  useEffect(() => {
    if (originalAsset || commercialAsset) {
      setPhase("done");
    }
  }, [originalAsset, commercialAsset]);

  const displayUrl =
    localProductPreview ??
    (commercialAsset?.file_url
      ? previewUrl(commercialAsset.file_url)
      : originalAsset?.file_url
        ? previewUrl(originalAsset.file_url)
        : null);

  const isBusy = isPending || phase === "uploading" || phase === "optimizing";

  async function autoRefine(originalUrl: string, file: File | null) {
    setPhase("optimizing");
    try {
      const img = file ? await loadImageFromFile(file) : await loadImageFromUrl(originalUrl);
      const prompt = DEFAULT_PROMPT[locale];
      const refinedBlob = await renderCommercialProductImage(img, { prompt, locale });

      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("project_id", projectId);
      fd.set("prompt", prompt);
      fd.set("refined_file", refinedBlob, "refined.jpg");

      const result = await refineProductImageAction(fd);
      if (result.ok) {
        setLocalProductPreview(
          result.source === "openai"
            ? previewUrl(result.asset.file_url)
            : URL.createObjectURL(refinedBlob)
        );
      }
    } catch {
      // Keep original preview — still passes wizard validation.
    } finally {
      setPhase("done");
      onUpdated();
    }
  }

  function handleProductFile(file: File) {
    setError(null);
    setLocalProductPreview(URL.createObjectURL(file));
    setPhase("uploading");

    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("project_id", projectId);
      fd.set("image_file", file);
      const upload = await uploadProductImageAction(fd);
      if (!upload.ok) {
        setError(upload.error);
        setPhase("idle");
        return;
      }
      onUpdated();
      await autoRefine(previewUrl(upload.original.file_url), file);
    });
  }

  function handleLogoFile(file: File) {
    setLocalLogoPreview(URL.createObjectURL(file));
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("project_id", projectId);
      fd.set("image_file", file);
      const result = await uploadLogoAssetAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onUpdated();
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-zinc-900">{t.product}</p>
          {displayUrl && phase === "done" ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t.ready}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-zinc-500">{t.productHint}</p>
      </div>

      <input
        ref={productInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleProductFile(file);
        }}
      />

      {!displayUrl ? (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => productInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleProductFile(file);
          }}
          className={cn(
            "flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
            dragging
              ? "border-zinc-900 bg-zinc-50"
              : "border-zinc-200 bg-zinc-50/60 hover:border-zinc-300 hover:bg-zinc-50",
            isBusy && "pointer-events-none opacity-70"
          )}
        >
          {isBusy ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
              <p className="text-sm font-medium text-zinc-700">
                {phase === "optimizing" ? t.optimizing : t.product}
              </p>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
                <ImagePlus className="h-6 w-6 text-zinc-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">{t.drop}</p>
                <p className="mt-1 text-xs text-zinc-500">{t.browse}</p>
              </div>
            </>
          )}
        </button>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border bg-zinc-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayUrl} alt={t.product} className="mx-auto max-h-64 w-full object-contain p-6" />
          {isBusy ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
              <p className="text-sm text-zinc-600">{phase === "optimizing" ? t.optimizing : t.product}</p>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="absolute right-3 top-3 h-8 gap-1.5 rounded-full px-3 text-xs"
              onClick={() => productInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              {locale === "zh" ? "更换" : "Replace"}
            </Button>
          )}
        </div>
      )}

      <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-zinc-900">{t.logo}</p>
          <span className="rounded-full bg-zinc-200/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
            {t.logoOptional}
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">{t.logoHint}</p>

        <input
          ref={logoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleLogoFile(file);
          }}
        />

        <button
          type="button"
          onClick={() => logoInputRef.current?.click()}
          disabled={isBusy}
          className="mt-3 flex w-full items-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-white px-4 py-3 text-left transition hover:border-zinc-300"
        >
          {localLogoPreview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={localLogoPreview} alt="Logo" className="h-10 w-10 rounded-lg object-contain" />
              <span className="text-sm text-zinc-600">{locale === "zh" ? "点击更换 Logo" : "Click to replace logo"}</span>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
                <Upload className="h-4 w-4 text-zinc-500" />
              </div>
              <span className="text-sm text-zinc-600">{t.uploadLogo}</span>
            </>
          )}
        </button>
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
