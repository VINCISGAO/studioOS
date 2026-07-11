"use client";

import type { CreativeDirection } from "@/features/ai/creative-direction.types";
import {
  buildSchemeDisplayMetrics,
  type SchemeDisplayMetrics
} from "@/lib/studioos/brand-campaign-scheme-metrics";
import type { Locale } from "@/lib/i18n";
import type { StoredProjectReference } from "@/lib/campaign-types";
import type { StoredProject } from "@/lib/project-types";
import { cn } from "@/lib/utils";
import { Camera, Check, Crown, Download, FileText, Lock, Palette, UsersRound, Wand2 } from "lucide-react";

const copy = {
  en: {
    compare: "Creative Strategy comparison",
    customCompare: "Custom comparison",
    scheme: "Strategy",
    audienceMatch: "Audience Match",
    emotionalResonance: "Emotional Resonance",
    productIntegration: "Product Integration",
    difficulty: "AI Production Difficulty",
    platforms: "Suitable Platforms",
    recommended: "Recommended",
    expected: "Strategy Signals",
    estimatedCtr: "Estimated CTR",
    duration: "Recommended Duration",
    industries: "Suitable Industries",
    budget: "Estimated Budget",
    export: "Export all schemes (PDF)"
  },
  zh: {
    compare: "Creative Strategy 对比",
    customCompare: "自定义对比",
    scheme: "Strategy",
    audienceMatch: "Audience Match",
    emotionalResonance: "Emotional Resonance",
    productIntegration: "Product Integration",
    difficulty: "AI Production Difficulty",
    platforms: "Suitable Platforms",
    recommended: "推荐",
    expected: "策略判断",
    estimatedCtr: "Estimated CTR",
    duration: "Recommended Duration",
    industries: "Suitable Industries",
    budget: "Estimated Budget",
    export: "导出全部方案"
  }
} as const;

const DEFAULT_PLATFORMS = ["TikTok", "Meta"];

type QuestionnaireExport = {
  projectTitle?: string;
  adOneLiner?: string;
  industry?: string;
  brandName?: string;
  brandWebsite?: string;
  productDescription?: string;
  rawSummary?: string;
  creativeStyles?: string[];
  creativeStyleCustom?: string;
  mustInclude?: string[];
  mustIncludeCustom?: string;
  mustAvoid?: string[];
  mustAvoidCustom?: string;
  videoDuration?: string;
  videoDurationCustom?: string;
  aspectRatio?: string;
  resolution?: string;
  frameRate?: string;
  videoQuantity?: number;
  budgetRange?: string;
  deliveryTimeline?: string;
  scheduleStart?: string;
  scheduleDelivery?: string;
};

