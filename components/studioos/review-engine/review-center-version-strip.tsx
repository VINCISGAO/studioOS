import type { RefObject } from "react";
import type { Locale } from "@/lib/i18n";
import type { StoredDeliverable } from "@/lib/order-types";
import { cn } from "@/lib/utils";
import { Plus, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

const copy = {
  en: {
    title: "Version history",
    current: "Current",
    upload: "Upload new version",
    uploadFirst: "Upload Version 1",
    notes: "Version notes"
  },
  zh: {
    title: "版本记录",
    current: "当前版本",
    upload: "上传新版本",
    uploadFirst: "上传 Version 1",
    notes: "版本说明"
  }
};

export function ReviewCenterVersionStrip({
  locale,
  versions,
  activeVersion,
  onSelect,
  canUpload,
  uploadNotes,
  onUploadNotesChange,
  onUpload,
  pending,
  fileInputRef,
  isFirstUpload = false
}: {
  locale: Locale;
  versions: StoredDeliverable[];
  activeVersion: number;
  onSelect: (version: number) => void;
  canUpload: boolean;
  uploadNotes: string;
  onUploadNotesChange: (value: string) => void;
  onUpload: () => void;
  pending: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isFirstUpload?: boolean;
}) {
  const t = copy[locale];
  const uploadLabel = isFirstUpload ? t.uploadFirst : t.upload;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-900">{t.title}</h3>
        {canUpload ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,.mp4"
              className="max-w-[140px] text-xs text-zinc-500 file:mr-2 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-2 file:py-1.5 file:text-xs"
            />
            <input
              value={uploadNotes}
              onChange={(event) => onUploadNotesChange(event.target.value)}
              placeholder={t.notes}
              className="h-8 max-w-[160px] rounded-lg border border-zinc-200 px-2 text-xs outline-none focus:border-blue-400"
            />
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={onUpload}
              className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              {uploadLabel}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {versions.map((item) => {
          const active = item.version === activeVersion;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.version)}
              className={cn(
                "w-[132px] shrink-0 overflow-hidden rounded-xl border text-left transition",
                active ? "border-blue-500 ring-2 ring-blue-100" : "border-zinc-200 hover:border-zinc-300"
              )}
            >
              <div className="aspect-video bg-zinc-900">
                {item.thumbnail_url || item.file_url ? (
                  <video
                    src={item.file_url}
                    className="h-full w-full object-cover opacity-80"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-500">V{item.version}</div>
                )}
              </div>
              <div className="px-2 py-2">
                <p className="text-xs font-semibold text-zinc-900">V{item.version}</p>
                {active ? <p className="text-[10px] text-blue-600">{t.current}</p> : null}
              </div>
            </button>
          );
        })}
        {canUpload ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-[132px] shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-zinc-500 transition hover:border-blue-300 hover:text-blue-600"
          >
            <div className="flex aspect-video w-full items-center justify-center">
              <Plus className="h-6 w-6" />
            </div>
            <span className="px-2 pb-2 text-[11px] font-medium">{uploadLabel}</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}
