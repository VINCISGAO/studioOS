"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  Camera,
  Check,
  ChevronDown,
  Globe2,
  Loader2,
  MapPin,
  Plus,
  ShieldCheck,
  X
} from "lucide-react";
import { saveCreatorProfileClientAction, uploadCreatorAvatarAction } from "@/app/profile-actions";
import {
  mergeCreatorProfile,
  readProfileDraft,
  writeProfileDraft,
  type CreatorProfileDraft
} from "@/lib/creator-profile-storage";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { getCountryOptions, labelCountry } from "@/lib/localized-options";
import { normalizeCreatorMinBudget } from "@/lib/studioos/creator-price-preference";
import type { Creator } from "@/lib/types";
import { cn } from "@/lib/utils";

const toolOptions = [
  "Runway",
  "Midjourney",
  "After Effects",
  "Premiere Pro",
  "DaVinci Resolve",
  "Cinema 4D",
  "Blender",
  "ComfyUI",
  "Kling",
  "Veo",
  "Sora",
  "Photoshop",
  "Illustrator"
];

const deliveryOptions = [
  { value: "24 hours", title: "24 hours", description: "Rush delivery" },
  { value: "48 hours", title: "48 hours", description: "Fast delivery" },
  { value: "72 hours", title: "72 hours", description: "Standard" },
  { value: "1 week", title: "1 week", description: "Flexible" },
  { value: "Custom", title: "Custom", description: "Let's discuss" }
];

const budgetPresets = [200, 500, 1000, 2500, 5000];

const copy = {
  en: {
    title: "Public Profile",
    subtitle: "This is what brands see before inviting you.",
    previewPublicPage: "Preview Public Page",
    saveChanges: "Save changes",
    editCover: "Edit Cover",
    uploadAvatar: "Upload avatar",
    responseRate: "Response Rate",
    avgDelivery: "Avg Delivery",
    projects: "Projects",
    expertise: "Expertise",
    productionTools: "Production Tools",
    startingFrom: "Starting From",
    minimumProjectBudget: "Minimum project budget",
    viewAsBrand: "View as Brand",
    verifiedCreator: "Verified Creator",
    verifiedCreatorNote: "Your profile is public and visible to brands on StudioOS.",
    allChangesSaved: "All changes saved",
    unsavedChanges: "Unsaved changes",
    cancel: "Cancel",
    profileUpdated: "Profile updated.",
    avatarFailed: "Could not update photo. Try again.",
    discardChanges: "Discard changes?",
    sections: {
      basicTitle: "Basic Information",
      basicHelper: "Tell brands who you are and what you do.",
      displayName: "Display Name",
      displayNameHelper: "Your public studio or creator name.",
      portfolioLink: "Portfolio Link",
      portfolioHelper: "Your website, showreel, or portfolio page.",
      headline: "Headline",
      headlineHelper: "A crisp one-line positioning statement.",
      bio: "Bio",
      bioHelper: "Describe your style, process, audience, and best-fit projects.",
      country: "Country / Region",
      countryHelper: "Used by brands when planning time zones and logistics.",
      expertiseTitle: "Expertise",
      expertiseHelper: "Select the types of projects you're best at.",
      addChip: "Add chip",
      toolsTitle: "Production Tools",
      toolsHelper: "Select the tools you use in your workflow.",
      deliveryTitle: "Delivery Preference",
      deliveryHelper: "How fast can you usually deliver?",
      budgetTitle: "Budget Preference",
      budgetHelper: "Set your minimum project budget.",
      budgetHint: "Projects below this budget will not be recommended to you.",
      visibilityTitle: "Profile Visibility",
      visibilityHelper: "Control what brands can see on your public profile."
    },
    delivery: {
      "24 hours": "24 hours",
      "48 hours": "48 hours",
      "72 hours": "72 hours",
      "1 week": "1 week",
      Custom: "Custom",
      "Rush delivery": "Rush delivery",
      "Fast delivery": "Fast delivery",
      Standard: "Standard",
      Flexible: "Flexible",
      "Let's discuss": "Let's discuss"
    },
    visibility: {
      publicProfile: "Public profile enabled",
      tools: "Show tools",
      invitations: "Available for invitations",
      portfolio: "Show portfolio link",
      startingBudget: "Show starting budget"
    },
    fallback: {
      name: "Nova Motion Studio",
      headline: "Cinematic AI product films for beauty and consumer tech."
    }
  },
  zh: {
    title: "公开主页",
    subtitle: "品牌方在邀请你之前会看到这些资料。",
    previewPublicPage: "预览公开主页",
    saveChanges: "保存修改",
    editCover: "编辑封面",
    uploadAvatar: "上传头像",
    responseRate: "响应率",
    avgDelivery: "平均交付",
    projects: "项目数",
    expertise: "擅长领域",
    productionTools: "制作工具",
    startingFrom: "起步价格",
    minimumProjectBudget: "最低项目预算",
    viewAsBrand: "以品牌方视角查看",
    verifiedCreator: "已认证创作者",
    verifiedCreatorNote: "你的主页已公开，品牌方可在 StudioOS 上看到。",
    allChangesSaved: "所有修改已保存",
    unsavedChanges: "你有未保存的修改",
    cancel: "取消",
    profileUpdated: "资料已更新。",
    avatarFailed: "头像更新失败，请重试。",
    discardChanges: "放弃未保存修改？",
    sections: {
      basicTitle: "基础信息",
      basicHelper: "告诉品牌方你是谁，以及你擅长什么。",
      displayName: "展示名称",
      displayNameHelper: "你的公开 Studio 或创作者名称。",
      portfolioLink: "作品集链接",
      portfolioHelper: "官网、Showreel 或作品集页面。",
      headline: "一句话介绍",
      headlineHelper: "清晰表达你的定位。",
      bio: "个人简介",
      bioHelper: "描述你的风格、流程、受众和适合的项目。",
      country: "国家 / 地区",
      countryHelper: "用于品牌方规划时区和协作安排。",
      expertiseTitle: "擅长领域",
      expertiseHelper: "选择你最擅长的项目类型。",
      addChip: "添加标签",
      toolsTitle: "制作工具",
      toolsHelper: "选择你工作流中常用的工具。",
      deliveryTitle: "交付偏好",
      deliveryHelper: "你通常可以多快交付？",
      budgetTitle: "预算偏好",
      budgetHelper: "设置你的最低项目预算。",
      budgetHint: "低于该预算的项目不会优先推荐给你。",
      visibilityTitle: "主页可见性",
      visibilityHelper: "控制品牌方能在你的公开主页看到哪些信息。"
    },
    delivery: {
      "24 hours": "24 小时",
      "48 hours": "48 小时",
      "72 hours": "72 小时",
      "1 week": "1 周",
      Custom: "自定义",
      "Rush delivery": "加急交付",
      "Fast delivery": "快速交付",
      Standard: "标准",
      Flexible: "灵活",
      "Let's discuss": "可沟通"
    },
    visibility: {
      publicProfile: "公开主页已启用",
      tools: "展示制作工具",
      invitations: "接受合作邀请",
      portfolio: "展示作品集链接",
      startingBudget: "展示起步预算"
    },
    fallback: {
      name: "Nova Motion Studio",
      headline: "为美妆与消费科技品牌制作电影感 AI 产品短片。"
    }
  }
};

