import type { RefObject } from "react";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Plus, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

const copy = {
  en: {
    title: "Upload Version 1",
    subtitle: "Start the brand review flow from here. Every revision uploads from the review center too.",
    pick: "Choose MP4",
    notes: "Version notes (optional)",
    upload: "Upload Version 1"
  },
  zh: {
    title: "上传 Version 1",
    subtitle: "第一版从审片中心上传；之后的每一版也在这里提交。",
    pick: "选择 MP4 视频",
    notes: "版本说明（可选）",
    upload: "上传 Version 1"
  }
};

export function ReviewCenterEmptyUpload({
  locale,
  uploadNotes,
  onUploadNotesChange,
  onUpload,
  onPickFile,
  pending,
  fileInputRef,
  className
}: {
  locale: Locale;
  uploadNotes: string;
  onUploadNotesChange: (value: string) => void;
  onUpload: () => void;
  onPickFile: () => void;
  pending: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  className?: string;
}) {
  const t = copy[locale];

  return (
    <div
      className={cn(
        "flex aspect-video flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 text-center",
        className
      )}
    >
      <input ref={fileInputRef} type="file" accept="video/mp4,.mp4" className="sr-only" />
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
        <Plus className="h-7 w-7 text-blue-600" />
      </div>
      <div>
        <p className="text-base font-semibold text-zinc-900">{t.title}</p>
        <p className="mt-1 max-w-md text-sm text-zinc-500">{t.subtitle}</p>
      </div>
      <div className="flex w-full max-w-lg flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onPickFile} className="rounded-lg">
          {t.pick}
        </Button>
        <input
          value={uploadNotes}
          onChange={(event) => onUploadNotesChange(event.target.value)}
          placeholder={t.notes}
          className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-blue-400"
        />
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={onUpload}
          className="rounded-lg bg-blue-600 hover:bg-blue-700"
        >
          <UploadCloud className="h-4 w-4" />
          {t.upload}
        </Button>
      </div>
    </div>
  );
}
