"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  bindDeliverablePerformanceAction,
  uploadPlatformAttributionAction
} from "@/app/creative-intelligence-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { CreativePerformanceRecord } from "@/lib/studioos/creative-performance-types";
import { cn } from "@/lib/utils";
import { ArrowRight, FileUp, ImageIcon, Link2, Sparkles, TrendingUp, Upload } from "lucide-react";

type Deliverable = {
  id: string;
  version: number;
  notes?: string;
};

type Props = {
  locale: Locale;
  orderId: string;
  deliverables: Deliverable[];
  existingRecords: CreativePerformanceRecord[];
  defaultCategory?: string;
  compact?: boolean;
};

const HOOK_TYPES = [
  { id: "first_person", en: "First person", zh: "第一人称" },
  { id: "product_macro", en: "Product macro", zh: "产品特写" },
  { id: "ugc_handheld", en: "Handheld UGC", zh: "手持 UGC" },
  { id: "question", en: "Question", zh: "提问式" },
  { id: "voiceover", en: "Voiceover", zh: "旁白" }
];

const copy = {
  en: {
    title: "Ad attribution & performance",
    subtitle: "Upload TikTok / YouTube dashboard screenshots or exports — AI binds metrics to this deliverable.",
    upload: "Upload data",
    manual: "Manual entry",
    platform: "Platform",
    uploadHint:
      "Screenshot your TikTok Ads Manager or YouTube Studio performance page, or upload CSV / paste table text.",
    dropFile: "Drop screenshot, CSV, or JSON — or click to browse",
    paste: "Or paste dashboard data",
    pastePlaceholder: "Paste rows copied from TikTok / YouTube ads backend…",
    analyze: "Analyze with AI",
    analyzing: "Analyzing…",
    update: "Update attribution",
    bind: "Bind to this video",
    aiSummary: "AI attribution summary",
    aiInsights: "Why it performed this way",
    nextCampaign: "Next campaign suggestions",
    applyCampaign: "Start campaign with these insights",
    linked: "Attributed",
    manualAdvanced: "Advanced: enter metrics manually",
    saved: "Saved — Creative Intelligence updated"
  },
  zh: {
    title: "广告归因 & 表现",
    subtitle: "上传 TikTok / YouTube 后台截图或导出数据，AI 自动分析并绑定到本条交付物。",
    upload: "上传数据",
    manual: "手动录入",
    platform: "平台",
    uploadHint: "截取 TikTok 广告后台或 YouTube Studio 数据页截图，也可上传 CSV / 粘贴报表文本。",
    dropFile: "拖拽截图、CSV 或 JSON，或点击选择",
    paste: "或粘贴后台数据",
    pastePlaceholder: "粘贴从 TikTok / YouTube 广告后台复制的表格或指标…",
    analyze: "AI 分析归因",
    analyzing: "分析中…",
    update: "更新归因",
    bind: "绑定到本视频",
    aiSummary: "AI 归因摘要",
    aiInsights: "表现原因分析",
    nextCampaign: "下一次 Campaign 建议",
    applyCampaign: "用这些洞察创建 Campaign",
    linked: "已归因",
    manualAdvanced: "高级：手动填写指标",
    saved: "已保存 — Creative Intelligence 已更新"
  }
};

function prefillHref(locale: Locale, record?: CreativePerformanceRecord | null) {
  const params = new URLSearchParams();
  if (record?.tags.hook_type) params.set("prefill_hook", record.tags.hook_type);
  if (record?.tags.length_sec) {
    params.set("prefill_length", record.tags.length_sec <= 15 ? "15s" : "30s");
  }
  if (record?.tags.style_presets[0]) params.set("prefill_style", record.tags.style_presets[0]);
  const qs = params.toString();
  return withLocale(qs ? `/brand/projects/new?${qs}` : "/brand/projects/new", locale);
}

