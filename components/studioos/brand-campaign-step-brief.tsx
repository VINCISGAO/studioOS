"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { refineBrandBriefAction } from "@/app/brand-campaign-actions";
import { addReferenceAction, removeReferenceAction } from "@/app/project-wizard-actions";
import { BrandCampaignBriefStep1Panel } from "@/components/studioos/brand-campaign-brief-step1-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StoredProjectReference } from "@/lib/campaign-types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { labelPlatform } from "@/lib/localized-options";
import {
  objectiveOptions,
  PLATFORM_OPTIONS,
  type ReorganizedBrandBrief
} from "@/lib/studioos/brand-brief-ai";
import {
  BRAND_BUDGET_PRESETS,
  BRAND_DELIVERY_TIMELINES,
  BRAND_BUDGET_MIN_USD,
  BRAND_VIDEO_ASPECT_RATIOS,
  customBudgetInputFromStored,
  defaultBrandBudget,
  isPresetBudget,
  normalizeCustomBudgetInput,
  type BrandDeliveryTimelineId,
  type BrandVideoAspectRatio
} from "@/lib/studioos/brand-campaign-options";
import type { CommercialObjective } from "@/lib/project-types";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  ImageIcon,
  Loader2,
  Ratio,
  Sparkles,
  Upload,
  Wallet
} from "lucide-react";

