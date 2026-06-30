"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  addReferenceAction,
  publishProjectAction,
  removeReferenceAction,
  saveDraftAction,
  saveWizardBriefAction,
  saveWizardStep1Action,
  saveWizardStep2Action,
  saveWizardStep3Action,
  saveWizardStep4Action,
  saveWizardStep5Action
} from "@/app/project-wizard-actions";
import { WizardIntelligenceBanner } from "@/components/studioos/wizard-intelligence-banner";
import { WizardProductHero } from "@/components/studioos/wizard-product-hero";
import { WizardProgressPanel } from "@/components/studioos/ui/wizard-progress-panel";
import { WizardStepper } from "@/components/studioos/ui/wizard-stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  StoredCreativeBrief,
  StoredCreativePackItem,
  StoredProjectAsset,
  StoredProjectReference
} from "@/lib/campaign-types";
import {
  clampWizardStep,
  migrateLegacyProjectWizardStep
} from "@/lib/campaign/wizard-steps";
import { useWizardProgress } from "@/hooks/use-wizard-progress";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { CommercialObjective, StoredProject } from "@/lib/project-types";
import type { WizardIntelligencePrefill } from "@/lib/studioos/creative-performance-types";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Link2,
  Loader2,
  Rocket,
  Sparkles,
  Target,
  Video
} from "lucide-react";

const STEP_META = {
  en: [
    { headline: "What's the goal?", subtitle: "Pick category, objective, and audience — about 1 minute." },
    { headline: "What are you promoting?", subtitle: "Upload a product photo and tell us the basics." },
    { headline: "Show us ads you like", subtitle: "Paste 1–3 reference links from YouTube, TikTok, or Instagram." },
    { headline: "Analyzing your inputs", subtitle: "We analyze references and draft a creative direction." },
    { headline: "Choose your ad specs", subtitle: "Pick style, length, and budget — you can change these later." },
    { headline: "Review your creative pack", subtitle: "Storyboard and script generated from your brief." },
    { headline: "Ready to publish?", subtitle: "Publish to start matching with Studios worldwide." }
  ],
  zh: [
    { headline: "这次广告想达成什么？", subtitle: "选择品类、目标和受众 — 大约 1 分钟。" },
    { headline: "你要推广什么？", subtitle: "上传产品照片，填几个简单信息。" },
    { headline: "找几条你觉得好的广告", subtitle: "粘贴 1–3 条 YouTube、TikTok 或 Instagram 参考链接。" },
    { headline: "正在分析", subtitle: "分析参考视频，生成创意 Brief。" },
    { headline: "选择广告规格", subtitle: "选风格、时长和预算，之后还可以改。" },
    { headline: "看看创意方案", subtitle: "根据 Brief 自动生成的分镜和脚本。" },
    { headline: "确认发布？", subtitle: "发布后系统将为你匹配全球 Studio。" }
  ]
} as const;

const CATEGORIES = [
  { id: "Beauty", en: "Beauty", zh: "美妆护肤" },
  { id: "Consumer tech", en: "Tech", zh: "数码科技" },
  { id: "CPG", en: "CPG", zh: "快消品" },
  { id: "Fashion", en: "Fashion", zh: "时尚服饰" },
  { id: "Food & beverage", en: "Food & drink", zh: "食品饮料" },
  { id: "SaaS", en: "SaaS", zh: "软件 SaaS" },
  { id: "Travel", en: "Travel", zh: "旅游出行" }
];

const OBJECTIVES = [
  { id: "launch", en: "New launch", zh: "新品上市", hint: { en: "Introduce a new product", zh: "推广新产品" } },
  { id: "scale", en: "Scale ads", zh: "放量投放", hint: { en: "Scale winning creatives", zh: "放大跑量素材" } },
  { id: "test", en: "Test ideas", zh: "测试创意", hint: { en: "Try new angles fast", zh: "快速试错新方向" } },
  { id: "seasonal", en: "Seasonal", zh: "节日大促", hint: { en: "Holiday or promo push", zh: "节日促销节点" } }
];

const AUDIENCE_PRESETS = {
  en: ["Gen Z 18-24", "Women 25-35", "Urban professionals", "Parents", "Male tech fans"],
  zh: ["18-24 岁年轻人", "25-35 岁女性", "都市白领", "宝妈群体", "男性数码玩家"]
};

const STYLE_PRESETS = [
  { id: "cinematic", en: "Cinematic", zh: "电影感" },
  { id: "ugc", en: "UGC native", zh: "原生 UGC" },
  { id: "minimal", en: "Minimal", zh: "极简高级" },
  { id: "luxury", en: "Luxury", zh: "奢侈质感" },
  { id: "apple", en: "Apple-like", zh: "Apple 风" },
  { id: "nike", en: "Nike energy", zh: "Nike 活力" }
];

