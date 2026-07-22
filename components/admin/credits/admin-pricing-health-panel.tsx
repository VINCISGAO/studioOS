"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle } from "lucide-react";
import type { PricingIntegrityReport } from "@/features/credit-wallet/credit-pricing.types";

export function AdminPricingHealthPanel({ locale }: { locale: "zh" | "en" }) {
  const zh = locale === "zh";
  const [report, setReport] = useState<PricingIntegrityReport | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    void (async () => {
      setBusy(true);
      try {
        const response = await fetch("/api/admin/credits/pricing-health");
        const payload = (await response.json()) as { success: boolean; data?: PricingIntegrityReport };
        if (response.ok && payload.success && payload.data) {
          setReport(payload.data);
        }
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  if (busy) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        {zh ? "正在检查 Pricing Rules…" : "Checking pricing rules…"}
      </div>
    );
  }

  if (!report) return null;

  return (
    <div
      className={`mb-4 rounded-2xl border px-4 py-3 ${
        report.healthy
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <div className="flex items-start gap-3">
        {report.healthy ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        )}
        <div className="space-y-2 text-sm">
          <div className="font-medium">
            {report.healthy
              ? zh
                ? "Pricing Rules 健康"
                : "Pricing rules healthy"
              : zh
                ? "Pricing Rules 存在缺口"
                : "Pricing rule gaps detected"}
          </div>
          <div className="text-xs opacity-80">
            {zh ? "已启用模型" : "Enabled models"}: {report.enabledModelCount} ·{" "}
            {zh ? "规则数" : "Rules"}: {report.ruleCount}
          </div>
          {!report.healthy ? (
            <ul className="list-disc pl-4 text-xs">
              {report.issues.map((issue) => (
                <li key={issue.internalModelId}>
                  {issue.displayName} ({issue.internalModelId})
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-wrap gap-2 text-xs">
              {report.models
                .filter((model) => model.enabled)
                .map((model) => (
                  <span key={model.internalModelId} className="rounded-full bg-white/70 px-2 py-1">
                    ✓ {model.displayName}
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
