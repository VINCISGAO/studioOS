"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPerformanceSourceAction } from "@/app/creative-intelligence-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/i18n";
import type { AttributionCampaignOption } from "@/lib/studioos/attribution-service";
import type { SerializedPerformanceSource } from "@/features/attribution/performance-source.types";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Database,
  FileText,
  FileUp,
  ImageIcon,
  Link2,
  Plus
} from "lucide-react";

const copy = {
  en: {
    title: "Social accounts & data sources",
    subtitle: "Add social links, CSV exports, screenshots, and reports. AI keeps learning from real performance.",
    addSource: "Add data source",
    campaign: "Campaign",
    platform: "Platform",
    url: "Video / ad / report URL",
    urlPlaceholder: "https://www.tiktok.com/@brand/video/...",
    upload: "CSV, screenshot, or report",
    uploadHint: "TikTok, YouTube, Meta CSV or dashboard screenshot · max 50MB",
    paste: "Paste CSV or dashboard data",
    pastePlaceholder: "views, likes, comments, shares, CTR, CPM, CPA, watch time, conversion...",
    submit: "Add source",
    importing: "Importing...",
    status: {
      PENDING: "Pending",
      IMPORTED: "Imported",
      ANALYZED: "Analyzed",
      FAILED: "Failed"
    },
    connected: "Analyzed",
    imported: "Imported",
    notConnected: "Not added",
    processing: "Processing",
    latestImport: "Latest import",
    add: "Add",
    viewAll: "View all data sources",
    recent: "Recent data sources",
    name: "Name",
    type: "Type",
    linkedCampaign: "Linked Campaign",
    uploadedAt: "Uploaded",
    action: "Action",
    viewData: "View data",
    viewEvidence: "View evidence",
    noSources: "No sources yet",
    chooseCampaign: "Choose a campaign before adding a source.",
    savedPending: "Source saved and waiting for import.",
    learnTitle: "AI insights coming soon",
    learnBody: "Once 3+ performance sources are imported, AI will summarize recurring winning patterns and optimize the next Campaign brief."
  },
  zh: {
    title: "社交账号与数据来源",
    subtitle: "添加社交链接、CSV 导出、后台截图和报告。AI 会持续从真实表现中学习。",
    addSource: "添加数据来源",
    campaign: "Campaign",
    platform: "平台",
    url: "视频 / 广告 / 报告链接",
    urlPlaceholder: "https://www.tiktok.com/@brand/video/...",
    upload: "CSV、截图或报告",
    uploadHint: "TikTok、YouTube、Meta CSV 或后台截图，单个文件 ≤ 50MB",
    paste: "粘贴 CSV 或后台数据",
    pastePlaceholder: "views, likes, comments, shares, CTR, CPM, CPA, watch time, conversion...",
    submit: "添加来源",
    importing: "导入中...",
    status: {
      PENDING: "待处理",
      IMPORTED: "已导入",
      ANALYZED: "已分析",
      FAILED: "失败"
    },
    connected: "已分析",
    imported: "已导入",
    notConnected: "未添加",
    processing: "处理中",
    latestImport: "最近导入",
    add: "添加",
    viewAll: "查看所有数据源",
    recent: "最近数据来源",
    name: "名称",
    type: "类型",
    linkedCampaign: "关联 Campaign",
    uploadedAt: "上传时间",
    action: "操作",
    viewData: "查看数据",
    viewEvidence: "查看证据",
    noSources: "暂无数据来源",
    chooseCampaign: "请先选择 Campaign。",
    savedPending: "来源已保存，等待后续导入。",
    learnTitle: "AI 洞察即将出现",
    learnBody: "当数据源达到 3 个以上时，AI 将自动生成表现归因洞察，帮助优化下一次 Campaign 策略。"
  }
};

