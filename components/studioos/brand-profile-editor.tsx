"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition, type DragEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  ExternalLink,
  Eye,
  FileVideo,
  GripVertical,
  ImageIcon,
  Loader2,
  Package,
  Percent,
  Plus,
  Save,
  Sparkles,
  UploadCloud,
  Users,
  X,
  XCircle
} from "lucide-react";
import {
  polishBrandProfileAction,
  saveBrandProfileAction,
  uploadBrandAvatarAction
} from "@/app/brand-profile-actions";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { StoredBrandProfile } from "@/lib/brand-profile-types";
import { cn } from "@/lib/utils";

const countryOptions = ["United States", "South Korea", "United Kingdom", "Spain", "France", "Singapore", "Thailand"];
const industryOptions = [
  "Beauty / Skincare",
  "Fashion",
  "Food & Beverage",
  "Consumer Tech",
  "Health & Wellness",
  "Lifestyle",
  "CPG",
  "Luxury"
];
const seedTags = ["Beauty", "DTC", "TikTok", "Premium"];

const countryLabels: Record<Locale, Record<string, string>> = {
  en: {},
  zh: {
    "United States": "美国",
    "South Korea": "韩国",
    "United Kingdom": "英国",
    Spain: "西班牙",
    France: "法国",
    Singapore: "新加坡",
    Thailand: "泰国"
  }
};

const industryLabels: Record<Locale, Record<string, string>> = {
  en: {},
  zh: {
    "Beauty / Skincare": "美妆 / 护肤",
    Fashion: "时尚",
    "Food & Beverage": "食品饮料",
    "Consumer Tech": "消费科技",
    "Health & Wellness": "健康生活",
    Lifestyle: "生活方式",
    CPG: "消费品",
    Luxury: "奢侈品"
  }
};

