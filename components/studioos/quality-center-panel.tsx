import type { Locale } from "@/lib/i18n";
import type { QualityReport } from "@/lib/studioos/quality-types";
import { qualityStatusLabel } from "@/lib/studioos/quality-types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";

function StatusIcon({ status }: { status: "pass" | "warn" | "fail" }) {
  if (status === "pass") return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (status === "warn") return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  return <XCircle className="h-5 w-5 text-red-500" />;
}

export function QualityCenterPanel({ locale, report }: { locale: Locale; report: QualityReport }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-xl border border-zinc-200/80 bg-white p-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm text-zinc-500">
            {locale === "zh" ? "AI 质检总分" : "AI quality score"}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-semibold">{report.overallScore || "—"}/100</p>
            <Badge variant={report.source === "ffprobe" ? "success" : "secondary"}>
              {report.source === "ffprobe" ? "ffprobe" : locale === "zh" ? "启发式" : "Heuristic"}
            </Badge>
          </div>
          {report.probe ? (
            <p className="mt-1 text-xs text-zinc-500">
              {report.probe.width}×{report.probe.height} · {report.probe.durationSec.toFixed(1)}s ·{" "}
              {report.probe.aspectLabel}
            </p>
          ) : null}
        </div>
      </div>

      <ul className="space-y-3">
        {report.checks.map((check) => (
          <li
            key={check.id}
            className={cn(
              "flex gap-4 rounded-xl border bg-white px-4 py-4",
              check.status === "pass" && "border-emerald-100",
              check.status === "warn" && "border-amber-100",
              check.status === "fail" && "border-red-100"
            )}
          >
            <StatusIcon status={check.status} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{check.label[locale]}</p>
                <span
                  className={cn(
                    "text-xs font-semibold uppercase",
                    check.status === "pass" && "text-emerald-600",
                    check.status === "warn" && "text-amber-600",
                    check.status === "fail" && "text-red-600"
                  )}
                >
                  {qualityStatusLabel(check.status, locale)}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">{check.detail[locale]}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