const platformOptions = [
  { value: "TIKTOK", label: "TikTok", icon: "♪", accent: "bg-black text-white", logoSrc: "/images/social-sources/tiktok.svg", logoClassName: "scale-[1.34]" },
  { value: "INSTAGRAM", label: "Instagram", icon: "◎", accent: "bg-white text-zinc-700 ring-1 ring-zinc-100", logoSrc: "/images/social-sources/instagram.svg", logoClassName: "scale-[1.14]" },
  { value: "YOUTUBE", label: "YouTube", icon: "▶", accent: "bg-white text-red-600 ring-1 ring-zinc-100", logoSrc: "/images/social-sources/youtube.svg" },
  { value: "TELEGRAM", label: "Telegram", icon: "✈", accent: "bg-white text-sky-500 ring-1 ring-zinc-100", logoSrc: "/images/social-sources/Telegram.svg" },
  { value: "FACEBOOK_ADS", label: "Facebook", icon: "f", accent: "bg-white text-blue-600 ring-1 ring-zinc-100", logoSrc: "/images/social-sources/facebook.svg" },
  { value: "WHATSAPP", label: "WhatsApp", icon: "☎", accent: "bg-white text-emerald-600 ring-1 ring-zinc-100", logoSrc: "/images/social-sources/icons8-whatsapp.svg" },
  { value: "X", label: "X", icon: "𝕏", accent: "bg-zinc-950 text-white", logoSrc: "/images/social-sources/x.svg", logoClassName: "scale-[1.34]" },
  { value: "XIAOHONGSHU", label: "小红书", icon: "小", accent: "bg-white text-red-600 ring-1 ring-zinc-100", logoSrc: "/images/social-sources/xiaohongshu.svg" },
  { value: "DOUYIN", label: "抖音", icon: "抖", accent: "bg-zinc-900 text-white", logoSrc: "/images/social-sources/douyin.svg", logoClassName: "scale-[1.34]" }
];

function statusClass(status: SerializedPerformanceSource["status"]) {
  if (status === "ANALYZED") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "IMPORTED") return "bg-blue-50 text-blue-700 ring-blue-100";
  if (status === "FAILED") return "bg-red-50 text-red-700 ring-red-100";
  return "bg-amber-50 text-amber-700 ring-amber-100";
}