export function PerformanceAttributionPanel({
  locale,
  orderId,
  deliverables,
  existingRecords,
  defaultCategory = "CPG",
  compact = false
}: Props) {
  const t = copy[locale];
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"upload" | "manual">("upload");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [platform, setPlatform] = useState<"tiktok" | "youtube">("tiktok");
  const [pasted, setPasted] = useState("");
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    summary: string;
    insights: string[];
    recommendations: string[];
    source: string;
  } | null>(null);

  const deliverable = deliverables[deliverables.length - 1] ?? deliverables[0];
  const linked = existingRecords.find((item) => item.order_id === orderId);

  function handleFileChange(file: File | undefined) {
    setFileLabel(file?.name ?? null);
    if (file?.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  }

  function handleUploadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deliverable) return;

    setError(null);
    setSuccess(false);
    setPreview(null);
    const form = event.currentTarget;
    const fd = new FormData(form);

    startTransition(async () => {
      const result = await uploadPlatformAttributionAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPreview({
        summary: result.analysis.summary,
        insights: result.analysis.insights,
        recommendations: result.analysis.recommendations,
        source: result.analysis.source
      });
      setSuccess(true);
      router.refresh();
    });
  }

  function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deliverable) return;

    setError(null);
    setSuccess(false);
    const fd = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await bindDeliverablePerformanceAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  }

  if (!deliverable) {
    return null;
  }

  const hasUploadInput = Boolean(pasted.trim() || fileLabel);

  return (
    <div className={cn("rounded-xl border border-zinc-200/80 bg-white", compact && "border-zinc-100 shadow-sm")}>
      <div
        className={cn(
          "flex flex-col gap-4 border-b px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6",
          compact && "px-4 py-3 sm:px-5"
        )}
      >
        <div className="flex items-start gap-3">
          <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-zinc-700" />
          <div>
            <h2 className={cn("font-semibold", compact && "text-sm")}>{t.title}</h2>
            {!compact ? <p className="mt-1 text-xs leading-5 text-zinc-500">{t.subtitle}</p> : null}
          </div>
        </div>
        <div className="flex rounded-full bg-zinc-100 p-1 text-sm">
          {(["upload", "manual"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMode(tab)}
              className={cn(
                "rounded-full px-3 py-1.5 font-medium transition",
                mode === tab ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
              )}
            >
              {tab === "upload" ? t.upload : t.manual}
            </button>
          ))}
        </div>
      </div>

      {linked ? (
        <div className="border-b bg-emerald-50/50 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-2">
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="min-w-0 text-sm">
              <p className="font-medium text-emerald-900">
                {t.linked}: {linked.name}
              </p>
              <p className="mt-1 text-emerald-800/80">
                {linked.platform.toUpperCase()} · CTR {linked.metrics.ctr.toFixed(1)}% ·{" "}
                {locale === "zh" ? "完播" : "Completion"} {linked.metrics.completion_rate.toFixed(0)}%
                {linked.metrics.roas != null ? ` · ROAS ${linked.metrics.roas.toFixed(1)}` : ""}
              </p>
              {linked.ai_summary ? (
                <p className="mt-2 text-emerald-900/80">{linked.ai_summary[locale]}</p>
              ) : null}
              {linked.campaign_recommendations?.[locale]?.length ? (
                <ul className="mt-2 space-y-1 text-emerald-900/75">
                  {linked.campaign_recommendations[locale].slice(0, 2).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {mode === "upload" ? (
        <form onSubmit={handleUploadSubmit} className={cn("space-y-4 p-5 sm:p-6", compact && "p-4 sm:p-5")}>
          <input type="hidden" name="lang" value={locale} />
          <input type="hidden" name="order_id" value={orderId} />
          <input type="hidden" name="deliverable_id" value={deliverable.id} />
          <input type="hidden" name="deliverable_version" value={String(deliverable.version)} />
          <input type="hidden" name="name" value={deliverable.notes ?? `v${deliverable.version}`} />
          <input type="hidden" name="category" value={defaultCategory} />
          <input type="hidden" name="platform" value={platform} />

          <p className="text-sm text-zinc-500">{t.uploadHint}</p>

          <div className="grid gap-2 sm:max-w-xs">
            <Label>{t.platform}</Label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as "tiktok" | "youtube")}
              className="h-10 rounded-md border px-3 text-sm"
            >
              <option value="tiktok">TikTok Ads</option>
              <option value="youtube">YouTube / Google Ads</option>
            </select>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 px-4 py-8 text-center transition hover:border-zinc-400 hover:bg-zinc-50">
            {filePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={filePreview} alt="" className="max-h-36 rounded-lg object-contain shadow-sm" />
            ) : (
              <>
                <ImageIcon className="h-5 w-5 text-zinc-500" />
                <Upload className="h-4 w-4 text-zinc-400" />
              </>
            )}
            <span className="text-sm font-medium text-zinc-700">{t.dropFile}</span>
            {fileLabel ? <span className="text-xs text-zinc-500">{fileLabel}</span> : null}
            <input
              ref={fileRef}
              type="file"
              name="platform_file"
              accept=".csv,.json,.txt,text/csv,application/json,image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
          </label>

          <div className="grid gap-2">
            <Label>{t.paste}</Label>
            <Textarea
              name="pasted_data"
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={4}
              placeholder={t.pastePlaceholder}
              className="resize-none font-mono text-xs"
            />
          </div>

          {preview ? (
            <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium text-zinc-950">
                <Sparkles className="h-4 w-4" />
                {t.aiSummary}
              </div>
              <p className="leading-6 text-zinc-700">{preview.summary}</p>
              {preview.insights.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.aiInsights}</p>
                  <ul className="mt-2 space-y-1 text-zinc-700">
                    {preview.insights.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {preview.recommendations.length ? (
                <div className="rounded-lg border border-zinc-200/80 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.nextCampaign}</p>
                  <ul className="mt-2 space-y-1 text-zinc-700">
                    {preview.recommendations.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                  <Button asChild size="sm" variant="outline" className="mt-3 rounded-lg border-zinc-200">
                    <Link href={prefillHref(locale, linked ?? null)}>
                      {t.applyCampaign}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success && !preview ? <p className="text-sm text-emerald-700">{t.saved}</p> : null}

          <Button type="submit" disabled={isPending || !hasUploadInput} className="rounded-lg bg-zinc-900 hover:bg-zinc-800">
            <FileUp className="h-4 w-4" />
            {isPending ? t.analyzing : linked ? t.update : t.analyze}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleManualSubmit} className={cn("space-y-4 p-5 sm:p-6", compact && "p-4 sm:p-5")}>
          <input type="hidden" name="lang" value={locale} />
          <input type="hidden" name="order_id" value={orderId} />
          <input type="hidden" name="deliverable_id" value={deliverable.id} />
          <input type="hidden" name="deliverable_version" value={String(deliverable.version)} />
          <input type="hidden" name="name" value={deliverable.notes ?? `v${deliverable.version}`} />
          <input type="hidden" name="category" value={defaultCategory} />

          <p className="text-sm text-zinc-500">{t.manualAdvanced}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>{t.platform}</Label>
              <select name="platform" className="h-10 rounded-md border px-3 text-sm" defaultValue="tiktok">
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="meta">Meta</option>
                <option value="manual">{locale === "zh" ? "手动" : "Manual"}</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>{locale === "zh" ? "广告 ID" : "Ad ID"}</Label>
              <Input name="platform_ad_id" placeholder="tiktok_ad_001" required />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>CTR (%)</Label>
              <Input name="ctr" type="number" step="0.1" defaultValue={linked?.metrics.ctr ?? 2.5} />
            </div>
            <div className="grid gap-2">
              <Label>Hook score</Label>
              <Input name="hook_score" type="number" defaultValue={linked?.metrics.hook_score ?? 75} />
            </div>
            <div className="grid gap-2">
              <Label>{locale === "zh" ? "完播率 (%)" : "Completion (%)"}</Label>
              <Input
                name="completion_rate"
                type="number"
                step="0.1"
                defaultValue={linked?.metrics.completion_rate ?? 45}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>{locale === "zh" ? "Hook 类型" : "Hook type"}</Label>
              <select name="hook_type" className="h-10 rounded-md border px-3 text-sm" defaultValue="first_person">
                {HOOK_TYPES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item[locale]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>{locale === "zh" ? "时长 (秒)" : "Length (sec)"}</Label>
              <Input name="length_sec" type="number" defaultValue={linked?.tags.length_sec ?? 15} />
            </div>
          </div>

          <input type="hidden" name="style_presets" value="ugc,cinematic" />
          <input type="hidden" name="aspect_ratio" value="9:16" />
          <input type="hidden" name="watch_time_sec" value={String(linked?.metrics.watch_time_sec ?? 8)} />
          <input type="hidden" name="engagement_rate" value={String(linked?.metrics.engagement_rate ?? 5)} />
          <input type="hidden" name="conversion_rate" value={String(linked?.metrics.conversion_rate ?? 2)} />
          <input type="hidden" name="roas" value={String(linked?.metrics.roas ?? 2)} />
          <input type="hidden" name="spend_usd" value={String(linked?.spend_usd ?? 400)} />
          <input type="hidden" name="impressions" value={String(linked?.impressions ?? 50000)} />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-700">{t.saved}</p> : null}

          <Button type="submit" disabled={isPending} className="rounded-lg bg-zinc-900 hover:bg-zinc-800">
            {linked ? t.update : t.bind}
          </Button>
        </form>
      )}
    </div>
  );
}
