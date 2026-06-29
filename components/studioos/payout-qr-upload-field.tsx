"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    label: "Payment QR code",
    hint: "Upload your Alipay or WeChat receive-money QR (JPEG, PNG, WebP, max 5MB)",
    upload: "Upload QR code",
    replace: "Replace QR code"
  },
  zh: {
    label: "收款码",
    hint: "上传支付宝或微信收款码（JPEG / PNG / WebP，最大 5MB）",
    upload: "上传收款码",
    replace: "更换收款码"
  }
};

export function PayoutQrUploadField({
  locale,
  existingUrl
}: {
  locale: Locale;
  existingUrl?: string;
}) {
  const t = copy[locale];
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);

  useEffect(() => {
    setPreview(existingUrl ?? null);
  }, [existingUrl]);

  function handlePick() {
    inputRef.current?.click();
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="qr_code_file">{t.label}</Label>
      <input type="hidden" name="existing_qr_code_url" value={existingUrl ?? ""} />
      <input
        ref={inputRef}
        id="qr_code_file"
        type="file"
        name="qr_code_file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />

      {preview ? (
        <div className="relative overflow-hidden rounded-xl border bg-zinc-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={t.label} className="mx-auto h-44 max-w-full object-contain p-3" />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="absolute right-2 top-2 h-8 gap-1.5 rounded-full px-3 text-xs"
            onClick={handlePick}
          >
            <Upload className="h-3.5 w-3.5" />
            {t.replace}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePick}
          className={cn(
            "flex h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 text-sm text-zinc-500 transition hover:border-zinc-400 hover:bg-zinc-50"
          )}
        >
          <ImagePlus className="h-5 w-5" />
          {t.upload}
        </button>
      )}

      <p className="text-xs text-zinc-500">{t.hint}</p>
    </div>
  );
}