function sourceSummary(source: SerializedPerformanceSource, locale: Locale) {
  const summary = source.analysisJson?.summary;
  if (summary && typeof summary === "object" && !Array.isArray(summary)) {
    const localized = (summary as Record<string, unknown>)[locale];
    if (typeof localized === "string") return localized;
  }
  return source.errorMessage ?? source.url ?? source.fileName ?? source.campaignTitle;
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function metricTotal(sources: SerializedPerformanceSource[], platform: string) {
  const total = sources
    .filter((source) => source.platform === platform)
    .reduce((sum, source) => {
      const impressions = source.metricsJson?.impressions;
      return sum + (typeof impressions === "number" ? impressions : 0);
    }, 0);
  if (!total) return "0";
  if (total >= 1000000) return `${(total / 1000000).toFixed(1)}M`;
  if (total >= 1000) return `${(total / 1000).toFixed(1)}K`;
  return String(total);
}

function platformStatus(
  sources: SerializedPerformanceSource[],
  platform: string,
  t: typeof copy.en | typeof copy.zh
) {
  const items = sources.filter((source) => source.platform === platform);
  if (items.some((source) => source.status === "ANALYZED")) {
    return { label: t.connected, className: "bg-emerald-50 text-emerald-700 ring-emerald-100" };
  }
  if (items.some((source) => source.status === "IMPORTED")) {
    return { label: t.imported, className: "bg-blue-50 text-blue-700 ring-blue-100" };
  }
  if (items.some((source) => source.status === "PENDING")) {
    return { label: t.processing, className: "bg-amber-50 text-amber-700 ring-amber-100" };
  }
  return { label: t.notConnected, className: "bg-zinc-50 text-zinc-500 ring-zinc-200" };
}

function sourceTypeLabel(source: SerializedPerformanceSource, locale: Locale) {
  if (source.fileName?.toLowerCase().endsWith(".csv")) return locale === "zh" ? "文件上传" : "CSV upload";
  if (source.mimeType?.startsWith("image/")) return locale === "zh" ? "截图上传" : "Screenshot";
  if (source.url) return locale === "zh" ? "视频链接" : "Video link";
  return source.sourceType;
}

function PlatformLogo({
  label,
  icon,
  accent,
  logoSrc,
  logoClassName
}: {
  label: string;
  icon: string;
  accent: string;
  logoSrc: string;
  logoClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={cn(
        "relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl text-sm font-bold",
        failed ? accent : "bg-white ring-1 ring-zinc-100"
      )}
    >
      {failed ? <span className="absolute inset-0 flex items-center justify-center">{icon}</span> : null}
      {!failed ? (
        <Image
          src={logoSrc}
          alt={`${label} logo`}
          width={48}
          height={48}
          className={cn("relative h-full w-full object-contain", logoClassName)}
          onError={() => setFailed(true)}
        />
      ) : null}
    </span>
  );
}

export function SocialPerformanceSourcesPanel({
  locale,
  campaignOptions,
  sources
}: {
  locale: Locale;
  campaignOptions: AttributionCampaignOption[];
  sources: SerializedPerformanceSource[];
}) {
  const t = copy[locale];
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedCampaignRef, setSelectedCampaignRef] = useState(campaignOptions[0]?.campaignRef ?? "");
  const [selectedPlatform, setSelectedPlatform] = useState("TIKTOK");
  const [formOpen, setFormOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selected = useMemo(
    () => campaignOptions.find((item) => item.campaignRef === selectedCampaignRef) ?? campaignOptions[0],
    [campaignOptions, selectedCampaignRef]
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setSuccess(null);
    if (!selected) {
      setError(t.chooseCampaign);
      return;
    }

    const fd = new FormData(form);
    fd.set("campaign_ref", selected.campaignRef);
    fd.set("order_id", selected.orderId);
    if (selected.latestDeliverableId) fd.set("deliverable_id", selected.latestDeliverableId);
    if (selected.latestDeliverableVersion) fd.set("deliverable_version", String(selected.latestDeliverableVersion));
    fd.set("name", selected.title);
    fd.set("category", selected.category);
    fd.set("studio_id", selected.studioId);
    fd.set("lang", locale);

    startTransition(async () => {
      const result = await createPerformanceSourceAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess("analysis" in result && result.analysis ? result.analysis.summary : t.savedPending);
      form.reset();
      setFileName("");
      setFormOpen(false);
      router.refresh();
    });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-950">{t.title}</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">{t.subtitle}</p>
        </div>
        <Button
          type="button"
          onClick={() => setFormOpen((value) => !value)}
          className="rounded-xl bg-[#6d4cff] px-4 text-white shadow-sm hover:bg-[#5d3df0]"
        >
          <Plus className="h-4 w-4" />
          {t.addSource}
        </Button>
      </div>

      {formOpen ? (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <input type="hidden" name="lang" value={locale} />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="grid gap-2">
              <Label>{t.campaign}</Label>
              <select
                value={selectedCampaignRef}
                onChange={(event) => setSelectedCampaignRef(event.target.value)}
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                disabled={!campaignOptions.length}
              >
                {campaignOptions.map((item) => (
                  <option key={item.campaignRef} value={item.campaignRef}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label>{t.platform}</Label>
              <select
                name="platform"
                value={selectedPlatform}
                onChange={(event) => setSelectedPlatform(event.target.value)}
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
              >
                {platformOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label>{t.url}</Label>
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3">
                <Link2 className="h-4 w-4 text-zinc-400" />
                <input
                  name="source_url"
                  placeholder={t.urlPlaceholder}
                  className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 px-4 py-6 text-center transition hover:border-zinc-400">
              <FileUp className="h-5 w-5 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-700">{t.upload}</span>
              <span className="text-xs text-zinc-500">{fileName || t.uploadHint}</span>
              <input
                type="file"
                name="evidence_file"
                accept=".csv,.json,.txt,.pdf,text/csv,application/json,image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
              />
            </label>

            <div className="grid gap-2">
              <Label>{t.paste}</Label>
              <Textarea
                name="evidence_text"
                rows={5}
                placeholder={t.pastePlaceholder}
                className="resize-none rounded-xl font-mono text-xs"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
            </div>
            <Button
              type="submit"
              disabled={isPending || !campaignOptions.length}
              className="rounded-xl bg-zinc-900 hover:bg-zinc-800"
            >
              {isPending ? t.importing : t.submit}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {platformOptions.map((platform) => {
          const status = platformStatus(sources, platform.value, t);
          const count = sources.filter((source) => source.platform === platform.value).length;
          const latest = sources.find((source) => source.platform === platform.value);

          return (
            <article
              key={platform.value}
              className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PlatformLogo
                    label={platform.label}
                    icon={platform.icon}
                    accent={platform.accent}
                    logoSrc={platform.logoSrc}
                    logoClassName={platform.logoClassName}
                  />
                  <div>
                    <p className="text-sm font-semibold text-zinc-950">{platform.label}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {count} {locale === "zh" ? "条链接" : "sources"}
                    </p>
                  </div>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium ring-1", status.className)}>
                  {status.label}
                </span>
              </div>

              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-zinc-950">{metricTotal(sources, platform.value)}</p>
                  <p className="mt-1 text-xs text-zinc-500">{latest ? t.latestImport : t.notConnected}</p>
                </div>
                {latest ? (
                  <div className="h-10 w-24 rounded-xl bg-[#f4f0ff] p-2">
                    <svg viewBox="0 0 96 36" className="h-full w-full text-[#6d4cff]">
                      <path
                        d="M2 28 C12 22 17 15 26 20 S39 28 48 14 S63 9 72 18 S85 25 94 10"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="3"
                      />
                    </svg>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlatform(platform.value);
                      setFormOpen(true);
                    }}
                    className="inline-flex h-9 min-w-24 items-center justify-center gap-1 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t.add}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="text-center">
        <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-[#6d4cff]">
          {t.viewAll}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h3 className="font-semibold text-zinc-950">{t.recent}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-medium text-zinc-500">
              <tr>
                <th className="px-5 py-3 text-left">{t.name}</th>
                <th className="px-5 py-3 text-left">{t.platform}</th>
                <th className="px-5 py-3 text-left">{t.type}</th>
                <th className="px-5 py-3 text-left">{t.linkedCampaign}</th>
                <th className="px-5 py-3 text-left">{locale === "zh" ? "状态" : "Status"}</th>
                <th className="px-5 py-3 text-left">{t.uploadedAt}</th>
                <th className="px-5 py-3 text-right">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sources.length ? (
                sources.slice(0, 6).map((source) => (
                  <tr key={source.id} className="bg-white">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                          {source.mimeType?.startsWith("image/") ? (
                            <ImageIcon className="h-4 w-4" />
                          ) : source.fileName ? (
                            <FileText className="h-4 w-4" />
                          ) : (
                            <Link2 className="h-4 w-4" />
                          )}
                        </span>
                        <div>
                          <p className="max-w-[220px] truncate font-medium text-zinc-900">
                            {source.fileName ?? source.url ?? source.campaignTitle}
                          </p>
                          <p className="max-w-[220px] truncate text-xs text-zinc-500">{sourceSummary(source, locale)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-600">{source.platform.replace("_", " ")}</td>
                    <td className="px-5 py-4 text-zinc-600">{sourceTypeLabel(source, locale)}</td>
                    <td className="px-5 py-4 text-zinc-600">{source.campaignTitle}</td>
                    <td className="px-5 py-4">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium ring-1", statusClass(source.status))}>
                        {t.status[source.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-500">{formatDate(source.createdAt, locale)}</td>
                    <td className="px-5 py-4 text-right">
                      <button type="button" className="font-medium text-[#6d4cff]">
                        {source.fileKey ? t.viewData : t.viewEvidence}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-zinc-500">
                    <Database className="mx-auto mb-2 h-5 w-5 text-zinc-400" />
                    {t.noSources}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-violet-50 p-5 shadow-sm">
        <div>
          <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#6d4cff] ring-1 ring-violet-100">
            AI Insight
          </span>
          <h3 className="mt-3 text-lg font-semibold tracking-tight text-zinc-950">{t.learnTitle}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{t.learnBody}</p>
        </div>
      </div>
    </section>
  );
}