const copy = {
  en: {
    title: "Brand Profile",
    subtitle: "This is the public profile creators will see before accepting your campaigns.",
    previewPublicPage: "Preview Public Page",
    saveChanges: "Save Changes",
    editCover: "Edit Cover",
    campaigns: "Campaigns",
    avgBudget: "Avg Budget",
    responseRate: "Response Rate",
    viewPublicPage: "View Public Page",
    publicBrandPage: "This is your public brand page",
    publicBrandPageNote: "Creators will see this information when deciding whether to work with you.",
    unsavedChanges: "You have unsaved changes",
    cancel: "Cancel",
    saveDraft: "Save Draft",
    publishProfile: "Publish Profile",
    profileSaved: "Profile saved.",
    profilePublished: "Brand profile published.",
    logoUpdated: "Logo updated.",
    logoFailed: "Logo upload failed.",
    describeFirst: "Describe your brand first.",
    aiGenerated: "AI generated your public profile.",
    fallbackHeadline: "Premium DTC skincare brand built for social-first growth.",
    sections: {
      basicTitle: "Basic Information",
      basicHelper: "Tell creators the basics about your company.",
      companyName: "Company Name",
      displayName: "Display Name",
      industry: "Industry",
      website: "Website",
      country: "Country / Region",
      aiTitle: "AI Brand Assistant",
      aiHelper: "Describe your brand in plain language. AI will turn it into a polished public profile.",
      aiButton: "Generate with AI",
      aiPlaceholder:
        "Describe your brand naturally.\n\nExample: We are a premium DTC skincare brand in the US. We focus on clean ingredients and TikTok performance ads.",
      aiFills: "AI fills Headline, Brand Bio, Brand Tags, and Brand Tone.",
      publicTitle: "Public Profile",
      publicHelper: "Your public introduction that creators will see.",
      headline: "Headline",
      headlinePlaceholder: "Premium DTC skincare brand built for social-first growth.",
      brandBio: "Brand Bio",
      brandBioPlaceholder:
        "Tell creators what you sell, who you serve, and what kind of content performs for your brand.",
      brandTone: "Brand Tone",
      tagsTitle: "Brand Tags",
      tagsHelper: "Add searchable signals creators and AI matching can understand.",
      addTag: "Add tag",
      assetsTitle: "Assets",
      assetsHelper: "Add assets to help creators understand your brand.",
      visibilityTitle: "Visibility",
      visibilityHelper: "Control what creators can see before accepting your campaigns."
    },
    assets: {
      logo: "Logo",
      cover: "Cover Image",
      product: "Product Image",
      reference: "Reference",
      drag: "Drag file here",
      ready: "Ready"
    },
    visibility: {
      publicProfile: "Public Profile",
      website: "Show Website",
      portfolio: "Show Portfolio",
      campaignHistory: "Show Campaign History",
      followers: "Receive Followers"
    },
    toneDefault: "Premium, clear, creator-friendly",
    toneOpenAI: "AI-polished, premium, concise",
    toneTemplate: "Premium, polished, performance-led"
  },
  zh: {
    title: "品牌主页",
    subtitle: "这是创作者在接受你的 Campaign 之前会看到的公开品牌资料。",
    previewPublicPage: "预览公开主页",
    saveChanges: "保存修改",
    editCover: "编辑封面",
    campaigns: "Campaign 数",
    avgBudget: "平均预算",
    responseRate: "响应率",
    viewPublicPage: "查看公开主页",
    publicBrandPage: "这是你的公开品牌主页",
    publicBrandPageNote: "创作者会根据这些信息判断是否接受你的合作邀请。",
    unsavedChanges: "你有未保存的修改",
    cancel: "取消",
    saveDraft: "保存草稿",
    publishProfile: "发布主页",
    profileSaved: "资料已保存。",
    profilePublished: "品牌主页已发布。",
    logoUpdated: "Logo 已更新。",
    logoFailed: "Logo 上传失败。",
    describeFirst: "请先描述你的品牌。",
    aiGenerated: "AI 已生成公开主页文案。",
    fallbackHeadline: "为社交增长打造的高端 DTC 护肤品牌。",
    sections: {
      basicTitle: "基础信息",
      basicHelper: "告诉创作者你的公司基础信息。",
      companyName: "公司名称",
      displayName: "展示名称",
      industry: "行业",
      website: "官网",
      country: "国家 / 地区",
      aiTitle: "AI 品牌助手",
      aiHelper: "用自然语言描述你的品牌，AI 会整理成专业的公开主页。",
      aiButton: "AI 生成",
      aiPlaceholder:
        "自然描述你的品牌。\n\n例如：我们是一个美国高端 DTC 护肤品牌，主打 clean ingredients 和 TikTok 效果广告。",
      aiFills: "AI 会生成一句话介绍、品牌 Bio、品牌标签和品牌语气。",
      publicTitle: "公开主页",
      publicHelper: "创作者会看到的品牌介绍。",
      headline: "一句话介绍",
      headlinePlaceholder: "为社交增长打造的高端 DTC 护肤品牌。",
      brandBio: "品牌介绍",
      brandBioPlaceholder: "告诉创作者你卖什么、服务谁，以及什么内容适合你的品牌。",
      brandTone: "品牌语气",
      tagsTitle: "品牌标签",
      tagsHelper: "添加创作者和 AI 匹配都能理解的品牌信号。",
      addTag: "添加标签",
      assetsTitle: "品牌资产",
      assetsHelper: "上传素材，帮助创作者理解你的品牌。",
      visibilityTitle: "可见性",
      visibilityHelper: "控制创作者在接受 Campaign 前能看到哪些信息。"
    },
    assets: {
      logo: "Logo",
      cover: "封面图",
      product: "产品图",
      reference: "参考素材",
      drag: "拖拽文件到这里",
      ready: "已就绪"
    },
    visibility: {
      publicProfile: "公开主页",
      website: "展示官网",
      portfolio: "展示作品集",
      campaignHistory: "展示 Campaign 历史",
      followers: "接收关注"
    },
    toneDefault: "高端、清晰、适合创作者理解",
    toneOpenAI: "AI 整理，高端、简洁",
    toneTemplate: "高端、精炼、效果导向"
  }
};

type Toast = {
  message: string;
  detail?: string;
  variant: "success" | "error";
};

type Visibility = {
  publicProfile: boolean;
  website: boolean;
  portfolio: boolean;
  campaignHistory: boolean;
  followers: boolean;
};

