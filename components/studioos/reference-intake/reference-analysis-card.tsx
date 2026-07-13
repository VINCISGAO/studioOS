"use client";

import type { StoredProjectReference } from "@/lib/campaign-types";
import type { Locale } from "@/lib/i18n";
import { referenceAccessStatusLabel } from "@/lib/studioos/reference-platform";
import type { ReferenceAnalysisReport } from "@/lib/studioos/reference-analysis.types";
import { cn } from "@/lib/utils";
import { CheckCircle2, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

function analysisStatusLabel(status: string | undefined, locale: Locale) {
  if (status === "analyzing" || status === "pending") {
    return locale === "zh" ? "AI 正在解析参考内容…" : "AI is analyzing this reference…";
  }
  if (status === "failed") {
    return locale === "zh" ? "解析失败，可重新上传视频或补充说明" : "Analysis failed — upload a file or add notes";
  }
  if (status === "ready") {
    return locale === "zh" ? "参考内容已由 AI 解析" : "Reference analyzed by AI";
  }
  return locale === "zh" ? "等待解析" : "Waiting for analysis";
}

function OutlineList({ report, locale }: { report: ReferenceAnalysisReport; locale: Locale }) {
  return (
    <ol className="list-decimal space-y-1 pl-5 text-sm leading-6 text-zinc-700">
      {report.creative_outline.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
  );
}

function ShotTable({ report, locale }: { report: ReferenceAnalysisReport; locale: Locale }) {
  const zh = locale === "zh";
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-100">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-zinc-50 text-zinc-500">
          <tr>
            <th className="px-3 py-2 font-semibold">{zh ? "时间" : "Time"}</th>
            <th className="px-3 py-2 font-semibold">{zh ? "镜头内容" : "Shot"}</th>
            <th className="px-3 py-2 font-semibold">{zh ? "景别" : "Framing"}</th>
            <th className="px-3 py-2 font-semibold">{zh ? "运镜" : "Movement"}</th>
            <th className="px-3 py-2 font-semibold">{zh ? "作用" : "Purpose"}</th>
          </tr>
        </thead>
        <tbody>
          {report.shot_breakdown.map((row) => (
            <tr key={`${row.time_range}-${row.shot_description}`} className="border-t border-zinc-100">
              <td className="px-3 py-2 text-zinc-600">{row.time_range}</td>
              <td className="px-3 py-2 font-medium text-zinc-900">{row.shot_description}</td>
              <td className="px-3 py-2 text-zinc-600">{row.framing}</td>
              <td className="px-3 py-2 text-zinc-600">{row.camera_movement}</td>
              <td className="px-3 py-2 text-zinc-600">{row.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReferenceAnalysisCard({
  locale,
  reference,
  variant = "brand"
}: {
  locale: Locale;
  reference: StoredProjectReference;
  variant?: "brand" | "creator";
}) {
  const zh = locale === "zh";
  const analysis = reference.analysis;
  const report = analysis?.report;
  const [view, setView] = useState<"summary" | "outline" | "shots" | "visual">("summary");
  const isLoading = analysis?.status === "pending" || analysis?.status === "analyzing";

  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-violet-800">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {analysisStatusLabel(analysis?.status, locale)}
          </div>
          <p className="text-xs text-zinc-500">
            {zh ? "原始来源" : "Original source"}：{analysis?.platform_label ?? reference.platform}
          </p>
          {analysis?.access_status ? (
            <p className="text-xs text-amber-700">
              {zh ? "访问状态" : "Access"}：{referenceAccessStatusLabel(analysis.access_status, locale)}
            </p>
          ) : null}
        </div>
        {report ? (
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-100">
            {zh ? `置信度 ${report.confidence}%` : `${report.confidence}% confidence`}
          </span>
        ) : null}
      </div>

      {report ? (
        <>
          <p className="mt-3 text-sm leading-6 text-zinc-800">{report.style_summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              [zh ? "AI 分析" : "AI summary", "summary"],
              [zh ? "文字大纲" : "Outline", "outline"],
              [zh ? "镜头拆解" : "Shot breakdown", "shots"],
              [zh ? "视觉语言" : "Visual language", "visual"]
            ].map(([label, id]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id as typeof view)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition",
                  view === id ? "bg-violet-600 text-white" : "bg-white text-violet-700 ring-1 ring-violet-100"
                )}
              >
                {label}
              </button>
            ))}
            <a
              href={reference.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200 hover:text-zinc-900"
            >
              {variant === "creator" ? (zh ? "尝试打开原始链接" : "Try original link") : (zh ? "查看原链接" : "Open source")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="mt-4 rounded-xl border border-white/80 bg-white p-4">
            {view === "summary" ? (
              <div className="space-y-3 text-sm text-zinc-700">
                <p>
                  <span className="font-semibold text-zinc-900">{zh ? "镜头结构" : "Shot structure"}：</span>
                  {zh
                    ? `${report.shot_count} 个核心镜头${report.estimated_duration_seconds ? `，预计 ${report.estimated_duration_seconds} 秒` : ""}`
                    : `${report.shot_count} core shots${report.estimated_duration_seconds ? `, ~${report.estimated_duration_seconds}s` : ""}`}
                </p>
                <p>
                  <span className="font-semibold text-zinc-900">{zh ? "音乐与节奏" : "Music & rhythm"}：</span>
                  {report.music_and_rhythm}
                </p>
                <p className="text-xs text-zinc-500">{report.copyright_risk_note}</p>
              </div>
            ) : null}
            {view === "outline" && report ? <OutlineList report={report} locale={locale} /> : null}
            {view === "shots" && report ? <ShotTable report={report} locale={locale} /> : null}
            {view === "visual" && report ? (
              <ul className="space-y-2 text-sm text-zinc-700">
                <li><span className="font-semibold">{zh ? "色彩" : "Color"}：</span>{report.visual_language.color}</li>
                <li><span className="font-semibold">{zh ? "光线" : "Lighting"}：</span>{report.visual_language.lighting}</li>
                <li><span className="font-semibold">{zh ? "构图" : "Composition"}：</span>{report.visual_language.composition}</li>
                <li><span className="font-semibold">{zh ? "镜头" : "Lens"}：</span>{report.visual_language.lens_types}</li>
                <li><span className="font-semibold">{zh ? "剪辑" : "Editing"}：</span>{report.visual_language.editing}</li>
                <li><span className="font-semibold">{zh ? "字幕" : "Typography"}：</span>{report.visual_language.typography}</li>
              </ul>
            ) : null}
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-emerald-50/70 p-3">
              <p className="text-xs font-semibold text-emerald-800">{zh ? "可以参考" : "Can reference"}</p>
              <ul className="mt-2 space-y-1">
                {report.copyable_elements.map((item) => (
                  <li key={item} className="flex items-start gap-1.5 text-xs text-emerald-900">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-rose-50/70 p-3">
              <p className="text-xs font-semibold text-rose-800">{zh ? "不应直接复制" : "Do not copy"}</p>
              <ul className="mt-2 space-y-1">
                {report.non_copyable_elements.map((item) => (
                  <li key={item} className="text-xs text-rose-900">· {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : null}

      {analysis?.status === "failed" && analysis.analysis_error ? (
        <p className="mt-3 text-xs text-red-600">{analysis.analysis_error}</p>
      ) : null}
    </div>
  );
}
