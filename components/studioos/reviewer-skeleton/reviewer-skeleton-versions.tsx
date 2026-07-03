import { UploadCloud } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { ReviewerSkeletonMock, ReviewerSkeletonVersion } from "@/components/studioos/reviewer-skeleton/reviewer-skeleton-mock";

export function ReviewerSkeletonVersions({
  locale,
  mock,
  versions
}: {
  locale: Locale;
  mock?: ReviewerSkeletonMock;
  versions?: ReviewerSkeletonVersion[];
}) {
  const rows = versions ?? mock?.versions ?? [];
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">
          {locale === "zh" ? "版本" : "Versions"}
        </h3>
        <div className="flex flex-wrap items-center gap-2 opacity-60">
          <span className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-400">
            {locale === "zh" ? "选取文件" : "Choose file"}
          </span>
          <span className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-400">
            {locale === "zh" ? "版本说明" : "Version notes"}
          </span>
          <button
            type="button"
            disabled
            className="inline-flex h-8 items-center gap-1 rounded bg-indigo-600/50 px-2.5 text-xs font-medium text-white"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            {locale === "zh" ? "上传新版本" : "Upload version"}
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {rows.map((item) => (
          <div
            key={item.version}
            className={`min-w-[96px] rounded border px-3 py-2 text-left text-xs ${
              item.active ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-zinc-200 text-zinc-600"
            }`}
          >
            <p className="font-semibold">{item.label}</p>
            <p className="mt-1 line-clamp-2 text-zinc-500">{item.notes}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