const copy = {
  en: {
    backHome: "Back to Brand home",
    stepLabel: "Step 1 of 4",
    steps: ["Brief", "Prepare", "Confirm", "Studios"],
    title: "Tell us about your campaign",
    subtitle: "Start with a casual description — AI turns it into a studio-ready brief in seconds.",
    aiHeroTitle: "Describe your ad idea with AI",
    aiHeroHint: "Not sure how to write it? Share the key points — AI will turn them into a professional brief.",
    aiPlaceholder:
      "e.g. We're launching a travel pouch on TikTok — target urban women 25–35, clean minimal vibe, 30s vertical…",
    detailsTitle: "Fine-tune details",
    detailsHint: "Optional — adjust after AI polish, or fill in manually.",
    productSection: "Product",
    productBasicsHint: "Link or photo helps studios understand what you sell.",
    questionnaire: "Questionnaire",
    productName: "Product name",
    productLink: "Product link (optional)",
    uploadProduct: "Upload product photo",
    uploaded: "Photo uploaded — click to replace",
    uploading: "Uploading…",
    uploadFailed: "Upload failed",
    clickToUpload: "Click to choose an image",
    clickToUploadDrag: "Click to choose an image or drag here",
    formats: "JPG, PNG, WebP · max 10MB",
    q1: "What are you promoting?",
    q1Hint: "Describe the product in your own words.",
    q2: "Main goal",
    q3: "Target audience",
    q3Hint: "Age, interests, location — whatever comes to mind.",
    q4: "Platforms",
    q5: "Anything else?",
    q5Hint: "Deadline, tone, things to avoid…",
    aiPanelTitle: "AI brief polish",
    aiPanelHint: "Write casually below, then polish into a studio-ready brief.",
    rawSummary: "Your words",
    rawSummaryHint: "Not sure how to describe it? Just cover the key points — AI will organize it for you.",
    aiPolish: "Polish with AI",
    aiPolishing: "Polishing…",
    budgetLabel: "Budget (USD)",
    budgetHint: "All amounts in USD · minimum $200 · helps us match the right studio.",
    budgetCustomPlaceholder: "Custom amount, e.g. 800 or 800-1500",
    budgetMinError: "Minimum budget is $200 USD.",
    budgetCustomLabel: "Custom",
    timelineLabel: "Timeline",
    timelineHint: "When do you need the final video?",
    aiReady: "Polished result",
    aiTemplate: "Smart template",
    aiOpenai: "AI polished",
    editHint: "Review and edit, then apply to your campaign.",
    campaignGoal: "Campaign goal",
    audience: "Target audience",
    apply: "Apply to campaign",
    applied: "Applied",
    appliedSuccess: "Brief applied — you can continue to the next step.",
    appliedBanner: "Applied brief",
    continue: "Continue",
    saveDraft: "Save draft",
    savingDraft: "Saving…",
    needInput: "Upload a product photo or add a link (optional), and describe your campaign.",
    needPolish: "Write your idea first, then tap AI polish.",
    needApply: "Apply the AI result before continuing, or fill in the questionnaire manually.",
    refsTitle: "Style references (optional)",
    refsHint: "Reference videos help us quickly understand your preferences.",
    refsEmpty: "Paste a TikTok, YouTube, or Instagram link",
    refPlaceholder: "Paste a TikTok, YouTube, or Instagram link",
    paste: "Paste:",
    addRef: "Add",
    removeRef: "Remove",
    or: "or",
    uploadSample: "No link yet? Drag or upload a reference video",
    uploadSampleHint: "mp4, mov · max 50MB",
    draftSaved: "Draft saved automatically · just now",
    continuePending: "Continuing…",
    aspectRatioTitle: "Video aspect ratio",
    aspectRatioHint: "Required — pick the primary format for your deliverable.",
    aspectRatioError: "Select a video aspect ratio."
  },
  zh: {
    backHome: "返回 Brand 首页",
    stepLabel: "第 1 步 / 共 4 步",
    steps: ["需求", "准备", "确认", "Studio"],
    title: "告诉我们你想做什么广告",
    subtitle: "先用口语描述想法 — AI 几秒内整理成 Studio 能用的专业 Brief。",
    aiHeroTitle: "用 AI 描述你的广告想法",
    aiHeroHint: "不会写没关系，把重点说完即可，AI 帮你整理成专业需求。",
    aiPlaceholder:
      "例如：新上的旅行收纳包，想做 TikTok，面向 25-35 岁都市女生，高级极简风，30 秒竖屏…",
    detailsTitle: "补充细节",
    detailsHint: "可选 — AI 整理后可微调，或跳过 AI 手动填写。",
    productSection: "产品",
    productBasicsHint: "链接或产品图帮助 Studio 理解你在卖什么。",
    questionnaire: "简单问卷",
    productName: "产品名称",
    productLink: "产品链接（选填）",
    uploadProduct: "上传产品图",
    uploaded: "已上传，点击更换",
    uploading: "上传中…",
    uploadFailed: "上传失败",
    clickToUpload: "点击选择图片",
    clickToUploadDrag: "点击选择图片或拖拽到此处",
    formats: "JPG、PNG、WebP · 最大 10MB",
    q1: "你要推广什么？",
    q1Hint: "用你自己的话介绍产品。",
    q2: "广告目标",
    q3: "目标受众",
    q3Hint: "年龄、兴趣、地区 — 想到什么写什么。",
    q4: "投放平台",
    q5: "补充说明",
    q5Hint: "时间、语气、不要出现的内容…",
    aiPanelTitle: "AI 整理",
    aiPanelHint: "先用口语描述，再一键整理成 Studio 能用的 Brief。",
    rawSummary: "口语描述",
    rawSummaryHint: "不会描述没关系，把重点说完即可，AI 为您整理。",
    aiPolish: "AI 帮我整理",
    aiPolishing: "整理中…",
    budgetLabel: "预算（美金）",
    budgetHint: "均以美金计价 · 最低 $200 · 帮助我们匹配合适档位的 Studio。",
    budgetCustomPlaceholder: "自定义金额，如 800 或 800-1500",
    budgetMinError: "最低预算为 $200 美金。",
    budgetCustomLabel: "自定义",
    timelineLabel: "预计工期",
    timelineHint: "您希望什么时候拿到成片？",
    aiReady: "整理结果",
    aiTemplate: "智能模板",
    aiOpenai: "AI 已整理",
    editHint: "确认内容后，点击「应用到 Campaign」。",
    campaignGoal: "Campaign 目标",
    audience: "目标受众",
    apply: "应用到 Campaign",
    applied: "已应用",
    appliedSuccess: "Brief 已应用，可以继续下一步。",
    appliedBanner: "已应用的 Brief",
    continue: "继续",
    saveDraft: "保存草稿",
    savingDraft: "保存中…",
    needInput: "请上传产品图或填写产品链接（选填），并描述广告需求。",
    needPolish: "先写下你的想法，再点 AI 整理。",
    needApply: "请先点击「应用到 Campaign」，或手动填写问卷。",
    refsTitle: "风格参考（选填）",
    refsHint: "有参考视频，帮助我们快速锁定您的喜好。",
    refsEmpty: "粘贴 TikTok、YouTube 或 Instagram 链接",
    refPlaceholder: "粘贴链接到 TikTok、YouTube 或 Instagram",
    paste: "粘贴：",
    addRef: "添加",
    removeRef: "删除",
    or: "或",
    uploadSample: "还没有链接？拖拽或上传参考视频",
    uploadSampleHint: "支持 mp4、mov，最大 50MB",
    draftSaved: "草稿已自动保存 / 刚刚",
    continuePending: "继续中…",
    aspectRatioTitle: "视频比例",
    aspectRatioHint: "必选 — 选择成片的主要规格。",
    aspectRatioError: "请选择视频比例。"
  }
};

export type BriefFormState = {
  productName: string;
  productUrl: string;
  productDescription: string;
  objective: CommercialObjective;
  audienceDescription: string;
  platforms: string[];
  extraNotes: string;
  rawSummary: string;
  refined: ReorganizedBrandBrief | null;
  budgetRange: string;
  deliveryTimeline: BrandDeliveryTimelineId;
  aspectRatio: BrandVideoAspectRatio;
};