type AssetKey = "logo" | "cover" | "product" | "reference";

type AssetState = {
  logo: string;
  cover: string | null;
  product: string | null;
  reference: string | null;
};

type BrandProfileEditorProps = {
  locale: Locale;
  profile: StoredBrandProfile;
};

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function normalizeTags(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function defaultTags(profile: StoredBrandProfile) {
  return normalizeTags([
    ...seedTags,
    ...profile.industry
      .split(/[\/,]/)
      .map((item) => item.trim())
      .filter(Boolean)
  ]).slice(0, 8);
}

function ToastBanner({ toast }: { toast: Toast }) {
  const isSuccess = toast.variant === "success";
  return (
    <div className="fixed inset-x-0 top-5 z-50 flex justify-center px-4">
      <div
        className={cn(
          "flex max-w-md items-start gap-3 rounded-2xl border bg-white px-4 py-3 text-sm shadow-[0_14px_36px_rgba(15,23,42,0.12)]",
          isSuccess ? "border-emerald-100 text-zinc-900" : "border-red-100 text-red-700"
        )}
        role="status"
      >
        <span
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
            isSuccess ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}
        >
          {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        </span>
        <span>
          <span className="font-semibold">{toast.message}</span>
          {toast.detail ? <span className="mt-0.5 block text-zinc-500">{toast.detail}</span> : null}
        </span>
      </div>
    </div>
  );
}

function SectionCard({
  index,
  title,
  helper,
  children,
  tinted = false,
  action
}: {
  index: string;
  title: string;
  helper: string;
  children: ReactNode;
  tinted?: boolean;
  action?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-[24px] border border-[#E8E8EC] p-6 shadow-[0_1px_2px_rgba(15,23,42,0.035)] transition duration-120 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]",
        tinted ? "bg-violet-50/70" : "bg-white"
      )}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
            {index}
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-6 tracking-[-0.01em] text-zinc-950">{title}</h2>
            <p className="mt-1 text-[13px] leading-5 text-zinc-500">{helper}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-zinc-900">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-[#E8E8EC] bg-white px-4 text-sm outline-none transition focus:border-violet-200 focus:ring-4 focus:ring-violet-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  formatOption,
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  formatOption?: (value: string) => string;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-zinc-900">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full appearance-none rounded-2xl border border-[#E8E8EC] bg-white px-4 pr-10 text-sm outline-none transition focus:border-violet-200 focus:ring-4 focus:ring-violet-100"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {formatOption ? formatOption(option) : option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      </span>
    </label>
  );
}

function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  minRows = 2
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={minRows}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="min-h-[48px] w-full resize-none overflow-hidden rounded-2xl border border-[#E8E8EC] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-violet-200 focus:ring-4 focus:ring-violet-100"
    />
  );
}

function ToggleRow({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <span className={cn("flex h-6 w-11 rounded-full p-0.5 transition", checked ? "bg-violet-600" : "bg-zinc-200")}>
        <span className={cn("h-5 w-5 rounded-full bg-white shadow-sm transition", checked ? "translate-x-5" : "")} />
      </span>
    </button>
  );
}

