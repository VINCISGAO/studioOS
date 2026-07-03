"use client";

import type { RefObject } from "react";
import { UploadCloud } from "lucide-react";
import { getReviewerV1Copy } from "@/components/studioos/reviewer-v1/reviewer-v1-copy";
import type { Locale } from "@/lib/i18n";
import type { StoredDeliverable } from "@/lib/order-types";
import { cn } from "@/lib/utils";

export function ReviewerV1VersionDock({
  locale,
  role,
  versions,
  activeVersion,
  uploadNotes,
  uploadPending,
  fileRef,
  onSelectVersion,
  onUploadNotesChange,
  onUpload
}: {
  locale: Locale;
  role: "brand" | "creator";
  versions: StoredDeliverable[];
  activeVersion: number;
  uploadNotes: string;
  uploadPending: boolean;
  fileRef: RefObject<HTMLInputElement | null>;
  onSelectVersion: (version: number) => void;
  onUploadNotesChange: (value: string) => void;
  onUpload: () => void;
}) {
  const t = getReviewerV1Copy(locale);
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">{t.versions.title}</h3>
        {role === "creator" ? (
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="video/mp4,.mp4" className="max-w-[180px] text-xs" />
            <input
              value={uploadNotes}
              onChange={(event) => onUploadNotesChange(event.target.value)}
              className="h-8 rounded border border-zinc-200 px-2 text-xs"
              placeholder={t.versions.notes}
            />
            <button
              type="button"
              disabled={uploadPending}
              className="inline-flex h-8 items-center gap-1 rounded bg-indigo-600 px-2.5 text-xs font-medium text-white disabled:opacity-50"
              onClick={onUpload}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              {t.versions.upload}
            </button>
          </div>
        ) : null}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {versions.map((item) => {
          const active = item.version === activeVersion;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              aria-current={active ? "true" : undefined}
              className={cn(
                "min-w-[96px] rounded border px-3 py-2 text-left text-xs transition",
                active
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                  : "border-zinc-200 text-zinc-700 hover:border-zinc-300"
              )}
              onClick={() => onSelectVersion(item.version)}
            >
              <p className="font-semibold">V{item.version}</p>
              {active ? <p className="text-[10px] font-medium text-indigo-600">{t.versions.current}</p> : null}
              <p className={cn("line-clamp-2 text-zinc-500", active ? "mt-0.5" : "mt-1")}>
                {item.notes || "-"}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