type VisibilityState = {
  publicProfile: boolean;
  invitations: boolean;
  startingBudget: boolean;
  tools: boolean;
  portfolio: boolean;
};

type ToastState = {
  message: string;
  variant: "success" | "error";
};

type CreatorPublicProfileEditorProps = {
  locale: Locale;
  baseCreator: Creator;
};

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function normalizeSpecialties(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function snapshotProfile(input: {
  displayName: string;
  headline: string;
  bio: string;
  country: string;
  portfolioUrl: string;
  specialties: string[];
  tools: string[];
  deliverySpeed: string;
  minBudget: number;
  visibility: VisibilityState;
  coverPreview: string | null;
}) {
  return JSON.stringify(input);
}

function FieldLabel({
  label,
  helper
}: {
  label: string;
  helper: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-zinc-900">{label}</label>
      <p className="text-[13px] leading-5 text-zinc-500">{helper}</p>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  helper,
  children
}: {
  eyebrow: string;
  title: string;
  helper: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="mb-6 flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-700">
          {eyebrow}
        </div>
        <div>
          <h2 className="text-lg font-semibold leading-6 text-zinc-950">{title}</h2>
          <p className="mt-1 text-[13px] leading-5 text-zinc-500">{helper}</p>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
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
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl px-1 py-2 text-left"
      aria-pressed={checked}
    >
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <span
        className={cn(
          "flex h-6 w-11 items-center rounded-full p-0.5 transition",
          checked ? "bg-violet-600" : "bg-zinc-200"
        )}
      >
        <span
          className={cn(
            "h-5 w-5 rounded-full bg-white shadow-sm transition",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </span>
    </button>
  );
}

function Chip({
  label,
  selected = true,
  removable = false,
  onClick,
  onRemove
}: {
  label: string;
  selected?: boolean;
  removable?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition",
        selected
          ? "border-violet-200 bg-violet-50 text-violet-700"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {selected && !removable ? <Check className="h-3.5 w-3.5" /> : null}
      {label}
      {removable ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove?.();
          }}
          className="rounded-full p-0.5 text-violet-500 hover:bg-violet-100"
          aria-label={`Remove ${label}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </span>
  );
}

export function CreatorPublicProfileEditor({
  locale,
  baseCreator
}: CreatorPublicProfileEditorProps) {
  const t = copy[locale];
  const [creator, setCreator] = useState(baseCreator);
  const [displayName, setDisplayName] = useState(baseCreator.name);
  const [headline, setHeadline] = useState(baseCreator.headline ?? "");
  const [bio, setBio] = useState(baseCreator.bio ?? "");
  const [country, setCountry] = useState(baseCreator.country);
  const [portfolioUrl, setPortfolioUrl] = useState(baseCreator.portfolio_url);
  const [specialties, setSpecialties] = useState(() => normalizeSpecialties(baseCreator.specialties));
  const [chipDraft, setChipDraft] = useState("");
  const [tools, setTools] = useState(() => normalizeSpecialties(baseCreator.tools));
  const [deliverySpeed, setDeliverySpeed] = useState(baseCreator.delivery_speed || "48 hours");
  const [minBudget, setMinBudget] = useState(normalizeCreatorMinBudget(baseCreator.min_project_budget_usd) || 2500);
  const [visibility, setVisibility] = useState<VisibilityState>({
    publicProfile: true,
    invitations: true,
    startingBudget: true,
    tools: true,
    portfolio: true
  });
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const initialSnapshot = useRef("");
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const countryOptions = useMemo(() => getCountryOptions(locale, country), [locale, country]);
  const initials = useMemo(() => initialsFor(displayName), [displayName]);
  const selectedDelivery = deliveryOptions.find((item) => item.value === deliverySpeed) ?? deliveryOptions[1];

  const formSnapshot = useMemo(
    () =>
      snapshotProfile({
        displayName,
        headline,
        bio,
        country,
        portfolioUrl,
        specialties,
        tools,
        deliverySpeed,
        minBudget,
        visibility,
        coverPreview
      }),
    [
      bio,
      country,
      coverPreview,
      deliverySpeed,
      displayName,
      headline,
      minBudget,
      portfolioUrl,
      specialties,
      tools,
      visibility
    ]
  );

  useEffect(() => {
    const draft = readProfileDraft(baseCreator.id);
    const merged = mergeCreatorProfile(baseCreator, draft);
    const nextVisibility = {
      publicProfile: true,
      invitations: true,
      startingBudget: true,
      tools: true,
      portfolio: true
    };
    setCreator(merged);
    setDisplayName(merged.name);
    setHeadline(merged.headline ?? "");
    setBio(merged.bio ?? "");
    setCountry(merged.country);
    setPortfolioUrl(merged.portfolio_url);
    setSpecialties(normalizeSpecialties(merged.specialties));
    setTools(normalizeSpecialties(merged.tools));
    setDeliverySpeed(merged.delivery_speed || "48 hours");
    setMinBudget(normalizeCreatorMinBudget(merged.min_project_budget_usd) || 2500);
    setVisibility(nextVisibility);
    initialSnapshot.current = snapshotProfile({
      displayName: merged.name,
      headline: merged.headline ?? "",
      bio: merged.bio ?? "",
      country: merged.country,
      portfolioUrl: merged.portfolio_url,
      specialties: normalizeSpecialties(merged.specialties),
      tools: normalizeSpecialties(merged.tools),
      deliverySpeed: merged.delivery_speed || "48 hours",
      minBudget: normalizeCreatorMinBudget(merged.min_project_budget_usd) || 2500,
      visibility: nextVisibility,
      coverPreview: null
    });
    setDirty(false);
    setHydrated(true);
  }, [baseCreator]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (!initialSnapshot.current) {
      initialSnapshot.current = formSnapshot;
      return;
    }
    setDirty(formSnapshot !== initialSnapshot.current);
  }, [formSnapshot, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  function addSpecialty(raw: string) {
    const items = raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (!items.length) return;
    setSpecialties((prev) => normalizeSpecialties([...prev, ...items]));
    setChipDraft("");
  }

  function buildDraft(): CreatorProfileDraft {
    return {
      name: displayName,
      headline,
      bio,
      country,
      portfolio_url: portfolioUrl,
      specialties,
      tools,
      delivery_speed: deliverySpeed,
      min_project_budget_usd: minBudget,
      avatar_url: creator.avatar_url
    };
  }

  function handleSave() {
    const draft = buildDraft();
    startTransition(async () => {
      const result = await saveCreatorProfileClientAction({
        lang: locale,
        name: draft.name,
        headline: draft.headline ?? "",
        bio: draft.bio ?? "",
        country: draft.country,
        portfolio_url: draft.portfolio_url,
        specialties: draft.specialties ?? [],
        tools: draft.tools ?? [],
        delivery_speed: draft.delivery_speed ?? "",
        min_project_budget_usd: normalizeCreatorMinBudget(draft.min_project_budget_usd),
        expertise_domains: creator.expertise_domains ?? []
      });

      if (!result.ok) {
        setToast({ message: result.error, variant: "error" });
        return;
      }

      writeProfileDraft(baseCreator.id, draft);
      setCreator(mergeCreatorProfile(baseCreator, draft));
      initialSnapshot.current = formSnapshot;
      setDirty(false);
      setToast({ message: t.profileUpdated, variant: "success" });
    });
  }

  function handleCancel() {
    if (dirty && !window.confirm(t.discardChanges)) return;
    const draft = readProfileDraft(baseCreator.id);
    const merged = mergeCreatorProfile(baseCreator, draft);
    const nextVisibility = {
      publicProfile: true,
      invitations: true,
      startingBudget: true,
      tools: true,
      portfolio: true
    };
    setCreator(merged);
    setDisplayName(merged.name);
    setHeadline(merged.headline ?? "");
    setBio(merged.bio ?? "");
    setCountry(merged.country);
    setPortfolioUrl(merged.portfolio_url);
    setSpecialties(normalizeSpecialties(merged.specialties));
    setTools(normalizeSpecialties(merged.tools));
    setDeliverySpeed(merged.delivery_speed || "48 hours");
    setMinBudget(normalizeCreatorMinBudget(merged.min_project_budget_usd) || 2500);
    setCoverPreview(null);
    setVisibility(nextVisibility);
    initialSnapshot.current = snapshotProfile({
      displayName: merged.name,
      headline: merged.headline ?? "",
      bio: merged.bio ?? "",
      country: merged.country,
      portfolioUrl: merged.portfolio_url,
      specialties: normalizeSpecialties(merged.specialties),
      tools: normalizeSpecialties(merged.tools),
      deliverySpeed: merged.delivery_speed || "48 hours",
      minBudget: normalizeCreatorMinBudget(merged.min_project_budget_usd) || 2500,
      visibility: nextVisibility,
      coverPreview: null
    });
    setDirty(false);
  }

  async function handleAvatarUpload(file: File) {
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("avatar_file", file);
      const result = await uploadCreatorAvatarAction(fd);
      if (!result.ok) {
        setToast({ message: result.error, variant: "error" });
        return;
      }
      const nextDraft = { ...buildDraft(), avatar_url: result.avatar_url };
      writeProfileDraft(baseCreator.id, nextDraft);
      setCreator((prev) => ({ ...prev, avatar_url: result.avatar_url }));
      setToast({ message: t.profileUpdated, variant: "success" });
    } catch {
      setToast({ message: t.avatarFailed, variant: "error" });
    } finally {
      setAvatarUploading(false);
    }
  }

  function handleCoverFile(file: File) {
    const nextUrl = URL.createObjectURL(file);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(nextUrl);
    setDirty(true);
  }

  return (
    <div className="flex h-full min-h-0 flex-col text-zinc-950">
      {toast ? (
        <div className="fixed inset-x-0 top-5 z-50 flex justify-center px-4">
          <div
            className={cn(
              "flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-sm font-medium shadow-[0_12px_34px_rgba(15,23,42,0.10)]",
              toast.variant === "success" ? "border-emerald-100 text-zinc-900" : "border-red-100 text-red-700"
            )}
            role="status"
          >
            {toast.variant === "success" ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Check className="h-3.5 w-3.5" />
              </span>
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-600">
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            {toast.message}
          </div>
        </div>
      ) : null}

      <main className="flex min-h-0 flex-1 flex-col">
        <header className="mb-6 shrink-0 px-1 lg:px-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.03em] text-zinc-950">
              {t.title}
            </h1>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              {t.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={withLocale(`/creators/${creator.id}`, locale)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-zinc-50"
            >
              {t.previewPublicPage} <ArrowUpRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t.saveChanges}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex h-10 items-center justify-center rounded-xl px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              {t.cancel}
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
          <aside className="lg:min-h-0 lg:overflow-hidden">
            <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="relative h-[132px] overflow-hidden rounded-[20px] bg-[radial-gradient(circle_at_20%_15%,#7c3aed_0,#271347_30%,#0b1020_68%,#111827_100%)]">
                {coverPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_40%),linear-gradient(315deg,rgba(124,58,237,0.45),transparent_45%)]" />
                )}
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm backdrop-blur hover:bg-white"
                >
                  {t.editCover}
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleCoverFile(file);
                    event.target.value = "";
                  }}
                />
              </div>

              <div className="-mt-9 px-3">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="group relative h-16 w-16 overflow-hidden rounded-[18px] border-4 border-white bg-zinc-950 text-lg font-semibold text-white shadow-sm"
                  aria-label={t.uploadAvatar}
                >
                  {creator.avatar_url ? (
                    <Image src={creator.avatar_url} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">{initials || "NM"}</span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/45">
                    {avatarUploading ? (
                      <Loader2 className="h-5 w-5 animate-spin opacity-0 group-hover:opacity-100" />
                    ) : (
                      <Camera className="h-5 w-5 opacity-0 group-hover:opacity-100" />
                    )}
                  </span>
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleAvatarUpload(file);
                    event.target.value = "";
                  }}
                />
              </div>

              <div className="px-3 pb-4 pt-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-950">{displayName || t.fallback.name}</h2>
                  <BadgeCheck className="h-4 w-4 text-violet-600" />
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {headline || t.fallback.headline}
                </p>
                <p className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
                  <MapPin className="h-4 w-4" />
                  {labelCountry(country, locale) || "South Korea"}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-zinc-100 bg-zinc-50 p-2 text-center">
                  {[
                    ["96%", t.responseRate],
                    ["72h", t.avgDelivery],
                    ["24", t.projects]
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-xl bg-white px-2 py-3">
                      <p className="text-base font-semibold text-zinc-950">{value}</p>
                      <p className="mt-1 text-[11px] leading-4 text-zinc-500">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">{t.expertise}</p>
                  <div className="flex flex-wrap gap-2">
                    {specialties.slice(0, 5).map((item) => (
                      <span key={item} className="rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">{t.productionTools}</p>
                  <div className="flex flex-wrap gap-2">
                    {tools.slice(0, 4).map((item) => (
                      <span key={item} className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4">
                  <p className="text-[13px] font-medium text-zinc-500">{t.startingFrom}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
                    ${minBudget.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">{t.minimumProjectBudget}</p>
                </div>

                <Link
                  href={withLocale(`/creators/${creator.id}`, locale)}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                >
                  {t.viewAsBrand} <ArrowUpRight className="h-4 w-4" />
                </Link>

                <div className="mt-4 flex items-start gap-3 rounded-2xl bg-zinc-50 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-zinc-700" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{t.verifiedCreator}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      {t.verifiedCreatorNote}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <form className="space-y-6 lg:min-h-0 lg:overflow-y-auto lg:pr-2" onSubmit={(event) => event.preventDefault()}>
            <SectionCard eyebrow="1" title={t.sections.basicTitle} helper={t.sections.basicHelper}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel label={t.sections.displayName} helper={t.sections.displayNameHelper} />
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    maxLength={100}
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-violet-200 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel label={t.sections.portfolioLink} helper={t.sections.portfolioHelper} />
                  <div className="relative">
                    <Globe2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      value={portfolioUrl}
                      onChange={(event) => setPortfolioUrl(event.target.value)}
                      placeholder="https://"
                      className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-violet-200 focus:ring-4 focus:ring-violet-100"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel label={t.sections.headline} helper={t.sections.headlineHelper} />
                <input
                  value={headline}
                  onChange={(event) => setHeadline(event.target.value)}
                  maxLength={120}
                  className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-violet-200 focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel label={t.sections.bio} helper={t.sections.bioHelper} />
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  maxLength={1000}
                  className="min-h-[140px] w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-zinc-400 focus:border-violet-200 focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel label={t.sections.country} helper={t.sections.countryHelper} />
                <div className="relative">
                  <select
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    className="h-12 w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 pr-10 text-sm outline-none transition focus:border-violet-200 focus:ring-4 focus:ring-violet-100"
                  >
                    {countryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                </div>
              </div>
            </SectionCard>

            <SectionCard eyebrow="2" title={t.sections.expertiseTitle} helper={t.sections.expertiseHelper}>
              <div className="flex flex-wrap gap-2">
                {specialties.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    removable
                    onRemove={() => setSpecialties((prev) => prev.filter((value) => value !== item))}
                  />
                ))}
              </div>
              <div className="flex min-h-12 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 focus-within:border-violet-200 focus-within:ring-4 focus-within:ring-violet-100">
                <Plus className="h-4 w-4 text-zinc-400" />
                <input
                  value={chipDraft}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value.includes(",")) {
                      addSpecialty(value);
                    } else {
                      setChipDraft(value);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addSpecialty(chipDraft);
                    }
                  }}
                  placeholder={t.sections.addChip}
                  className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                />
              </div>
            </SectionCard>

            <SectionCard eyebrow="3" title={t.sections.toolsTitle} helper={t.sections.toolsHelper}>
              <div className="flex flex-wrap gap-2">
                {toolOptions.map((item) => {
                  const selected = tools.includes(item);
                  return (
                    <Chip
                      key={item}
                      label={item}
                      selected={selected}
                      onClick={() =>
                        setTools((prev) =>
                          selected ? prev.filter((value) => value !== item) : normalizeSpecialties([...prev, item])
                        )
                      }
                    />
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard eyebrow="4" title={t.sections.deliveryTitle} helper={t.sections.deliveryHelper}>
              <div className="grid gap-3 sm:grid-cols-5">
                {deliveryOptions.map((option) => {
                  const selected = selectedDelivery.value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDeliverySpeed(option.value)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition",
                        selected
                          ? "border-violet-300 bg-violet-50 text-violet-800 ring-4 ring-violet-100"
                          : "border-zinc-200 bg-white hover:bg-zinc-50"
                      )}
                    >
                      <p className="text-sm font-semibold">{t.delivery[option.title as keyof typeof t.delivery]}</p>
                      <p className="mt-1 text-xs leading-4 text-zinc-500">
                        {t.delivery[option.description as keyof typeof t.delivery]}
                      </p>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard eyebrow="5" title={t.sections.budgetTitle} helper={t.sections.budgetHelper}>
              <div className="flex flex-col gap-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{t.minimumProjectBudget}</p>
                    <p className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-violet-700">
                      ${minBudget.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {budgetPresets.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMinBudget(value)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                          minBudget === value
                            ? "border-violet-300 bg-violet-50 text-violet-700"
                            : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                        )}
                      >
                        ${value.toLocaleString()}+
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setMinBudget(minBudget || 2500)}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      {t.delivery.Custom}
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min={200}
                  max={5000}
                  step={500}
                  value={minBudget}
                  onChange={(event) => setMinBudget(Number(event.target.value))}
                  className="accent-violet-600"
                />
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>$200</span>
                  <span>$500</span>
                  <span>$1,000</span>
                  <span>$2,500</span>
                  <span>$5,000</span>
                  <span>{t.delivery.Custom}</span>
                </div>
                <p className="text-[13px] leading-5 text-zinc-500">
                  {t.sections.budgetHint}
                </p>
              </div>
            </SectionCard>

            <SectionCard eyebrow="6" title={t.sections.visibilityTitle} helper={t.sections.visibilityHelper}>
              <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                <ToggleRow
                  label={t.visibility.publicProfile}
                  checked={visibility.publicProfile}
                  onChange={(value) => setVisibility((prev) => ({ ...prev, publicProfile: value }))}
                />
                <ToggleRow
                  label={t.visibility.tools}
                  checked={visibility.tools}
                  onChange={(value) => setVisibility((prev) => ({ ...prev, tools: value }))}
                />
                <ToggleRow
                  label={t.visibility.invitations}
                  checked={visibility.invitations}
                  onChange={(value) => setVisibility((prev) => ({ ...prev, invitations: value }))}
                />
                <ToggleRow
                  label={t.visibility.portfolio}
                  checked={visibility.portfolio}
                  onChange={(value) => setVisibility((prev) => ({ ...prev, portfolio: value }))}
                />
                <ToggleRow
                  label={t.visibility.startingBudget}
                  checked={visibility.startingBudget}
                  onChange={(value) => setVisibility((prev) => ({ ...prev, startingBudget: value }))}
                />
              </div>
            </SectionCard>
          </form>
        </div>
      </main>

    </div>
  );
}