function AssetUploadCard({
  title,
  helper,
  icon,
  preview,
  dragLabel,
  readyLabel,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  busy = false,
  onFile
}: {
  title: string;
  helper: string;
  icon: ReactNode;
  preview?: string | null;
  dragLabel: string;
  readyLabel: string;
  accept?: string;
  busy?: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "group min-h-[150px] rounded-2xl border border-[#E8E8EC] bg-white p-4 text-left transition duration-120 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(15,23,42,0.06)]",
        isDragging && "border-violet-300 bg-violet-50"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-50 text-zinc-500">{icon}</span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">{title}</p>
            <p className="text-xs text-zinc-500">{helper}</p>
          </div>
        </div>
        {busy ? <Loader2 className="h-4 w-4 animate-spin text-violet-600" /> : <UploadCloud className="h-4 w-4 text-zinc-400" />}
      </div>
      <div className="mt-4 flex h-[78px] items-center justify-center overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
        {preview ? (
          preview.startsWith("blob:") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <Image src={preview} alt="" width={180} height={90} className="h-full w-full object-cover" unoptimized />
          )
        ) : (
          <div className="flex flex-col items-center gap-1 text-xs text-zinc-400">
            <UploadCloud className="h-5 w-5" />
            {dragLabel}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {readyLabel}
      </div>
    </button>
  );
}

export function BrandProfileEditor({ locale, profile }: BrandProfileEditorProps) {
  const t = copy[locale];
  const router = useRouter();
  const [companyName, setCompanyName] = useState(profile.company_name);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [industry, setIndustry] = useState(profile.industry || industryOptions[0]);
  const [country, setCountry] = useState(countryOptions[0]);
  const [website, setWebsite] = useState(profile.website);
  const [headline, setHeadline] = useState(profile.headline);
  const [bio, setBio] = useState(profile.bio);
  const [aiDraft, setAiDraft] = useState("");
  const [brandTone, setBrandTone] = useState(t.toneDefault);
  const [tags, setTags] = useState(() => defaultTags(profile));
  const [tagDraft, setTagDraft] = useState("");
  const [draggedTag, setDraggedTag] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Visibility>({
    publicProfile: true,
    website: true,
    portfolio: true,
    campaignHistory: true,
    followers: true
  });
  const [assets, setAssets] = useState<AssetState>({
    logo: profile.logo_url,
    cover: null,
    product: null,
    reference: profile.showcase_ads.find((item) => item.thumbnail_url)?.thumbnail_url ?? null
  });
  const [toast, setToast] = useState<Toast | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPolishing, startPolish] = useTransition();
  const isPublished = Boolean(profile.profile_completed_at);
  const publicHref = withLocale(`/brands/${profile.id}`, locale);

  const initials = useMemo(() => initialsFor(displayName || companyName), [companyName, displayName]);
  const campaignCount = profile.showcase_ads.length;
  const formatCountry = (value: string) => countryLabels[locale][value] ?? value;
  const formatIndustry = (value: string) => industryLabels[locale][value] ?? value;

  useEffect(() => {
    setBrandTone(t.toneDefault);
  }, [t.toneDefault]);

  useEffect(() => {
    return () => {
      for (const url of [assets.cover, assets.product, assets.reference]) {
        if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
      }
    };
  }, [assets.cover, assets.product, assets.reference]);

  function notify(message: string, variant: Toast["variant"] = "success", detail?: string) {
    setToast({ message, variant, detail });
    window.setTimeout(() => setToast(null), variant === "success" ? 4200 : 3200);
  }

  function buildFormData(markComplete: boolean) {
    const fd = new FormData();
    fd.set("lang", locale);
    fd.set("company_name", companyName);
    fd.set("display_name", displayName);
    fd.set("industry", industry);
    fd.set("website", website);
    fd.set("headline", headline);
    fd.set("bio", bio);
    if (markComplete) fd.set("mark_complete", "1");
    return fd;
  }

  function handleSave(markComplete: boolean) {
    setFormError(null);
    startTransition(async () => {
      const result = await saveBrandProfileAction(buildFormData(markComplete));
      if (!result.ok) {
        setFormError(result.error);
        notify(result.error, "error");
        return;
      }
      notify(markComplete ? t.profilePublished : t.profileSaved, "success");
      router.refresh();
    });
  }

  function inferTagsFromAI(nextHeadline: string, nextBio: string) {
    const source = `${industry} ${nextHeadline} ${nextBio}`.toLowerCase();
    const inferred = [
      source.includes("beauty") || source.includes("skincare") ? "Beauty" : "",
      source.includes("dtc") ? "DTC" : "",
      source.includes("tiktok") ? "TikTok" : "",
      source.includes("premium") || source.includes("luxury") ? "Premium" : "",
      source.includes("ugc") ? "UGC" : "",
      source.includes("fashion") ? "Fashion" : ""
    ];
    setTags((prev) => normalizeTags([...inferred, ...prev]).slice(0, 10));
  }

  function handlePolish() {
    setFormError(null);
    if (![aiDraft, headline, bio, companyName, displayName, industry].some((item) => item.trim())) {
      setFormError(t.describeFirst);
      return;
    }

    startPolish(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("company_name", companyName);
      fd.set("display_name", displayName);
      fd.set("industry", industry);
      fd.set("website", website);
      fd.set("headline", headline);
      fd.set("bio", bio);
      fd.set("draft", aiDraft);
      const result = await polishBrandProfileAction(fd);
      if (!result.ok) {
        setFormError(result.error);
        notify(result.error, "error");
        return;
      }
      setHeadline(result.headline);
      setBio(result.bio);
      setBrandTone(result.source === "openai" ? t.toneOpenAI : t.toneTemplate);
      inferTagsFromAI(result.headline, result.bio);
      notify(t.aiGenerated, "success");
    });
  }

  async function handleLogoFile(file: File) {
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("avatar_file", file);
      const result = await uploadBrandAvatarAction(fd);
      if (!result.ok) {
        notify(result.error, "error");
        return;
      }
      setAssets((prev) => ({ ...prev, logo: result.logo_url }));
      notify(t.logoUpdated, "success");
      router.refresh();
    } catch {
      notify(t.logoFailed, "error");
    } finally {
      setLogoUploading(false);
    }
  }

  function setLocalAsset(key: Exclude<AssetKey, "logo">, file: File) {
    const nextUrl = URL.createObjectURL(file);
    setAssets((prev) => {
      const current = prev[key];
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      return { ...prev, [key]: nextUrl };
    });
  }

  function addTag(raw: string) {
    const next = normalizeTags(raw.split(","));
    if (!next.length) return;
    setTags((prev) => normalizeTags([...prev, ...next]));
    setTagDraft("");
  }

  function moveTag(targetTag: string) {
    if (!draggedTag || draggedTag === targetTag) return;
    setTags((prev) => {
      const next = prev.filter((tag) => tag !== draggedTag);
      const targetIndex = next.indexOf(targetTag);
      next.splice(targetIndex, 0, draggedTag);
      return next;
    });
    setDraggedTag(null);
  }

  return (
    <div className="flex h-full min-h-0 flex-col text-zinc-950">
      {toast ? <ToastBanner toast={toast} /> : null}

      <main className="flex min-h-0 flex-1 flex-col">
        <header className="mb-6 shrink-0 px-1 lg:px-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.03em]">{t.title}</h1>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              {t.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={publicHref}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E8E8EC] bg-white px-4 text-sm font-semibold text-zinc-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-120 hover:bg-zinc-50"
            >
              <Eye className="h-4 w-4" />
              {t.previewPublicPage}
              <ExternalLink className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition duration-120 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t.saveChanges}
            </button>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex h-10 items-center justify-center rounded-xl px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              {t.cancel}
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
          <aside className="lg:min-h-0 lg:overflow-hidden">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleLogoFile(file);
                event.target.value = "";
              }}
            />
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setLocalAsset("cover", file);
                event.target.value = "";
              }}
            />
            <div className="overflow-hidden rounded-[24px] border border-[#E8E8EC] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-120 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <div className="relative h-[132px] bg-[radial-gradient(circle_at_20%_25%,#fff_0,#f6c6d9_24%,#e9d5ff_48%,#dbeafe_100%)]">
                {assets.cover ? (
                  assets.cover.startsWith("blob:") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={assets.cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Image src={assets.cover} alt="" fill className="object-cover" unoptimized />
                  )
                ) : null}
                <button
                  type="button"
                  className="absolute right-4 top-4 rounded-2xl bg-white/90 px-3 py-2 text-xs font-semibold text-zinc-800 shadow-sm backdrop-blur transition hover:bg-white"
                  onClick={() => coverInputRef.current?.click()}
                >
                  {t.editCover}
                </button>
              </div>

              <div className="-mt-9 px-5 pb-5">
                <button
                  type="button"
                  className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-[18px] border-4 border-white bg-[#FFE4DE] text-center text-lg font-semibold leading-6 text-zinc-950 shadow-sm"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {assets.logo ? (
                    <Image src={assets.logo} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    initials || "AA"
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/40">
                    <Camera className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100" />
                  </span>
                </button>

                <div className="mt-5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-[-0.03em]">{displayName || companyName}</h2>
                    <BadgeCheck className="h-4 w-4 text-violet-600" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-violet-900/80">
                    {headline || t.fallbackHeadline}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[formatCountry(country), formatIndustry(industry), ...tags].filter(Boolean).slice(0, 7).map((tag) => (
                      <span key={tag} className="rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 divide-x divide-[#E8E8EC] rounded-2xl border border-[#E8E8EC] bg-white text-center">
                  {[
                    { value: String(campaignCount || 12), label: t.campaigns, icon: Users },
                    { value: "$2,800", label: t.avgBudget, icon: DollarSign },
                    { value: "94%", label: t.responseRate, icon: Percent }
                  ].map((item) => (
                    <div key={item.label} className="px-2 py-4">
                      <item.icon className="mx-auto mb-2 h-4 w-4 text-zinc-400" />
                      <p className="text-base font-semibold">{item.value}</p>
                      <p className="mt-1 text-[11px] text-zinc-500">{item.label}</p>
                    </div>
                  ))}
                </div>

                <Link
                  href={publicHref}
                  className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#E8E8EC] bg-white text-sm font-semibold text-zinc-900 transition duration-120 hover:bg-zinc-50"
                >
                  {t.viewPublicPage} <ArrowUpRight className="h-4 w-4" />
                </Link>

                <div className="mt-6 flex gap-3 rounded-2xl bg-violet-50 p-4">
                  <Users className="mt-0.5 h-5 w-5 text-violet-600" />
                  <div>
                    <p className="text-sm font-semibold text-violet-950">{t.publicBrandPage}</p>
                    <p className="mt-1 text-xs leading-5 text-violet-800/80">
                      {t.publicBrandPageNote}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-6 lg:min-h-0 lg:overflow-y-auto lg:pr-2">
            <SectionCard index="1" title={t.sections.basicTitle} helper={t.sections.basicHelper}>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label={t.sections.companyName} value={companyName} onChange={setCompanyName} required />
                <Field label={t.sections.displayName} value={displayName} onChange={setDisplayName} required />
                <SelectField
                  label={t.sections.industry}
                  value={industry}
                  onChange={setIndustry}
                  options={industryOptions}
                  formatOption={formatIndustry}
                  required
                />
                <Field label={t.sections.website} value={website} onChange={setWebsite} placeholder="https://" />
                <SelectField
                  label={t.sections.country}
                  value={country}
                  onChange={setCountry}
                  options={countryOptions}
                  formatOption={formatCountry}
                  required
                />
              </div>
            </SectionCard>

            <SectionCard
              index="2"
              title={t.sections.aiTitle}
              helper={t.sections.aiHelper}
              tinted
              action={
                <button
                  type="button"
                  onClick={handlePolish}
                  disabled={isPolishing}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(124,58,237,0.18)] transition duration-120 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPolishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {t.sections.aiButton}
                </button>
              }
            >
              <textarea
                value={aiDraft}
                onChange={(event) => setAiDraft(event.target.value)}
                placeholder={t.sections.aiPlaceholder}
                className="min-h-[124px] w-full resize-y rounded-2xl border border-violet-100 bg-white/85 px-4 py-4 text-sm leading-6 outline-none transition placeholder:text-zinc-400 focus:border-violet-200 focus:ring-4 focus:ring-violet-100"
              />
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-violet-700">
                <Sparkles className="h-3.5 w-3.5" />
                {t.sections.aiFills}
              </div>
            </SectionCard>

            <SectionCard index="3" title={t.sections.publicTitle} helper={t.sections.publicHelper}>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-zinc-900">{t.sections.headline} <span className="text-red-500">*</span></span>
                  <AutoGrowTextarea
                    value={headline}
                    onChange={setHeadline}
                    placeholder={t.sections.headlinePlaceholder}
                    minRows={2}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-zinc-900">{t.sections.brandBio} <span className="text-red-500">*</span></span>
                  <AutoGrowTextarea
                    value={bio}
                    onChange={setBio}
                    placeholder={t.sections.brandBioPlaceholder}
                    minRows={4}
                  />
                </label>
              </div>
              <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-sm text-violet-800">
                <span className="font-semibold">{t.sections.brandTone}:</span> {brandTone}
              </div>
            </SectionCard>

            <SectionCard index="4" title={t.sections.tagsTitle} helper={t.sections.tagsHelper}>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    draggable
                    onDragStart={() => setDraggedTag(tag)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => moveTag(tag)}
                    className="inline-flex h-9 cursor-grab items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 text-sm font-medium text-violet-700 active:cursor-grabbing"
                  >
                    <GripVertical className="h-3.5 w-3.5 text-violet-400" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags((prev) => prev.filter((item) => item !== tag))}
                      className="rounded-full p-0.5 hover:bg-violet-100"
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                <span className="inline-flex h-9 min-w-[180px] items-center gap-2 rounded-xl border border-[#E8E8EC] bg-white px-3">
                  <Plus className="h-3.5 w-3.5 text-zinc-400" />
                  <input
                    value={tagDraft}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value.includes(",")) addTag(value);
                      else setTagDraft(value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addTag(tagDraft);
                      }
                    }}
                    placeholder={t.sections.addTag}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                  />
                </span>
              </div>
            </SectionCard>

            <SectionCard index="5" title={t.sections.assetsTitle} helper={t.sections.assetsHelper}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <AssetUploadCard
                  title={t.assets.logo}
                  helper="PNG, SVG"
                  icon={<ImageIcon className="h-4 w-4" />}
                  preview={assets.logo}
                  dragLabel={t.assets.drag}
                  readyLabel={t.assets.ready}
                  busy={logoUploading}
                  onFile={(file) => void handleLogoFile(file)}
                />
                <AssetUploadCard
                  title={t.assets.cover}
                  helper="JPG, PNG"
                  icon={<ImageIcon className="h-4 w-4" />}
                  preview={assets.cover}
                  dragLabel={t.assets.drag}
                  readyLabel={t.assets.ready}
                  onFile={(file) => setLocalAsset("cover", file)}
                />
                <AssetUploadCard
                  title={t.assets.product}
                  helper="JPG, PNG"
                  icon={<Package className="h-4 w-4" />}
                  preview={assets.product}
                  dragLabel={t.assets.drag}
                  readyLabel={t.assets.ready}
                  onFile={(file) => setLocalAsset("product", file)}
                />
                <AssetUploadCard
                  title={t.assets.reference}
                  helper="MP4, MOV"
                  icon={<FileVideo className="h-4 w-4" />}
                  preview={assets.reference}
                  dragLabel={t.assets.drag}
                  readyLabel={t.assets.ready}
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime"
                  onFile={(file) => setLocalAsset("reference", file)}
                />
              </div>
            </SectionCard>

            <SectionCard index="6" title={t.sections.visibilityTitle} helper={t.sections.visibilityHelper}>
              <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                <ToggleRow
                  label={t.visibility.publicProfile}
                  checked={visibility.publicProfile}
                  onChange={(value) => setVisibility((prev) => ({ ...prev, publicProfile: value }))}
                />
                <ToggleRow
                  label={t.visibility.website}
                  checked={visibility.website}
                  onChange={(value) => setVisibility((prev) => ({ ...prev, website: value }))}
                />
                <ToggleRow
                  label={t.visibility.portfolio}
                  checked={visibility.portfolio}
                  onChange={(value) => setVisibility((prev) => ({ ...prev, portfolio: value }))}
                />
                <ToggleRow
                  label={t.visibility.campaignHistory}
                  checked={visibility.campaignHistory}
                  onChange={(value) => setVisibility((prev) => ({ ...prev, campaignHistory: value }))}
                />
                <ToggleRow
                  label={t.visibility.followers}
                  checked={visibility.followers}
                  onChange={(value) => setVisibility((prev) => ({ ...prev, followers: value }))}
                />
              </div>
            </SectionCard>

            {formError ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
            ) : null}
          </div>
        </div>
      </main>

    </div>
  );
}
