"use client";

import { useRef, useState, useTransition } from "react";
import { uploadLogoAssetAction } from "@/app/project-wizard-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n";
import type { StoredProjectAsset } from "@/lib/campaign-types";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, Upload } from "lucide-react";

function assetPreviewUrl(fileUrl: string) {
  if (fileUrl.startsWith("blob:") || fileUrl.startsWith("http")) {
    return fileUrl;
  }
  return `${fileUrl}${fileUrl.includes("?") ? "&" : "?"}v=1`;
}

function isValidAssetUrl(fileUrl?: string | null) {
  return Boolean(fileUrl && (fileUrl.startsWith("/api/") || fileUrl.startsWith("blob:")));
}

type Props = {
  locale: Locale;
  projectId: string;
  asset?: StoredProjectAsset | null;
  onUploaded: () => void;
};

export function WizardLogoUpload({ locale, projectId, asset, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(
    isValidAssetUrl(asset?.file_url) ? assetPreviewUrl(asset!.file_url) : null
  );

  function handlePick() {
    inputRef.current?.click();
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(URL.createObjectURL(file));

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
      onUploaded();
    });
  }

  return (
    <div className="grid gap-2">
      <Label>{locale === "zh" ? "Logo *" : "Logo *"}</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
      />

      {preview ? (
        <div className="relative overflow-hidden rounded-xl border bg-zinc-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Logo preview" className="h-36 w-full object-contain p-4" />
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
      ) : (
        <button
          type="button"
          onClick={handlePick}
          disabled={isPending}
          className={cn(
            "flex h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 text-sm text-zinc-500 transition hover:border-zinc-400 hover:bg-zinc-50",
            isPending && "pointer-events-none opacity-60"
          )}
        >
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          {locale === "zh" ? "点击上传 Logo" : "Click to upload logo"}
        </button>
      )}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