const VIDEO_LENGTHS = ["15s", "30s", "45s", "60s"];
const ASPECT_RATIOS = [
  { id: "9:16", en: "9:16 Vertical", zh: "9:16 竖屏" },
  { id: "16:9", en: "16:9 Landscape", zh: "16:9 横屏" },
  { id: "1:1", en: "1:1 Square", zh: "1:1 方形" }
];
const QUANTITIES = [1, 3, 5, 10];
const BUDGET_RANGES = ["$500 – $1,000", "$1,000 – $2,500", "$2,500 – $5,000", "$5,000+"];

type WizardData = {
  project: StoredProject | null;
  assets: StoredProjectAsset[];
  references: StoredProjectReference[];
  brief: StoredCreativeBrief | null;
  pack: StoredCreativePackItem[];
};

function OptionButton({
  active,
  onClick,
  children,
  className
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-3 text-left text-sm transition",
        active
          ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
        className
      )}
    >
      {children}
    </button>
  );
}

export function ProjectWizard({
  locale,
  initialData,
  initialStep = 1,
  intelligencePrefill,
  refreshKey = ""
}: {
  locale: Locale;
  initialData: WizardData;
  initialStep?: number;
  intelligencePrefill?: WizardIntelligencePrefill;
  refreshKey?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(clampWizardStep(migrateLegacyProjectWizardStep(initialStep)));
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState(initialData);
  const [showMore, setShowMore] = useState(false);
  const [analysisStarted, setAnalysisStarted] = useState(false);

  const projectId = data.project?.id;
  const { draft: progressDraft } = useWizardProgress(projectId, step === 4);
  const meta = STEP_META[locale][step - 1] ?? STEP_META[locale][0];

  const [productName, setProductName] = useState(initialData.project?.product_name ?? "");
  const [productUrl, setProductUrl] = useState(initialData.project?.product_url ?? "");
  const [category, setCategory] = useState(initialData.project?.category ?? "Beauty");
  const [objective, setObjective] = useState(initialData.project?.commercial_objective ?? "launch");
  const [targetAudience, setTargetAudience] = useState(initialData.project?.target_audience ?? "");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [stylePresets, setStylePresets] = useState<string[]>(initialData.project?.style_presets ?? ["cinematic"]);
  const [videoLengths, setVideoLengths] = useState<string[]>(initialData.project?.video_lengths ?? ["30s"]);
  const [aspectRatios, setAspectRatios] = useState<string[]>(initialData.project?.aspect_ratios ?? ["9:16"]);
  const [quantity, setQuantity] = useState(initialData.project?.output_quantity ?? 3);
  const [budgetRange, setBudgetRange] = useState(initialData.project?.budget_range ?? BUDGET_RANGES[1]);
  const [deadline, setDeadline] = useState(initialData.project?.deadline ?? "");
  const [scriptEdit, setScriptEdit] = useState("");
  const [publishTitle, setPublishTitle] = useState(initialData.project?.title ?? "");
  const [confirmed, setConfirmed] = useState(false);

  const logoAsset = data.assets.find((item) => item.type === "logo");
  const productOriginalAsset = data.assets.find((item) => item.type === "product_image_original");
  const productCommercialAsset = data.assets.find((item) => item.type === "product_image");

  useEffect(() => {
    setStep(clampWizardStep(migrateLegacyProjectWizardStep(initialStep)));
  }, [initialStep]);

  useEffect(() => {
    if (step !== 4 || analysisStarted || data.brief?.executive_summary) return;
    setAnalysisStarted(true);
    startTransition(async () => {
      setError(null);
      const result = await saveWizardStep3Action(formBase());
      setAnalysisStarted(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.brief) {
        setData((prev) => ({ ...prev, brief: result.brief ?? prev.brief }));
      }
      router.refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    setData(initialData);
    if (initialData.project?.title) {
      setPublishTitle(initialData.project.title);
    }
  }, [initialData, refreshKey]);

  useEffect(() => {
    if (!intelligencePrefill || intelligencePrefill.source === "none") return;

    const savedPresets = initialData.project?.style_presets ?? [];
    const isFreshDraft =
      !savedPresets.length ||
      (savedPresets.length === 1 && savedPresets[0] === "cinematic" && !initialData.project?.wizard_step);

    if (!isFreshDraft) return;

    if (intelligencePrefill.style_presets.length) setStylePresets(intelligencePrefill.style_presets);
    if (intelligencePrefill.video_lengths.length) setVideoLengths(intelligencePrefill.video_lengths);
    if (intelligencePrefill.aspect_ratios.length) setAspectRatios(intelligencePrefill.aspect_ratios);
  }, [intelligencePrefill, initialData.project]);

  function toggle(list: string[], value: string, setter: (v: string[]) => void, max?: number) {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
      return;
    }
    if (max && list.length >= max) {
      setter([...list.slice(1), value]);
      return;
    }
    setter([...list, value]);
  }

  function formBase() {
    const fd = new FormData();
    fd.set("lang", locale);
    if (projectId) fd.set("project_id", projectId);
    return fd;
  }

  function goToStep(next: number) {
    const clamped = clampWizardStep(next);
    setStep(clamped);
    if (projectId) {
      router.push(withLocale(`/brand/projects/new?project=${projectId}&step=${clamped}`, locale));
    }
  }

  function handleBriefContinue() {
    startTransition(async () => {
      setError(null);
      const fd = formBase();
      fd.set("category", category);
      fd.set("commercial_objective", objective);
      fd.set("target_audience", targetAudience);
      const result = await saveWizardBriefAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      goToStep(2);
    });
  }

  function handleStep1Continue() {
    startTransition(async () => {
      setError(null);
      const fd = formBase();
      fd.set("product_name", productName);
      fd.set("product_url", productUrl);
      const result = await saveWizardStep1Action(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      goToStep(3);
    });
  }

  function handleAddReference() {
    if (!referenceUrl.trim() || !projectId) return;
    startTransition(async () => {
      const fd = formBase();
      fd.set("source_url", referenceUrl.trim());
      await addReferenceAction(fd);
      setReferenceUrl("");
      router.refresh();
    });
  }

  function handleStep2Continue() {
    startTransition(async () => {
      setError(null);
      const result = await saveWizardStep2Action(formBase());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      goToStep(4);
    });
  }

  function handleStep3Continue() {
    if (!data.brief?.executive_summary) {
      setError(locale === "zh" ? "分析尚未完成" : "Analysis not complete yet");
      return;
    }
    goToStep(5);
  }

  function handleStep4Continue() {
    startTransition(async () => {
      setError(null);
      const fd = formBase();
      stylePresets.forEach((item) => fd.append("style_presets", item));
      videoLengths.forEach((item) => fd.append("video_lengths", item));
      aspectRatios.forEach((item) => fd.append("aspect_ratios", item));
      fd.set("output_quantity", String(quantity));
      fd.set("budget_range", budgetRange);
      fd.set("deadline", deadline);
      const result = await saveWizardStep4Action(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const step5 = await saveWizardStep5Action(formBase());
      if (!step5.ok) {
        setError(step5.error);
        return;
      }
      if (step5.pack) {
        setData((prev) => ({ ...prev, pack: step5.pack ?? prev.pack }));
      }
      router.refresh();
      goToStep(6);
    });
  }

  function handleStep5Continue() {
    startTransition(async () => {
      setError(null);
      const fd = formBase();
      if (scriptEdit) fd.set("script_edit", scriptEdit);
      const step5 = await saveWizardStep5Action(fd);
      if (!step5.ok) {
        setError(step5.error);
        return;
      }
      if (step5.pack) {
        setData((prev) => ({ ...prev, pack: step5.pack ?? prev.pack }));
      }
      router.refresh();
      goToStep(7);
    });
  }

  function handlePublish() {
    startTransition(async () => {
      setError(null);
      const fd = formBase();
      fd.set("title", publishTitle);
      fd.set("confirmed", confirmed ? "1" : "0");
      const result = await publishProjectAction(fd);
      if (result && "ok" in result && !result.ok) {
        setError(result.error);
      }
    });
  }

  function handleSaveDraft() {
    if (!projectId) return;
    startTransition(async () => {
      await saveDraftAction(formBase());
    });
  }

  const brief = data.brief;
  const storyboard = data.pack.find((item) => item.type === "storyboard");
  const script = data.pack.find((item) => item.type === "script");

  return (
    <div className="mx-auto max-w-2xl pb-32">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-zinc-500">
          {locale === "zh" ? "新建 Campaign" : "New campaign"}
        </p>
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isPending}
          className="text-xs font-medium text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline"
        >
          {locale === "zh" ? "保存草稿" : "Save draft"}
        </button>
      </div>

      <div className="mb-8">
        <WizardStepper locale={locale} currentStep={step} compact />
        <h1 className="mt-6 text-title text-foreground">{meta.headline}</h1>
        <p className="mt-2 text-body text-muted-foreground">{meta.subtitle}</p>
      </div>

      {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {intelligencePrefill ? (
        <div className="mb-4">
          <WizardIntelligenceBanner locale={locale} prefill={intelligencePrefill} step={step} />
        </div>
      ) : null}

      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-8">
        {step === 1 ? (
          <div className="space-y-8">
            <div className="grid gap-3">
              <Label>{locale === "zh" ? "这次广告想达成什么？" : "What's the goal?"}</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {OBJECTIVES.map((item) => (
                  <OptionButton
                    key={item.id}
                    active={objective === item.id}
                    onClick={() => setObjective(item.id as CommercialObjective)}
                  >
                    <p className="font-medium">{item[locale]}</p>
                    <p className={cn("mt-0.5 text-xs", objective === item.id ? "text-zinc-300" : "text-zinc-500")}>
                      {item.hint[locale]}
                    </p>
                  </OptionButton>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <Label>{locale === "zh" ? "属于哪个品类？" : "Category"}</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition",
                      category === item.id
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 text-zinc-700 hover:border-zinc-300"
                    )}
                  >
                    {item[locale]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="target_audience">{locale === "zh" ? "目标人群" : "Target audience"}</Label>
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_PRESETS[locale].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetAudience(preset)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs",
                      targetAudience === preset
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <Textarea
                id="target_audience"
                rows={2}
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder={locale === "zh" ? "也可以自己描述…" : "Or describe your audience…"}
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-8">
            {projectId ? (
              <WizardProductHero
                locale={locale}
                projectId={projectId}
                originalAsset={productOriginalAsset}
                commercialAsset={productCommercialAsset}
                logoAsset={logoAsset}
                onUpdated={() => router.refresh()}
              />
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="product_name">{locale === "zh" ? "产品叫什么？" : "Product name"}</Label>
              <Input
                id="product_name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={locale === "zh" ? "例如：Northline 保湿精华" : "e.g. Northline Hydrating Serum"}
                className="h-11"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="product_url">{locale === "zh" ? "产品链接（可选）" : "Product URL (optional)"}</Label>
              <Input
                id="product_url"
                type="url"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-4">
              <div className="flex items-start gap-3">
                <Video className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" />
                <p className="text-sm leading-6 text-zinc-600">
                  {locale === "zh"
                    ? "找 1–3 条你觉得「就是这个感觉」的广告，粘贴链接即可。我们会分析风格、节奏和 Hook。"
                    : "Add 1–3 ads that match the vibe you want. We'll analyze style, pacing, and hooks."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddReference();
                    }
                  }}
                  placeholder="https://www.youtube.com/... or tiktok.com/..."
                  className="h-11 pl-10"
                />
              </div>
              <Button
                type="button"
                className="h-11 shrink-0 rounded-full px-6"
                onClick={handleAddReference}
                disabled={isPending || !referenceUrl.trim()}
              >
                {locale === "zh" ? "添加" : "Add"}
              </Button>
            </div>

            <ul className="space-y-2">
              {data.references.length ? (
                data.references.map((ref) => (
                  <li
                    key={ref.id}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-sm"
                  >
                    <span className="truncate text-zinc-700">{ref.source_url}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-zinc-500"
                      onClick={() =>
                        startTransition(async () => {
                          const fd = formBase();
                          fd.set("ref_id", ref.id);
                          await removeReferenceAction(fd);
                          router.refresh();
                        })
                      }
                    >
                      {locale === "zh" ? "删除" : "Remove"}
                    </Button>
                  </li>
                ))
              ) : (
                <li className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-zinc-500">
                  {locale === "zh" ? "还没有参考链接，先添加一条吧" : "No references yet — add your first link"}
                </li>
              )}
            </ul>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-5">
            <WizardProgressPanel
              locale={locale}
              draft={progressDraft}
              fallbackMessage={locale === "zh" ? "正在分析参考视频…" : "Analyzing references…"}
            />
            {brief ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  {locale === "zh" ? "AI 创意 Brief" : "AI creative brief"}
                </div>
                <p className="text-sm leading-7 text-zinc-700">{brief.executive_summary}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border bg-zinc-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      {locale === "zh" ? "视觉风格" : "Visual style"}
                    </p>
                    <p className="mt-2 text-sm text-zinc-700">{brief.visual_style}</p>
                  </div>
                  <div className="rounded-xl border bg-zinc-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Hook</p>
                    <p className="mt-2 text-sm text-zinc-700">{brief.hook_style}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-500">
                {locale === "zh" ? "点击继续生成 Brief" : "Continue to generate your brief"}
              </p>
            )}
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-8">
            <div>
              <Label>{locale === "zh" ? "广告风格（选 1–2 个）" : "Ad style (pick 1–2)"}</Label>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {STYLE_PRESETS.map((item) => (
                  <OptionButton
                    key={item.id}
                    active={stylePresets.includes(item.id)}
                    onClick={() => toggle(stylePresets, item.id, setStylePresets, 2)}
                  >
                    {item[locale]}
                  </OptionButton>
                ))}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <Label>{locale === "zh" ? "视频时长" : "Length"}</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {VIDEO_LENGTHS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggle(videoLengths, item, setVideoLengths)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm",
                        videoLengths.includes(item)
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 text-zinc-700"
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>{locale === "zh" ? "画幅比例" : "Aspect ratio"}</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ASPECT_RATIOS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggle(aspectRatios, item.id, setAspectRatios)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm",
                        aspectRatios.includes(item.id)
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 text-zinc-700"
                      )}
                    >
                      {item[locale]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>{locale === "zh" ? "要几条成片？" : "How many videos?"}</Label>
                <select
                  className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                >
                  {QUANTITIES.map((item) => (
                    <option key={item} value={item}>
                      {item} {locale === "zh" ? "条" : "videos"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>{locale === "zh" ? "预算范围" : "Budget"}</Label>
                <select
                  className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                >
                  {BUDGET_RANGES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>{locale === "zh" ? "期望交付日期（可选）" : "Deadline (optional)"}</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="h-11" />
            </div>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="space-y-5">
            <div className="rounded-xl border bg-zinc-50/60 p-5">
              <p className="text-sm font-semibold text-zinc-900">Storyboard</p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                {((storyboard?.content_json.scenes as { shot: string }[]) ?? []).map((scene, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="font-mono text-xs text-zinc-400">{index + 1}</span>
                    <span>{scene.shot}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-2">
              <Label>{locale === "zh" ? "修改旁白脚本（可选）" : "Edit voiceover (optional)"}</Label>
              <Textarea
                rows={4}
                value={scriptEdit}
                onChange={(e) => setScriptEdit(e.target.value)}
                  placeholder={
                    (Array.isArray(script?.content_json["lines"])
                      ? (script.content_json["lines"] as { text: string }[])[0]?.text
                      : undefined) ??
                    (locale === "zh" ? "输入旁白…" : "Voiceover…")
                  }
              />
            </div>
          </div>
        ) : null}

        {step === 7 ? (
          <div className="space-y-6">
            <div className="rounded-xl border bg-zinc-50/60 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <Target className="h-4 w-4" />
                {locale === "zh" ? "Campaign 摘要" : "Campaign summary"}
              </div>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                <li>
                  {productName || data.project?.product_name} · {CATEGORIES.find((c) => c.id === category)?.[locale]}
                </li>
                <li>
                  {quantity} × {videoLengths.join(", ")} · {aspectRatios.join(", ")}
                </li>
                <li>{budgetRange}</li>
                <li>
                  {data.references.length} {locale === "zh" ? "条参考视频" : "reference videos"}
                </li>
              </ul>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="publish_title">{locale === "zh" ? "Campaign 名称" : "Campaign name"}</Label>
              <Input
                id="publish_title"
                value={publishTitle}
                onChange={(e) => setPublishTitle(e.target.value)}
                className="h-11"
                required
              />
            </div>
            <label className="flex items-start gap-3 rounded-xl border bg-white p-4 text-sm leading-6">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1"
              />
              <span>
                {locale === "zh"
                  ? "我确认 Brief 已就绪，发布后将进入 Studio 匹配。"
                  : "I confirm this brief is ready. Publishing starts studio matching."}
              </span>
            </label>
          </div>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-4 sm:px-0">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 1 || isPending}
            onClick={() => goToStep(Math.max(1, step - 1))}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
            {locale === "zh" ? "上一步" : "Back"}
          </Button>

          {step < 7 ? (
            <Button
              type="button"
              disabled={
                isPending ||
                (step === 2 && !productName.trim()) ||
                (step === 4 && !brief?.executive_summary)
              }
              onClick={() => {
                if (step === 1) handleBriefContinue();
                else if (step === 2) handleStep1Continue();
                else if (step === 3) handleStep2Continue();
                else if (step === 4) handleStep3Continue();
                else if (step === 5) handleStep4Continue();
                else if (step === 6) handleStep5Continue();
              }}
              className="min-w-[140px] rounded-full px-6"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {locale === "zh" ? "继续" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isPending || !confirmed || !publishTitle.trim()}
              onClick={handlePublish}
              className="min-w-[160px] rounded-full px-6"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              {locale === "zh" ? "发布 Campaign" : "Publish"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