function OptionChip({
  active,
  disabled,
  onClick,
  children
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
        active
          ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      {children}
    </button>
  );
}

function PlanningField({
  icon: Icon,
  title,
  hint,
  children
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/40 p-4">
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-500 shadow-sm ring-1 ring-zinc-200/80">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-900">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{hint}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function QuestionSection({
  index,
  title,
  hint,
  children
}: {
  index: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-[11px] font-semibold text-white">
          {index}
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium text-zinc-900">{title}</p>
          {hint ? <p className="text-xs leading-5 text-zinc-500">{hint}</p> : null}
        </div>
      </div>
      <div className="pl-9">{children}</div>
    </div>
  );
}

function productPreviewSrc(url: string) {
  if (url.startsWith("blob:") || url.startsWith("http")) return url;
  return url;
}

export function BrandCampaignStepBrief({
  locale,
  projectId,
  initial,
  initialProductImageUrl,
  initialReferences = [],
  stepMode = "all",
  hideTopBar = false,
  isPending,
  error,
  onProductUploaded,
  onReferencesUpdated,
  onContinue,
  onSaveDraft,
  isSavingDraft = false
}: {
  locale: Locale;
  projectId: string;
  initial: BriefFormState;
  initialProductImageUrl?: string | null;
  initialReferences?: StoredProjectReference[];
  stepMode?: "brief" | "product" | "references" | "all";
  hideTopBar?: boolean;
  isPending: boolean;
  error: string | null;
  onProductUploaded?: () => void;
  onReferencesUpdated?: () => void;
  onContinue: (state: BriefFormState) => void;
  onSaveDraft?: (state: BriefFormState) => void;
  isSavingDraft?: boolean;
}) {
  const t = copy[locale];
  const objectives = objectiveOptions(locale);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initial);
  const [productReady, setProductReady] = useState(Boolean(initialProductImageUrl));
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialProductImageUrl ?? null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const [refinedApplied, setRefinedApplied] = useState(
    Boolean(
      initial.refined &&
        initial.productDescription.trim() === initial.refined.campaign_goal.trim()
    )
  );
  const [applyNotice, setApplyNotice] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isPolishing, startPolish] = useTransition();
  const [refUrl, setRefUrl] = useState("");
  const [references, setReferences] = useState(initialReferences);
  const [isRefPending, startRefAction] = useTransition();
  const [budgetCustom, setBudgetCustom] = useState(() => customBudgetInputFromStored(initial.budgetRange));
  const [budgetCustomError, setBudgetCustomError] = useState<string | null>(null);
  const [aspectRatioError, setAspectRatioError] = useState<string | null>(null);

  useEffect(() => {
    setReferences(initialReferences);
  }, [initialReferences]);

  function togglePlatform(platform: string) {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((item) => item !== platform)
        : [...prev.platforms, platform]
    }));
    setRefinedApplied(false);
    setApplyNotice(null);
  }

  function patch<K extends keyof BriefFormState>(key: K, value: BriefFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key !== "refined") {
      setRefinedApplied(false);
      setApplyNotice(null);
    }
  }

  function updateRefined(patchValue: Partial<ReorganizedBrandBrief>) {
    setForm((prev) =>
      prev.refined ? { ...prev, refined: { ...prev.refined, ...patchValue } } : prev
    );
    setRefinedApplied(false);
    setApplyNotice(null);
  }

  function selectPresetBudget(value: string) {
    setBudgetCustom("");
    setBudgetCustomError(null);
    patch("budgetRange", value);
  }

  function handleBudgetCustomChange(raw: string) {
    setBudgetCustom(raw);
    setBudgetCustomError(null);
    if (!raw.trim()) {
      patch("budgetRange", defaultBrandBudget());
      return;
    }
    const result = normalizeCustomBudgetInput(raw, locale);
    if (result.ok) {
      patch("budgetRange", result.value);
    }
  }

  function handleBudgetCustomBlur() {
    if (!budgetCustom.trim()) {
      setBudgetCustomError(null);
      return;
    }
    const result = normalizeCustomBudgetInput(budgetCustom, locale);
    if (!result.ok) {
      setBudgetCustomError(result.message);
      return;
    }
    patch("budgetRange", result.value);
    setBudgetCustomError(null);
  }

  function buildFormData() {
    const fd = new FormData();
    fd.set("lang", locale);
    fd.set("project_id", projectId);
    fd.set("product_name", form.productName);
    fd.set("product_url", form.productUrl);
    fd.set("product_description", form.productDescription);
    fd.set("objective", form.objective);
    fd.set("audience_description", form.audienceDescription);
    fd.set("platforms", form.platforms.join(","));
    fd.set("extra_notes", form.extraNotes);
    fd.set("raw_summary", form.rawSummary);
    fd.set("budget_range", form.budgetRange);
    fd.set("delivery_timeline", form.deliveryTimeline);
    fd.set("aspect_ratio", form.aspectRatio);
    return fd;
  }

  function handlePolish() {
    const hasText =
      form.rawSummary.trim() ||
      form.productDescription.trim() ||
      form.audienceDescription.trim() ||
      form.extraNotes.trim();

    if (!hasText) {
      setLocalError(t.needPolish);
      return;
    }

    setLocalError(null);
    setApplyNotice(null);
    startPolish(async () => {
      const result = await refineBrandBriefAction(buildFormData());
      if (!result.ok) {
        setLocalError(result.error);
        return;
      }
      setForm((prev) => ({ ...prev, refined: result.brief }));
      setRefinedApplied(false);
    });
  }

  function handleApplyRefined() {
    if (!form.refined) return;

    setForm((prev) => ({
      ...prev,
      productName: prev.productName.trim() || prev.refined!.product_name,
      productDescription: prev.refined!.campaign_goal,
      audienceDescription: prev.refined!.target_audience,
      extraNotes: prev.extraNotes.trim() || prev.refined!.notes
    }));
    setRefinedApplied(true);
    setApplyNotice(t.appliedSuccess);
    setLocalError(null);
  }

  function handleUploadFile(file: File) {
    setUploadError(null);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    startUpload(async () => {
      const fd = new FormData();
      fd.set("image_file", file);

      try {
        const res = await fetch(
          `/api/brand/projects/${encodeURIComponent(projectId)}/product-image?lang=${locale}`,
          {
            method: "POST",
            body: fd
          }
        );

        const raw = await res.text();
        type UploadProductImageResponse = {
          ok: boolean;
          error?: string;
          preview_url?: string;
          original?: { file_url: string };
        };
        let result: UploadProductImageResponse;
        try {
          result = JSON.parse(raw) as UploadProductImageResponse;
        } catch {
          result = {
            ok: false,
            error:
              locale === "zh"
                ? `上传接口异常（HTTP ${res.status}）`
                : `Upload endpoint error (HTTP ${res.status})`
          };
        }

        if (!res.ok || !result.ok) {
          setUploadError(result.error ?? `${t.uploadFailed} (HTTP ${res.status})`);
          setProductReady(false);
          return;
        }

        setProductReady(true);
        setPreviewUrl(productPreviewSrc(result.preview_url ?? result.original?.file_url ?? localPreview));
        onProductUploaded?.();
      } catch {
        setUploadError(
          locale === "zh"
            ? "网络错误，请检查连接后重试"
            : "Network error — check your connection and try again"
        );
        setProductReady(false);
      }
    });
  }

  function handleAddRef() {
    if (!refUrl.trim()) return;

    startRefAction(async () => {
      setLocalError(null);
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("project_id", projectId);
      fd.set("source_url", refUrl.trim());
      const result = await addReferenceAction(fd);
      if (!result.ok) {
        setLocalError(result.error);
        return;
      }
      setReferences((prev) => [
        ...prev,
        {
          id: `temp_${Date.now()}`,
          project_id: projectId,
          type: "link",
          source_url: refUrl.trim(),
          note: "",
          platform: "",
          sort_order: prev.length,
          created_at: new Date().toISOString()
        }
      ]);
      setRefUrl("");
      onReferencesUpdated?.();
    });
  }

  function handleRemoveRef(refId: string) {
    startRefAction(async () => {
      const fd = new FormData();
      fd.set("project_id", projectId);
      fd.set("ref_id", refId);
      await removeReferenceAction(fd);
      setReferences((prev) => prev.filter((r) => r.id !== refId));
      onReferencesUpdated?.();
    });
  }

  function resolveBriefForContinue(state: BriefFormState): BriefFormState {
    if (state.refined) {
      return {
        ...state,
        productName: state.productName.trim() || state.refined.product_name,
        productDescription: state.refined.campaign_goal,
        audienceDescription: state.audienceDescription.trim() || state.refined.target_audience,
        extraNotes: state.extraNotes.trim() || state.refined.notes
      };
    }
    return state;
  }

  function handleContinue() {
    const payload = resolveBriefForContinue(form);

    if (stepMode === "brief") {
      const hasBrief = payload.productDescription.trim() || payload.rawSummary.trim();
      if (!hasBrief) {
        setLocalError(t.needPolish);
        return;
      }
      if (!payload.aspectRatio) {
        setAspectRatioError(t.aspectRatioError);
        setLocalError(t.aspectRatioError);
        return;
      }
      if (budgetCustom.trim()) {
        const budgetResult = normalizeCustomBudgetInput(budgetCustom, locale);
        if (!budgetResult.ok) {
          setBudgetCustomError(budgetResult.message);
          setLocalError(budgetResult.message);
          return;
        }
      }
      setLocalError(null);
      onContinue(payload);
      return;
    }

    if (stepMode === "product") {
      const hasVisual = Boolean(form.productUrl.trim()) || productReady;
      if (!hasVisual) {
        setLocalError(t.needInput);
        return;
      }
      setLocalError(null);
      onContinue(form);
      return;
    }

    if (stepMode === "references") {
      setLocalError(null);
      onContinue(form);
      return;
    }

    const payloadAll = resolveBriefForContinue(form);
    const hasVisual = Boolean(form.productUrl.trim()) || productReady;
    const hasBrief = payloadAll.productDescription.trim() || payloadAll.rawSummary.trim();

    if (!hasVisual || !hasBrief) {
      setLocalError(t.needInput);
      return;
    }

    if (!payloadAll.aspectRatio) {
      setAspectRatioError(t.aspectRatioError);
      setLocalError(t.aspectRatioError);
      return;
    }

    if (budgetCustom.trim()) {
      const budgetResult = normalizeCustomBudgetInput(budgetCustom, locale);
      if (!budgetResult.ok) {
        setBudgetCustomError(budgetResult.message);
        setLocalError(budgetResult.message);
        return;
      }
    }

    setLocalError(null);
    onContinue(payloadAll);
  }

  function handleSaveDraft() {
    if (!onSaveDraft) return;
    const payload = resolveBriefForContinue(form);
    setLocalError(null);
    onSaveDraft(payload);
  }

  const displayError = localError || error;
  const timelineOptions = BRAND_DELIVERY_TIMELINES[locale];
  const aspectRatioOptions = BRAND_VIDEO_ASPECT_RATIOS[locale];
  const budgetIsCustom = Boolean(budgetCustom.trim()) || !isPresetBudget(form.budgetRange);
  const continueDisabled =
    isPending ||
    isSavingDraft ||
    isUploading ||
    isRefPending ||
    (stepMode === "product" && isUploading) ||
    (stepMode === "references" && isRefPending);

  const showBrief = stepMode === "brief" || stepMode === "all";
  const showProduct = stepMode === "product" || stepMode === "all";
  const showReferences = stepMode === "references" || stepMode === "all";

  if (hideTopBar && stepMode === "all") {
    const { steps, ...briefPanelCopy } = t;
    void steps;
    return (
      <BrandCampaignBriefStep1Panel
        locale={locale}
        copy={briefPanelCopy}
        form={form}
        patch={patch}
        budgetCustom={budgetCustom}
        budgetCustomError={budgetCustomError}
        budgetIsCustom={budgetIsCustom}
        aspectRatioError={aspectRatioError}
        displayError={displayError}
        refinedApplied={refinedApplied}
        applyNotice={applyNotice}
        isPolishing={isPolishing}
        isPending={isPending}
        isSavingDraft={isSavingDraft}
        isUploading={isUploading}
        isRefPending={isRefPending}
        continueDisabled={continueDisabled}
        productReady={productReady}
        previewUrl={previewUrl}
        uploadError={uploadError}
        references={references}
        refUrl={refUrl}
        setRefUrl={setRefUrl}
        fileInputRef={fileInputRef}
        onPolish={handlePolish}
        onApplyRefined={handleApplyRefined}
        onUploadClick={() => fileInputRef.current?.click()}
        onUploadFile={handleUploadFile}
        onAddRef={handleAddRef}
        onRemoveRef={handleRemoveRef}
        onSelectPresetBudget={selectPresetBudget}
        onBudgetCustomChange={handleBudgetCustomChange}
        onBudgetCustomBlur={handleBudgetCustomBlur}
        onAspectRatioSelect={(value) => {
          patch("aspectRatio", value);
          setAspectRatioError(null);
          setLocalError(null);
        }}
        onContinue={handleContinue}
        onSaveDraft={onSaveDraft ? handleSaveDraft : undefined}
        updateRefined={updateRefined}
      />
    );
  }

  return (
    <section className="space-y-8">
      {/* Top bar */}
      {!hideTopBar && stepMode === "all" ? (
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-9 gap-2 text-zinc-500 hover:text-zinc-900">
          <Link href={withLocale("/brand", locale)}>
            <ArrowLeft className="h-4 w-4" />
            {t.backHome}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {t.steps.map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  index === 0 ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400"
                )}
              >
                {index + 1}
              </span>
              <span className={cn("hidden text-sm sm:inline", index === 0 ? "font-medium text-zinc-900" : "text-zinc-400")}>
                {label}
              </span>
              {index < t.steps.length - 1 ? <span className="hidden h-px w-6 bg-zinc-200 sm:block" /> : null}
            </div>
          ))}
        </div>
      </div>
      ) : null}

      {/* Page header */}
      {!hideTopBar && stepMode === "all" ? (
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">{t.stepLabel}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">{t.title}</h1>
        <p className="max-w-2xl text-base leading-relaxed text-zinc-500">{t.subtitle}</p>
      </div>
      ) : null}

      {/* ── AI Hero (primary) ── */}
      {showBrief ? (
      <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_32px_rgba(99,102,241,0.06)]">
        <div className="border-b border-violet-100/80 bg-gradient-to-r from-violet-50/80 via-white to-indigo-50/60 px-6 py-5 sm:px-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{t.aiHeroTitle}</h2>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">{t.aiHeroHint}</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className={cn("grid gap-6", form.refined ? "lg:grid-cols-2" : "")}>
            {/* Input */}
            <div className="space-y-4">
              <Textarea
                id="raw_summary"
                value={form.rawSummary}
                onChange={(e) => patch("rawSummary", e.target.value)}
                rows={form.refined ? 6 : 5}
                className="min-h-[140px] resize-none border-zinc-200 bg-zinc-50/50 text-base leading-relaxed placeholder:text-zinc-400 focus-visible:bg-white"
                placeholder={t.aiPlaceholder}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <PlanningField icon={Wallet} title={t.budgetLabel} hint={t.budgetHint}>
                  {BRAND_BUDGET_PRESETS.map((option) => (
                    <OptionChip
                      key={option.value}
                      active={!budgetIsCustom && form.budgetRange === option.value}
                      disabled={isPending || isPolishing}
                      onClick={() => selectPresetBudget(option.value)}
                    >
                      {option.label}
                    </OptionChip>
                  ))}
                  <div className="w-full basis-full pt-1">
                    <div
                      className={cn(
                        "flex h-10 items-center gap-2 rounded-lg border bg-white px-3 transition",
                        budgetIsCustom
                          ? "border-zinc-900 shadow-sm ring-1 ring-zinc-900/10"
                          : "border-zinc-200 hover:border-zinc-300"
                      )}
                    >
                      <span className="shrink-0 text-sm font-semibold text-zinc-500">$</span>
                      <Input
                        value={budgetCustom}
                        onChange={(e) => handleBudgetCustomChange(e.target.value)}
                        onBlur={handleBudgetCustomBlur}
                        placeholder={t.budgetCustomPlaceholder}
                        disabled={isPending || isPolishing}
                        className="h-8 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                      />
                    </div>
                    {budgetCustomError ? (
                      <p className="mt-1.5 text-xs text-red-600">{budgetCustomError}</p>
                    ) : (
                      <p className="mt-1.5 text-xs text-zinc-400">
                        {locale === "zh"
                          ? `最低 $${BRAND_BUDGET_MIN_USD} 美金 · 支持单个金额或区间`
                          : `Minimum $${BRAND_BUDGET_MIN_USD} USD · single amount or range`}
                      </p>
                    )}
                  </div>
                </PlanningField>

                <PlanningField icon={Clock} title={t.timelineLabel} hint={t.timelineHint}>
                  {timelineOptions.map((option) => (
                    <OptionChip
                      key={option.id}
                      active={form.deliveryTimeline === option.id}
                      disabled={isPending || isPolishing}
                      onClick={() => patch("deliveryTimeline", option.id)}
                    >
                      {option.label}
                    </OptionChip>
                  ))}
                </PlanningField>
              </div>

              <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-500 shadow-sm ring-1 ring-zinc-200/80">
                    <Ratio className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {t.aspectRatioTitle}
                      <span className="ml-1.5 text-red-500">*</span>
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{t.aspectRatioHint}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {aspectRatioOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      disabled={isPending || isPolishing}
                      onClick={() => {
                        patch("aspectRatio", option.id);
                        setAspectRatioError(null);
                        setLocalError(null);
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-left transition",
                        form.aspectRatio === option.id
                          ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                      )}
                    >
                      <span className="block text-sm font-semibold">{option.label}</span>
                    </button>
                  ))}
                </div>
                {aspectRatioError ? <p className="text-xs text-red-600">{aspectRatioError}</p> : null}
              </div>

              <Button
                type="button"
                size="lg"
                className="h-12 w-full gap-2 rounded-xl bg-violet-600 text-base font-medium shadow-sm hover:bg-violet-700 sm:w-auto sm:px-8"
                disabled={isPolishing || isPending}
                onClick={handlePolish}
              >
                {isPolishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isPolishing ? t.aiPolishing : t.aiPolish}
              </Button>
            </div>

            {/* AI Result */}
            {form.refined ? (
              <div className="space-y-4 rounded-2xl border border-violet-100 bg-violet-50/30 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-900">{t.aiReady}</p>
                  <Badge variant="secondary" className="font-normal">
                    {form.refined.source === "openai" ? t.aiOpenai : t.aiTemplate}
                  </Badge>
                  {refinedApplied ? (
                    <Badge className="gap-1 bg-emerald-600 font-normal hover:bg-emerald-600">
                      <Check className="h-3 w-3" />
                      {t.applied}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-xs text-zinc-500">{t.editHint}</p>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="refined_goal" className="text-xs text-zinc-500">
                      {t.campaignGoal}
                    </Label>
                    <Textarea
                      id="refined_goal"
                      value={form.refined.campaign_goal}
                      onChange={(e) => updateRefined({ campaign_goal: e.target.value })}
                      rows={3}
                      className="resize-none border-zinc-200 bg-white text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="refined_audience" className="text-xs text-zinc-500">
                      {t.audience}
                    </Label>
                    <Input
                      id="refined_audience"
                      value={form.refined.target_audience}
                      onChange={(e) => updateRefined({ target_audience: e.target.value })}
                      className="border-zinc-200 bg-white"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  size="lg"
                  className="h-11 w-full gap-2 rounded-xl"
                  variant={refinedApplied ? "outline" : "default"}
                  disabled={refinedApplied || isPending}
                  onClick={handleApplyRefined}
                >
                  {refinedApplied ? (
                    <>
                      <Check className="h-4 w-4" /> {t.applied}
                    </>
                  ) : (
                    t.apply
                  )}
                </Button>
              </div>
            ) : null}
          </div>

          {refinedApplied ? (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-900">{t.appliedBanner}</p>
                <p className="mt-1 text-sm leading-relaxed text-emerald-800/80">{form.productDescription}</p>
              </div>
            </div>
          ) : applyNotice ? (
            <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {applyNotice}
            </p>
          ) : null}
        </div>
      </div>
      ) : null}

      {/* ── Product + References ── */}
      {showProduct || showReferences ? (
      <div className={cn("grid gap-6", showProduct && showReferences ? "lg:grid-cols-2" : "")}>
        {/* Product */}
        {showProduct ? (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-900">{t.productSection}</h2>
            <p className="mt-1 text-sm text-zinc-500">{t.productBasicsHint}</p>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="product_name">{t.productName}</Label>
                <Input
                  id="product_name"
                  value={form.productName}
                  onChange={(e) => patch("productName", e.target.value)}
                  placeholder={locale === "zh" ? "Arc 旅行收纳包" : "Arc Travel Case"}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product_url">{t.productLink}</Label>
                <Input
                  id="product_url"
                  value={form.productUrl}
                  onChange={(e) => patch("productUrl", e.target.value)}
                  placeholder="https://"
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t.uploadProduct}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadFile(file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={isUploading || isPending}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative flex h-28 w-full cursor-pointer items-center gap-4 overflow-hidden rounded-xl border border-dashed px-4 transition",
                  productReady
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 hover:bg-zinc-50",
                  (isUploading || isPending) && "cursor-wait opacity-80"
                )}
              >
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-zinc-400" />
                    )}
                  </div>
                )}
                <div className="min-w-0 text-left">
                  <p className="text-sm font-medium text-zinc-800">
                    {isUploading ? t.uploading : productReady ? t.uploaded : t.clickToUpload}
                  </p>
                  {!productReady && !isUploading ? (
                    <p className="mt-0.5 text-xs text-zinc-400">{t.formats}</p>
                  ) : null}
                </div>
                {!isUploading ? <Upload className="ml-auto h-4 w-4 shrink-0 text-zinc-300" /> : null}
              </button>
              {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
            </div>
          </div>
        </div>
        ) : null}

        {/* References + aspect (brief shows aspect in hero; product/references split below) */}
        {showReferences || (showBrief && !showProduct) ? (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {(showBrief && !showProduct) ? (
            <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-500 shadow-sm ring-1 ring-zinc-200/80">
                  <Ratio className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {t.aspectRatioTitle}
                    <span className="ml-1.5 text-red-500">*</span>
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{t.aspectRatioHint}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {aspectRatioOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    disabled={isPending || isPolishing}
                    onClick={() => {
                      patch("aspectRatio", option.id);
                      setAspectRatioError(null);
                      setLocalError(null);
                    }}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left transition",
                      form.aspectRatio === option.id
                        ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                    )}
                  >
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span
                      className={cn(
                        "mt-0.5 block text-[11px] leading-snug",
                        form.aspectRatio === option.id ? "text-zinc-300" : "text-zinc-500"
                      )}
                    >
                      {option.hint}
                    </span>
                  </button>
                ))}
              </div>
              {aspectRatioError ? <p className="text-xs text-red-600">{aspectRatioError}</p> : null}
            </div>
            ) : null}

            {showReferences ? (
            <>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">{t.refsTitle}</h2>
              <p className="mt-1 text-sm text-zinc-500">{t.refsHint}</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {["TikTok", "YouTube", "Instagram"].map((platform) => (
                <span key={platform} className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                  {platform}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={refUrl}
                onChange={(e) => setRefUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRef();
                  }
                }}
                placeholder="https://"
                className="h-10 flex-1"
                disabled={isRefPending || isPending}
              />
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0 px-4"
                onClick={handleAddRef}
                disabled={isRefPending || isPending || !refUrl.trim()}
              >
                {isRefPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.addRef}
              </Button>
            </div>
            {references.length ? (
              <ul className="space-y-1.5">
                {references.map((ref) => (
                  <li
                    key={ref.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                  >
                    <span className="truncate text-zinc-600">{ref.source_url}</span>
                    <button
                      type="button"
                      className="shrink-0 text-xs text-zinc-400 transition hover:text-red-600"
                      onClick={() => handleRemoveRef(ref.id)}
                      disabled={isRefPending || isPending}
                    >
                      {t.removeRef}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-zinc-200 py-6 text-center text-xs text-zinc-400">
                {t.refsEmpty}
              </p>
            )}
            </>
            ) : null}
          </div>
        </div>
        ) : null}
      </div>
      ) : null}

      {/* ── Details (hidden in compact 3-step wizard) ── */}
      {showBrief && !(stepMode === "all" && hideTopBar) ? (
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-5">
          <p className="text-base font-semibold text-zinc-900">{t.detailsTitle}</p>
          <p className="mt-1 text-sm text-zinc-500">{t.detailsHint}</p>
        </div>

        <div className="space-y-6 px-6 py-6">
            <QuestionSection index={1} title={t.q1} hint={t.q1Hint}>
              <Textarea
                value={form.productDescription}
                onChange={(e) => patch("productDescription", e.target.value)}
                rows={3}
                className="resize-y"
                placeholder={
                  locale === "zh"
                    ? "比如：便携咖啡机，主打办公室白领，一分钟出杯…"
                    : "e.g. Portable espresso maker for office workers…"
                }
              />
            </QuestionSection>

            <QuestionSection index={2} title={t.q2}>
              <div className="flex flex-wrap gap-2">
                {objectives.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => patch("objective", item.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition",
                      form.objective === item.id
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </QuestionSection>

            <QuestionSection index={3} title={t.q3} hint={t.q3Hint}>
              <Textarea
                value={form.audienceDescription}
                onChange={(e) => patch("audienceDescription", e.target.value)}
                rows={2}
                className="resize-y"
                placeholder={locale === "zh" ? "比如：25-35 岁一线城市女生" : "e.g. Women 25–35 in tier-1 cities"}
              />
            </QuestionSection>

            <QuestionSection index={4} title={t.q4}>
              <div className="flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition",
                      form.platforms.includes(platform)
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                    )}
                  >
                    {labelPlatform(platform, locale)}
                  </button>
                ))}
              </div>
            </QuestionSection>

            <QuestionSection index={5} title={t.q5} hint={t.q5Hint}>
              <Textarea
                value={form.extraNotes}
                onChange={(e) => patch("extraNotes", e.target.value)}
                rows={2}
                className="resize-y"
                placeholder={locale === "zh" ? "比如：高级极简，不要夸张特效" : "e.g. Premium minimal, no flashy effects"}
              />
            </QuestionSection>
        </div>
      </div>
      ) : null}

      {/* Footer CTA */}
      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white/95 px-5 py-4 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-[20px] flex-1">
          {displayError ? (
            <p className="text-sm text-red-600">{displayError}</p>
          ) : refinedApplied ? (
            <p className="text-sm text-emerald-700">{t.appliedSuccess}</p>
          ) : null}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {onSaveDraft ? (
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-xl sm:min-w-[140px]"
              disabled={continueDisabled}
              onClick={handleSaveDraft}
            >
              {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSavingDraft ? t.savingDraft : t.saveDraft}
            </Button>
          ) : null}
          <Button
            type="button"
            size="lg"
            variant="brand"
            className="h-12 w-full rounded-xl sm:w-auto sm:min-w-[180px]"
            disabled={continueDisabled}
            onClick={handleContinue}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.continue}
            {!isPending ? <ArrowRight className="h-4 w-4" /> : null}
          </Button>
        </div>
      </div>
    </section>
  );
}