function readQuestionnaire(project: StoredProject): QuestionnaireExport {
  const raw = project.settings_json?.brand_questionnaire;
  return raw && typeof raw === "object" ? (raw as QuestionnaireExport) : {};
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatList(values: Array<string | undefined | null>) {
  return values.map((item) => String(item ?? "").trim()).filter(Boolean).join("、");
}

function renderField(label: string, value: unknown) {
  const text = Array.isArray(value) ? formatList(value.map((item) => String(item ?? ""))) : String(value ?? "").trim();
  if (!text) return "";
  return `<div class="field"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(text)}</dd></div>`;
}

function renderMultiline(label: string, value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return `<section class="block"><h2>${escapeHtml(label)}</h2><p>${escapeHtml(text).replace(/\n/g, "<br />")}</p></section>`;
}

function renderDirection(
  direction: CreativeDirection,
  metrics: SchemeDisplayMetrics,
  locale: Locale,
  index: number
) {
  const labels =
    locale === "zh"
      ? {
          scheme: "Creative Strategy",
          coreIdea: "Core Insight",
          hook: "Opening Hook",
          story: "Story Structure",
          visual: "视觉风格",
          tone: "镜头 / 音乐 / 色彩",
          shots: "镜头建议",
          cta: "行动号召",
          creator: "推荐创作者类型",
          outcome: "Expected Performance",
          rationale: "Why AI Recommends This",
          audienceMatch: "Audience Match",
          emotionalResonance: "Emotional Resonance",
          productIntegration: "Product Integration",
          estimatedCtr: "Estimated CTR",
          duration: "Recommended Duration"
        }
      : {
          scheme: "Creative Strategy",
          coreIdea: "Core Insight",
          hook: "Opening Hook",
          story: "Story Structure",
          visual: "Visual style",
          tone: "Camera / Music / Color",
          shots: "Shot list",
          cta: "CTA",
          creator: "Recommended creator type",
          outcome: "Expected Performance",
          rationale: "Why AI Recommends This",
          audienceMatch: "Audience Match",
          emotionalResonance: "Emotional Resonance",
          productIntegration: "Product Integration",
          estimatedCtr: "Estimated CTR",
          duration: "Recommended Duration"
        };

  const shotList = Array.isArray(direction.shotList) ? direction.shotList : [];
  return `
    <section class="scheme">
      <h2>${labels.scheme} ${String.fromCharCode(65 + index)} · ${escapeHtml(direction.creativeStrategy || direction.title)}</h2>
      <div class="metrics">
        ${renderField(labels.audienceMatch, `${metrics.audienceMatch}%`)}
        ${renderField(labels.emotionalResonance, `${metrics.emotionalResonance}%`)}
        ${renderField(labels.productIntegration, `${metrics.productIntegration}%`)}
        ${renderField(labels.estimatedCtr, metrics.estimatedCtr)}
        ${renderField(labels.duration, metrics.recommendedDuration)}
      </div>
      ${renderMultiline(labels.coreIdea, direction.coreInsight || direction.coreIdea)}
      ${renderMultiline("Big Idea", direction.bigIdea || direction.coreIdea)}
      ${renderMultiline(labels.hook, direction.openingHook || direction.hook)}
      ${renderMultiline(labels.story, direction.storyStructure?.length ? direction.storyStructure.map((scene) => `${scene.label} ${scene.title}: ${scene.purpose}`).join("\n") : direction.story)}
      <dl class="grid">
        ${renderField(labels.visual, direction.visualStyle)}
        ${renderField(labels.tone, [direction.cameraLanguage, direction.musicDirection, direction.colorPalette].filter(Boolean).join(" / ") || direction.tone)}
        ${renderField(labels.creator, direction.creatorRequirements || direction.recommendedCreatorType)}
        ${renderField(labels.cta, direction.cta)}
      </dl>
      ${shotList.length ? `<section class="block"><h3>${labels.shots}</h3><ol>${shotList.map((shot) => `<li>${escapeHtml(shot)}</li>`).join("")}</ol></section>` : ""}
      ${renderMultiline(labels.outcome, direction.estimatedPerformance || direction.expectedOutcome)}
      ${renderMultiline(labels.rationale, direction.whyAiRecommendsThis || direction.rationale)}
    </section>
  `;
}

function exportSchemesPdf(input: {
  locale: Locale;
  project: StoredProject;
  references: StoredProjectReference[];
  directions: CreativeDirection[];
  metricsList: SchemeDisplayMetrics[];
  platforms: string[];
  selectedId: string | null;
  budget: string;
}) {
  const { locale, project, references: uploadedReferences, directions, metricsList, platforms, selectedId, budget } = input;
  const q = readQuestionnaire(project);
  const zh = locale === "zh";
  const title = q.projectTitle || project.title || project.product_name || "VINCIS Campaign";
  const briefText = q.productDescription || q.rawSummary || project.campaign_goal || project.notes;
  const platformText = formatList(platforms.length ? platforms : project.target_platform?.split(",") ?? []);
  const projectReferences = project.reference_links
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const references = [
    ...uploadedReferences.map((item) => item.source_url),
    ...projectReferences
  ].filter((item, index, list) => item && list.indexOf(item) === index);
  const selectedIndex = Math.max(0, directions.findIndex((direction) => direction.id === selectedId));
  const selectedLabel = directions[selectedIndex] ? String.fromCharCode(65 + selectedIndex) : "";
  const labels = zh
    ? {
        docTitle: "VINCIS Creative Strategy 导出",
        overview: "一、已填写需求",
        production: "二、制作与交付设置",
        references: "三、素材与参考",
        schemes: "四、全部 Creative Strategy",
        selected: "当前选择方案",
        generated: "导出时间",
        projectName: "项目名称",
        oneLiner: "广告一句话",
        industry: "所属行业",
        brand: "品牌名称",
        website: "品牌官网",
        brief: "详细需求",
        style: "风格偏好",
        include: "必须包含",
        avoid: "需要避免",
        duration: "视频时长",
        aspect: "视频比例",
        resolution: "分辨率",
        fps: "帧率",
        quantity: "视频数量",
        budget: "已选预算",
        timeline: "预计周期",
        dates: "时间安排",
        platforms: "投放平台",
        refs: "参考链接 / 参考视频"
      }
    : {
        docTitle: "VINCIS Creative Strategy Export",
        overview: "1. Filled Brief",
        production: "2. Production & Delivery Settings",
        references: "3. Assets & References",
        schemes: "4. All Creative Strategy Routes",
        selected: "Selected scheme",
        generated: "Exported at",
        projectName: "Project name",
        oneLiner: "Ad one-liner",
        industry: "Industry",
        brand: "Brand name",
        website: "Brand website",
        brief: "Detailed brief",
        style: "Style preference",
        include: "Must include",
        avoid: "Must avoid",
        duration: "Video duration",
        aspect: "Aspect ratio",
        resolution: "Resolution",
        fps: "Frame rate",
        quantity: "Video quantity",
        budget: "Selected budget",
        timeline: "Timeline",
        dates: "Schedule",
        platforms: "Platforms",
        refs: "Reference links / videos"
      };
  const closeLabel = zh ? "关闭预览" : "Close preview";
  const closeFallback = zh ? "如果窗口没有关闭，请直接关闭当前标签页。" : "If the window does not close, close this tab directly.";

  const html = `<!doctype html>
<html lang="${zh ? "zh-CN" : "en"}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)} - PDF</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #18181b; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif; background: #fff; }
    h1 { margin: 0 0 8px; font-size: 26px; letter-spacing: -0.03em; }
    h2 { margin: 0 0 12px; font-size: 17px; }
    h3 { margin: 0 0 8px; font-size: 14px; }
    p { margin: 0; line-height: 1.7; color: #3f3f46; }
    .meta { margin-top: 8px; color: #71717a; font-size: 12px; }
    .section, .scheme { break-inside: avoid; margin-top: 18px; padding: 18px; border: 1px solid #e4e4e7; border-radius: 18px; }
    .scheme { page-break-inside: avoid; }
    .grid, .metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 14px; }
    .metrics { grid-template-columns: repeat(5, minmax(0, 1fr)); margin-bottom: 14px; }
    .field { padding: 10px 12px; border-radius: 12px; background: #fafafa; }
    dt { margin: 0 0 4px; color: #71717a; font-size: 11px; }
    dd { margin: 0; color: #18181b; font-size: 13px; font-weight: 600; line-height: 1.5; word-break: break-word; }
    .block { margin-top: 12px; }
    ol { margin: 0; padding-left: 20px; color: #3f3f46; line-height: 1.7; }
    .tag { display: inline-block; margin-left: 8px; padding: 2px 8px; border-radius: 999px; background: #f5f3ff; color: #6d28d9; font-size: 11px; }
    .close-preview { position: fixed; right: 20px; top: 20px; z-index: 20; border: 1px solid #ddd6fe; border-radius: 999px; background: #fff; color: #6d28d9; font-size: 13px; font-weight: 700; padding: 10px 16px; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12); cursor: pointer; }
    .close-preview:hover { background: #f5f3ff; }
    @media print { button, .close-preview { display: none; } }
  </style>
</head>
<body>
  <button class="close-preview" type="button" onclick="window.close(); setTimeout(() => alert('${escapeHtml(closeFallback)}'), 150);">${escapeHtml(closeLabel)}</button>
  <h1>${escapeHtml(labels.docTitle)}</h1>
  <p class="meta">${escapeHtml(labels.generated)}：${escapeHtml(new Date().toLocaleString(zh ? "zh-CN" : "en-US"))}${selectedLabel ? ` · ${escapeHtml(labels.selected)}：${selectedLabel}` : ""}</p>

  <section class="section">
    <h2>${escapeHtml(labels.overview)}</h2>
    <dl class="grid">
      ${renderField(labels.projectName, title)}
      ${renderField(labels.oneLiner, q.adOneLiner)}
      ${renderField(labels.industry, q.industry || project.category)}
      ${renderField(labels.brand, q.brandName || project.company_name)}
      ${renderField(labels.website, q.brandWebsite || project.product_url)}
      ${renderField(labels.platforms, platformText)}
      ${renderField(labels.style, formatList([...(q.creativeStyles ?? []), q.creativeStyleCustom]))}
      ${renderField(labels.include, formatList([...(q.mustInclude ?? []), q.mustIncludeCustom]))}
      ${renderField(labels.avoid, formatList([...(q.mustAvoid ?? []), q.mustAvoidCustom]))}
    </dl>
    ${renderMultiline(labels.brief, briefText)}
  </section>

  <section class="section">
    <h2>${escapeHtml(labels.production)}</h2>
    <dl class="grid">
      ${renderField(labels.duration, q.videoDuration === "custom" ? q.videoDurationCustom : q.videoDuration)}
      ${renderField(labels.aspect, q.aspectRatio || project.video_format)}
      ${renderField(labels.resolution, q.resolution)}
      ${renderField(labels.fps, q.frameRate)}
      ${renderField(labels.quantity, q.videoQuantity || project.video_count || project.output_quantity)}
      ${renderField(labels.budget, budget || q.budgetRange || project.budget_range)}
      ${renderField(labels.timeline, q.deliveryTimeline)}
      ${renderField(labels.dates, formatList([q.scheduleStart, q.scheduleDelivery]))}
    </dl>
  </section>

  <section class="section">
    <h2>${escapeHtml(labels.references)}</h2>
    ${references.length ? `<ol>${references.map((ref) => `<li>${escapeHtml(ref)}</li>`).join("")}</ol>` : `<p>${escapeHtml(zh ? "暂无参考链接或视频记录。" : "No reference links or videos recorded.")}</p>`}
  </section>

  <section class="section">
    <h2>${escapeHtml(labels.schemes)}</h2>
    ${directions.map((direction, index) => {
      const metrics = metricsList[index] ?? metricsList[0];
      return metrics ? renderDirection(direction, metrics, locale, index) : "";
    }).join("")}
  </section>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=960,height=1200");
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => {
    printWindow.print();
  }, 300);
}

export function BrandCampaignStep2SchemeSidebar({
  locale,
  project,
  references,
  directions,
  selectedId,
  platforms,
  fallbackBudget,
  budget,
  creatorOption
}: {
  locale: Locale;
  project: StoredProject;
  references: StoredProjectReference[];
  directions: CreativeDirection[];
  selectedId: string | null;
  platforms: string[];
  fallbackBudget: number;
  budget: string;
  creatorOption?: {
    selected: boolean;
    badge: string;
    title: string;
    body: string;
    onSelect: () => void;
  };
}) {
  const t = copy[locale];
  const metricsList = directions.map((direction, index) =>
    buildSchemeDisplayMetrics(direction, index, locale, fallbackBudget)
  );
  const selectedIndex = directions.findIndex((direction) => direction.id === selectedId);
  const selectedMetrics = selectedIndex >= 0 ? metricsList[selectedIndex] : metricsList[0];
  const fallbackPlatformLabel = (platforms.length ? platforms : DEFAULT_PLATFORMS).slice(0, 2).join(", ");

  if (!selectedMetrics) return null;

  return (
    <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-950">{t.compare}</h3>
          <button type="button" className="text-xs font-medium text-violet-600 hover:text-violet-700">
            {t.customCompare}
          </button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[280px] text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-500">
                <th className="pb-2 pr-2 font-medium">{t.scheme}</th>
                {metricsList.map((metrics, colIndex) => (
                  <th
                    key={metrics.label}
                    className={cn(
                      "px-1 pb-2 text-center font-medium",
                      colIndex === selectedIndex ? "rounded-t-lg bg-violet-50 text-violet-700" : "",
                      metrics.recommended && colIndex !== selectedIndex && "text-violet-700"
                    )}
                  >
                    {metrics.label}
                    {metrics.recommended ? (
                      <span className="mt-0.5 block text-[10px] font-normal text-violet-600">{t.recommended}</span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-zinc-700">
              {[
                { label: t.audienceMatch, render: (m: SchemeDisplayMetrics) => `${m.audienceMatch}%` },
                { label: t.emotionalResonance, render: (m: SchemeDisplayMetrics) => `${m.emotionalResonance}%` },
                { label: t.productIntegration, render: (m: SchemeDisplayMetrics) => `${m.productIntegration}%` },
                {
                  label: t.difficulty,
                  render: (m: SchemeDisplayMetrics) => m.aiProductionDifficulty
                }
              ].map((row) => (
                <tr key={row.label} className="border-b border-zinc-50 last:border-0">
                  <td className="py-2 pr-2 text-zinc-500">{row.label}</td>
                  {metricsList.map((metrics, colIndex) => (
                    <td
                      key={`${row.label}-${metrics.label}`}
                      className={cn(
                        "px-1 py-2 text-center font-medium",
                        colIndex === selectedIndex && "bg-violet-50 text-violet-800"
                      )}
                    >
                      {row.render(metrics)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="py-2 pr-2 text-zinc-500">{t.platforms}</td>
                {metricsList.map((metrics, colIndex) => (
                  <td
                    key={`platforms-${metrics.label}`}
                    className={cn(
                      "px-1 py-2 text-center text-[10px] leading-4",
                      colIndex === selectedIndex && "rounded-b-lg bg-violet-50 text-violet-800"
                    )}
                  >
                    {metrics.suitablePlatforms.length ? metrics.suitablePlatforms.slice(0, 2).join(", ") : fallbackPlatformLabel}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-950">
          {t.expected} · {t.scheme} {selectedMetrics.label}
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            { label: t.estimatedCtr, value: selectedMetrics.estimatedCtr },
            { label: t.duration, value: selectedMetrics.recommendedDuration },
            {
              label: t.industries,
              value: selectedMetrics.suitableIndustries.length
                ? selectedMetrics.suitableIndustries.slice(0, 3).join(", ")
                : locale === "zh"
                  ? "待 AI 判断"
                  : "AI pending"
            },
            { label: t.budget, value: `$${selectedMetrics.budgetTotal}` }
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2.5">
              <p className="text-[10px] text-zinc-500">{item.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-zinc-950">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() =>
          exportSchemesPdf({
            locale,
            project,
            references,
            directions,
            metricsList,
            platforms,
            selectedId,
            budget
          })
        }
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
      >
        <Download className="h-4 w-4" />
        {t.export}
      </button>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-950">
          {locale === "zh" ? "专业版解锁更多创意工具" : "Unlock More Creative Tools"}
        </h3>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          {locale === "zh" ? "仅展示创意策略预览，专业工具发布后开放。" : "Strategy preview now. Professional tools unlock after publish."}
        </p>
        <div className="mt-3 space-y-2">
          {[
            { icon: Wand2, label: "AI Moodboard", hint: locale === "zh" ? "参考画面与情绪板" : "Visual references" },
            { icon: Palette, label: "Color Palette", hint: locale === "zh" ? "色彩方案" : "Color system" },
            { icon: Camera, label: "Camera Style", hint: locale === "zh" ? "镜头风格" : "Camera language" },
            { icon: FileText, label: "Shot List", hint: locale === "zh" ? "镜头清单" : "Shot breakdown" }
          ].map(({ icon: Icon, label, hint }) => (
            <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2.5">
              <span className="flex min-w-0 items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-zinc-900">{label}</span>
                  <span className="block truncate text-[10px] text-zinc-500">{hint}</span>
                </span>
              </span>
              <Lock className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          <Crown className="h-4 w-4" />
          {locale === "zh" ? "升级到 Professional" : "Upgrade to Professional"}
        </button>
      </section>

      {creatorOption ? (
        <button
          type="button"
          onClick={creatorOption.onSelect}
          className={cn(
            "group w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition",
            creatorOption.selected
              ? "border-violet-300 shadow-[0_18px_45px_rgba(124,58,237,0.14)] ring-2 ring-violet-100"
              : "border-dashed border-zinc-300 hover:border-violet-300 hover:shadow-md"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <UsersRound className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
                  {creatorOption.badge}
                </span>
                <span className="mt-2 block text-sm font-semibold text-zinc-950">{creatorOption.title}</span>
                <span className="mt-1 block text-xs leading-5 text-zinc-500">{creatorOption.body}</span>
              </span>
            </div>
            <span
              className={cn(
                "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                creatorOption.selected
                  ? "bg-violet-600 text-white"
                  : "border-2 border-zinc-300 group-hover:border-violet-300"
              )}
            >
              {creatorOption.selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
            </span>
          </div>
        </button>
      ) : null}
    </aside>
  );
}
