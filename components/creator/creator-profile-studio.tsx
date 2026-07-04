"use client";

import { deleteWorkAction, hideWorkAction, publishWorkAction, syncWorksAction } from "@/app/creator-actions";
import { uploadCreatorAvatarAction } from "@/app/profile-actions";
import { saveCreatorProfileClientAction } from "@/app/profile-actions";
import { WorkCoverImage } from "@/components/creator/work-cover-image";
import { WorkVideoPlayer } from "@/components/creator/work-video-player";
import {
  CreatorAboutPanel,
  CreatorProfileTabs,
  StudioProfileWorksGrid,
  type WorkSortKey,
  type WorkViewMode
} from "@/components/creator/creator-profile-ui";
import { StudioWorksFilterBar } from "@/components/studioos/studio-works-filter-bar";
import { StudioWorksProfileHero } from "@/components/studioos/studio-works-profile-hero";
import type { WorkEngagementSnapshot } from "@/lib/work-engagement-utils";
import { CreatorMinBudgetField } from "@/components/creator/creator-min-budget-field";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard, Check, ExternalLink, Loader2, Pencil, Plus, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  defaultTurnaroundValue,
  getCountryOptions,
  getPlatformOptions,
  getTurnaroundOptions,
  getVideoFormatOptions,
  getWorkCategoryOptions,
  labelCountry,
  labelPlatform,
  labelTurnaround,
  labelVideoFormat,
  labelWorkCategory,
  publishPlaceholder,
  type LocalizedOption
} from "@/lib/localized-options";
import {
  createWorkId,
  mergeCreatorProfile,
  mergeCreatorWorks,
  readProfileDraft,
  readWorksDraft,
  type CreatorProfileDraft,
  writeProfileDraft,
  writeWorksDraft
} from "@/lib/creator-profile-storage";
import { canEmbedVideo, resolveWorkThumbnail, sanitizeVideoUrl } from "@/lib/media-url";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  creatorMinBudgetAboutLabel,
  normalizeCreatorMinBudget
} from "@/lib/studioos/creator-price-preference";
import { compressImageForUpload } from "@/lib/studioos/image-upload-client";
import { OrderRatingPolicyCard } from "@/components/studioos/order-rating-policy-card";
import {
  buildCreatorWorksHeroStats,
  buildCreatorWorksProfileTags,
  buildWorksFilterOptions,
  filterCreatorWorks,
  worksFilterAllValue
} from "@/lib/studioos/creator-works-ui";
import type { Creator, CreatorWork } from "@/lib/types";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    myProfile: "My profile",
    publicPage: "View public page",
    editProfile: "Edit profile",
    editAvatar: "Change photo",
    publishVideo: "Publish video",
    posts: "Posts",
    about: "About",
    rating: "Rating",
    turnaround: "Turnaround",
    minBudget: "Min. project budget",
    country: "Country",
    specialties: "Specialties",
    tools: "Tools",
    portfolio: "Portfolio",
    saveProfile: "Save profile",
    cancel: "Cancel",
    publish: "Publish",
    editProfileTitle: "Edit your public profile",
    editProfileBody: "Brands see this on your creator page. Keep it clear and portfolio-first.",
    publishTitle: "Publish a portfolio video",
    publishBody: "Paste a video link. YouTube links auto-generate a cover. Optional: add a separate image URL.",
    fields: {
      name: "Display name",
      headline: "Headline",
      bio: "Bio",
      country: "Country",
      portfolio: "Portfolio URL",
      specialties: "Specialties (comma separated)",
      tools: "Tools (comma separated)",
      delivery: "Delivery speed",
      minBudget: "Minimum project budget",
      minBudgetHint: "Pick a preset or choose custom to enter your own minimum. Briefs below it won't be recommended.",
      title: "Video title",
      category: "Category",
      platform: "Platform",
      format: "Format",
      thumbnail: "Cover image URL (optional)",
      video: "Video link",
      description: "Description",
      tags: "Tags (comma separated)"
    },
    empty: "No videos yet. Publish your first portfolio piece.",
    preview: "Preview",
    openOriginal: "Open original link",
    saved: "Profile saved",
    published: "Video published",
    publishedTitle: "Published successfully",
    publishedBody: (title: string) => `"${title}" is now on your public portfolio.`,
    avatarUpdated: "Profile photo updated",
    avatarFailed: "Could not update photo. Try again.",
    publishFailed: "Publish failed. Sign in as a creator and try again.",
    hideWork: "Hide",
    showWork: "Show",
    deleteWork: "Delete",
    hiddenBadge: "Hidden",
    hiddenHint: "Hidden works are not shown on your public page.",
    deleteConfirm: "Delete this work permanently? This cannot be undone.",
    hiddenToast: "Work hidden from public page",
    shownToast: "Work visible on public page",
    deletedToast: "Work deleted",
    actionFailed: "Action failed. Try again.",
    aiTags: "AI matching tags",
    onboarded: "Profile setup complete — AI matching is now active."
  },
  zh: {
    myProfile: "我的主页",
    publicPage: "查看公开主页",
    editProfile: "编辑资料",
    editAvatar: "更换头像",
    publishVideo: "发布视频",
    posts: "作品",
    about: "简介",
    rating: "评分",
    turnaround: "交付周期",
    minBudget: "商单预算",
    country: "国家 / 地区",
    specialties: "擅长方向",
    tools: "制作工具",
    portfolio: "作品集链接",
    saveProfile: "保存资料",
    cancel: "取消",
    publish: "发布",
    editProfileTitle: "编辑公开主页",
    editProfileBody: "品牌方会在你的创作者主页看到这些信息，建议突出风格和案例。",
    publishTitle: "发布作品视频",
    publishBody: "把视频链接加入公开作品墙。YouTube 链接会自动生成封面；也可单独填写封面图链接。",
    fields: {
      name: "展示名称",
      headline: "一句话介绍",
      bio: "个人简介",
      country: "国家 / 地区",
      portfolio: "作品集链接",
      specialties: "擅长方向（逗号分隔）",
      tools: "制作工具（逗号分隔）",
      delivery: "交付周期",
      minBudget: "商单价格意愿",
      minBudgetHint: "可选预设档位，或选「自定义金额」手动填写最低预算；低于此金额的项目不会推荐给你。",
      title: "视频标题",
      category: "品类",
      platform: "平台",
      format: "画幅",
      thumbnail: "封面图链接（可选）",
      video: "视频链接",
      description: "作品说明",
      tags: "标签（逗号分隔）"
    },
    empty: "还没有作品，先发布第一条作品集视频。",
    preview: "预览",
    openOriginal: "在原平台打开",
    saved: "资料已保存",
    published: "视频已发布",
    publishedTitle: "发布成功",
    publishedBody: (title: string) => `「${title}」已加入你的公开作品墙。`,
    avatarUpdated: "头像已更新",
    avatarFailed: "头像更新失败，请重试",
    publishFailed: "发布失败，请确认已登录创作者账号后重试。",
    hideWork: "隐藏",
    showWork: "显示",
    deleteWork: "删除",
    hiddenBadge: "已隐藏",
    hiddenHint: "已隐藏的作品不会在公开主页展示。",
    deleteConfirm: "确定永久删除这条作品吗？此操作无法撤销。",
    hiddenToast: "作品已从公开主页隐藏",
    shownToast: "作品已在公开主页显示",
    deletedToast: "作品已删除",
    actionFailed: "操作失败，请重试。",
    aiTags: "AI 匹配标签",
    onboarded: "主页入驻完成 — AI 匹配已开启。"
  }
};

type ProfileToast = {
  message: string;
  detail?: string;
  variant: "success" | "error" | "default";
};

function ProfileToastBanner({ toast }: { toast: ProfileToast }) {
  const isSuccess = toast.variant === "success";
  const isError = toast.variant === "error";

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] flex justify-center px-4 pt-5"
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "pointer-events-auto flex w-full max-w-[380px] items-start gap-3 rounded-xl border px-4 py-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl",
          "animate-in fade-in slide-in-from-top-3 duration-300",
          isSuccess && "border-zinc-200/90 bg-white/95",
          isError && "border-zinc-200/90 bg-white/95",
          !isSuccess && !isError && "border-zinc-800 bg-zinc-950 text-white"
        )}
      >
        {isSuccess ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900">
            <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
        ) : isError ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-100">
            <XCircle className="h-4 w-4 text-red-600" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1 pt-0.5">
          <p
            className={cn(
              "text-[13px] font-semibold leading-snug tracking-[-0.01em]",
              (isSuccess || isError) && "text-zinc-950",
              !isSuccess && !isError && "text-white"
            )}
          >
            {toast.message}
          </p>
          {toast.detail ? (
            <p
              className={cn(
                "mt-0.5 text-[13px] leading-5",
                (isSuccess || isError) && "text-zinc-500",
                !isSuccess && !isError && "text-zinc-400"
              )}
            >
              {toast.detail}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type CreatorProfileStudioProps = {
  locale: Locale;
  baseCreator: Creator;
  baseWorks: CreatorWork[];
  engagement: Record<string, WorkEngagementSnapshot>;
  isLoggedIn: boolean;
  openPublishOnLoad?: boolean;
  showAiTags?: boolean;
  showRatingNote?: boolean;
  onboarded?: boolean;
};

export function CreatorProfileStudio({
  locale,
  baseCreator,
  baseWorks,
  engagement,
  isLoggedIn,
  openPublishOnLoad = false,
  showAiTags = false,
  showRatingNote = false,
  onboarded = false
}: CreatorProfileStudioProps) {
  const t = copy[locale];
  const router = useRouter();
  const [creator, setCreator] = useState(baseCreator);
  const [works, setWorks] = useState(baseWorks);
  const [tab, setTab] = useState<"posts" | "about">("posts");
  const [sortKey, setSortKey] = useState<WorkSortKey>("newest");
  const [viewMode, setViewMode] = useState<WorkViewMode>("grid");
  const [worksPage, setWorksPage] = useState(1);
  const [worksQuery, setWorksQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState(worksFilterAllValue);
  const [categoryFilter, setCategoryFilter] = useState(worksFilterAllValue);
  const [tagFilter, setTagFilter] = useState(worksFilterAllValue);
  const [editOpen, setEditOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(openPublishOnLoad);
  const [selectedWork, setSelectedWork] = useState<CreatorWork | null>(null);
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null);
  const [toast, setToast] = useState<ProfileToast | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [, startTransition] = useTransition();

  const refreshFromStorage = useCallback(() => {
    const profileDraft = readProfileDraft(baseCreator.id);
    const worksDraft = readWorksDraft(baseCreator.id);
    setCreator(mergeCreatorProfile(baseCreator, profileDraft));
    setWorks(mergeCreatorWorks(baseWorks, worksDraft));
  }, [baseCreator, baseWorks]);

  useEffect(() => {
    refreshFromStorage();
  }, [refreshFromStorage]);

  useEffect(() => {
    if (onboarded) {
      setToast({ message: t.onboarded, variant: "success" });
    }
  }, [onboarded, t.onboarded]);

  function notify(message: string, variant: ProfileToast["variant"] = "default", detail?: string) {
    setToast({ message, variant, detail });
  }

  useEffect(() => {
    const draft = readWorksDraft(baseCreator.id);
    if (!draft?.length) {
      return;
    }

    const formData = new FormData();
    formData.set("works", JSON.stringify(draft));
    void syncWorksAction(formData);
  }, [baseCreator.id]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), toast.variant === "success" ? 4200 : 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const initials = useMemo(
    () =>
      creator.name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join(""),
    [creator.name]
  );

  const profileTags = useMemo(() => buildCreatorWorksProfileTags(creator, locale), [creator, locale]);
  const heroStats = useMemo(
    () => buildCreatorWorksHeroStats(creator, works.length, locale),
    [creator, locale, works.length]
  );
  const filterOptions = useMemo(() => buildWorksFilterOptions(works, locale), [locale, works]);
  const filteredWorks = useMemo(
    () =>
      filterCreatorWorks(
        works,
        {
          query: worksQuery,
          platform: platformFilter,
          category: categoryFilter,
          tag: tagFilter
        },
        locale
      ),
    [categoryFilter, locale, platformFilter, tagFilter, works, worksQuery]
  );

  function handleSaveProfile(form: CreatorProfileDraft) {
    startTransition(async () => {
      const result = await saveCreatorProfileClientAction({
        lang: locale,
        name: form.name,
        headline: form.headline ?? "",
        bio: form.bio ?? "",
        country: form.country,
        portfolio_url: form.portfolio_url,
        specialties: form.specialties,
        tools: form.tools,
        delivery_speed: form.delivery_speed,
        min_project_budget_usd: normalizeCreatorMinBudget(form.min_project_budget_usd),
        expertise_domains: creator.expertise_domains ?? []
      });

      if (!result.ok) {
        notify(result.error, "error");
        return;
      }

      writeProfileDraft(baseCreator.id, form);
      setCreator(mergeCreatorProfile(baseCreator, form));
      setEditOpen(false);
      notify(t.saved, "success");
      router.refresh();
    });
  }

  async function handleAvatarUpload(file: File) {
    setAvatarUploading(true);
    try {
      const uploadFile = await compressImageForUpload(file, {
        maxBytes: 1.8 * 1024 * 1024,
        maxDimension: 1000,
        quality: 0.78,
        fileNamePrefix: "creator-avatar"
      });
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("avatar_file", uploadFile);
      const result = await uploadCreatorAvatarAction(fd);
      if (!result.ok) {
        notify(result.error, "error");
        return;
      }
      const draft = readProfileDraft(baseCreator.id) ?? {};
      const nextDraft = { ...draft, avatar_url: result.avatar_url };
      writeProfileDraft(baseCreator.id, nextDraft as CreatorProfileDraft);
      setCreator((prev) => ({ ...prev, avatar_url: result.avatar_url }));
      notify(t.avatarUpdated, "success");
      router.refresh();
    } catch {
      notify(t.avatarFailed, "error");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handlePublishWork(work: CreatorWork): Promise<boolean> {
    const formData = new FormData();
    formData.set("payload", JSON.stringify(work));

    try {
      await publishWorkAction(formData);
    } catch {
      notify(t.publishFailed, "error");
      return false;
    }

    const existing = readWorksDraft(baseCreator.id) ?? baseWorks;
    const next = [{ ...work, hidden: false }, ...existing.filter((item) => item.id !== work.id)];
    persistWorks(next);
    setTab("posts");
    notify(t.publishedTitle, "success", t.publishedBody(work.title));
    router.refresh();
    return true;
  }

  function persistWorks(next: CreatorWork[]) {
    writeWorksDraft(baseCreator.id, next);
    setWorks(mergeCreatorWorks(baseWorks, next));
    const formData = new FormData();
    formData.set("works", JSON.stringify(next));
    void syncWorksAction(formData);
  }

  async function handleHideWork(work: CreatorWork, hidden: boolean) {
    const formData = new FormData();
    formData.set("payload", JSON.stringify(work));
    formData.set("hidden", hidden ? "true" : "false");

    try {
      await hideWorkAction(formData);
    } catch {
      notify(t.actionFailed, "error");
      return false;
    }

    const current = readWorksDraft(baseCreator.id) ?? works;
    const next = current.some((item) => item.id === work.id)
      ? current.map((item) => (item.id === work.id ? { ...item, hidden } : item))
      : [{ ...work, hidden }, ...current];
    persistWorks(next);
    if (hidden && activeWorkId === work.id) {
      setActiveWorkId(null);
    }
    notify(hidden ? t.hiddenToast : t.shownToast, "success");
    router.refresh();
  }

  async function handleDeleteWork(work: CreatorWork) {
    if (!window.confirm(t.deleteConfirm)) {
      return;
    }

    const formData = new FormData();
    formData.set("work_id", work.id);

    try {
      await deleteWorkAction(formData);
    } catch {
      notify(t.actionFailed, "error");
      return;
    }

    const current = readWorksDraft(baseCreator.id) ?? works;
    writeWorksDraft(
      baseCreator.id,
      current.filter((item) => item.id !== work.id)
    );
    setWorks((prev) => prev.filter((item) => item.id !== work.id));
    if (activeWorkId === work.id) {
      setActiveWorkId(null);
    }
    if (selectedWork?.id === work.id) {
      setSelectedWork(null);
    }
    notify(t.deletedToast, "success");
    router.refresh();
  }

  function handleActivateWork(work: CreatorWork) {
    if (canEmbedVideo(sanitizeVideoUrl(work.video_url))) {
      setActiveWorkId(work.id);
      return;
    }

    setSelectedWork(work);
  }

  useEffect(() => {
    setWorksPage(1);
  }, [sortKey, viewMode, worksQuery, platformFilter, categoryFilter, tagFilter]);

  return (
    <div className="w-full pb-10">
      {toast ? <ProfileToastBanner toast={toast} /> : null}

      <StudioWorksProfileHero
        name={creator.name}
        headline={creator.headline}
        initials={initials}
        avatarUrl={creator.avatar_url}
        avatarEditable
        avatarUploading={avatarUploading}
        editAvatarLabel={t.editAvatar}
        onAvatarUpload={(file) => void handleAvatarUpload(file)}
        tags={profileTags}
        stats={heroStats}
        verified={creator.deposit_status === "paid" || Boolean(creator.profile_completed_at)}
        actions={
          <>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-lg border-zinc-200"
            >
              <Link href={withLocale("/studio/profile", locale)}>
                <Pencil className="h-4 w-4" /> {t.editProfile}
              </Link>
            </Button>
            <Button size="sm" className="rounded-lg bg-zinc-950 hover:bg-zinc-800" onClick={() => setPublishOpen(true)}>
              <Plus className="h-4 w-4" /> {t.publishVideo}
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-lg text-zinc-500 hover:text-zinc-800">
              <Link href={withLocale(`/creators/${creator.id}`, locale)}>
                <ExternalLink className="h-4 w-4" /> {t.publicPage}
              </Link>
            </Button>
          </>
        }
      />

      <div>
        <CreatorProfileTabs
          active={tab}
          onChange={(id) => setTab(id as "posts" | "about")}
          tabs={[
            { id: "posts", label: t.posts },
            { id: "about", label: t.about }
          ]}
        />

        {tab === "posts" ? (
          <>
            <StudioWorksFilterBar
              locale={locale}
              query={worksQuery}
              platform={platformFilter}
              category={categoryFilter}
              tag={tagFilter}
              platformOptions={filterOptions.platforms}
              categoryOptions={filterOptions.categories}
              tagOptions={filterOptions.tags}
              sortKey={sortKey}
              viewMode={viewMode}
              onQueryChange={setWorksQuery}
              onPlatformChange={setPlatformFilter}
              onCategoryChange={setCategoryFilter}
              onTagChange={setTagFilter}
              onSortChange={setSortKey}
              onViewModeChange={setViewMode}
            />
            {works.length ? (
              <StudioProfileWorksGrid
                locale={locale}
                works={filteredWorks}
                activeWorkId={activeWorkId}
                viewMode={viewMode}
                page={worksPage}
                sortKey={sortKey}
                onPageChange={setWorksPage}
                engagement={engagement}
                isLoggedIn={isLoggedIn}
                empty={t.empty}
                onActivate={handleActivateWork}
                ownerActions={{
                  onHide: (work) => void handleHideWork(work, true),
                  onShow: (work) => void handleHideWork(work, false),
                  onDelete: (work) => void handleDeleteWork(work),
                  labels: {
                    hide: t.hideWork,
                    show: t.showWork,
                    delete: t.deleteWork,
                    hidden: t.hiddenBadge
                  }
                }}
              />
            ) : (
              <div className="mt-10 flex flex-col items-center rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-16 text-center">
                <Clapperboard className="h-10 w-10 text-zinc-400" />
                <p className="mt-4 max-w-md text-[15px] leading-7 text-zinc-500">{t.empty}</p>
                <Button className="mt-6 rounded-full px-6" onClick={() => setPublishOpen(true)}>
                  <Plus className="h-4 w-4" /> {t.publishVideo}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            {showRatingNote ? (
              <OrderRatingPolicyCard
                locale={locale}
                rating={creator.rating}
                orderReviewCount={creator.order_rating_count ?? 0}
                variant="inline"
              />
            ) : null}
            <CreatorAboutPanel
              title={t.about}
              bio={creator.bio}
              rows={[
                { label: t.country, value: labelCountry(creator.country, locale) },
                { label: t.specialties, value: creator.specialties.join(", ") },
                { label: t.tools, value: creator.tools.join(", ") },
                {
                  label: t.minBudget,
                  value: creatorMinBudgetAboutLabel(creator.min_project_budget_usd, locale)
                },
                { label: t.portfolio, value: creator.portfolio_url, isLink: true },
                ...(showAiTags && creator.ai_tags?.length
                  ? [{ label: t.aiTags, value: creator.ai_tags.join(" · ") }]
                  : [])
              ]}
            />
            {showAiTags && creator.ai_tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {creator.ai_tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <EditProfileDialog
        locale={locale}
        creator={creator}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleSaveProfile}
      />

      <PublishWorkDialog
        locale={locale}
        creatorId={creator.id}
        open={publishOpen}
        onOpenChange={setPublishOpen}
        onPublish={handlePublishWork}
      />

      <WorkPreviewDialog locale={locale} work={selectedWork} onOpenChange={(open) => !open && setSelectedWork(null)} />
    </div>
  );
}

function EditProfileDialog({
  locale,
  creator,
  open,
  onOpenChange,
  onSave
}: {
  locale: Locale;
  creator: Creator;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (profile: CreatorProfileDraft) => void;
}) {
  const t = copy[locale];
  const countryOptions = useMemo(() => getCountryOptions(locale, creator.country), [locale, creator.country]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSave({
      name: String(formData.get("name") ?? ""),
      headline: String(formData.get("headline") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      country: String(formData.get("country") ?? ""),
      portfolio_url: String(formData.get("portfolio_url") ?? ""),
      specialties: String(formData.get("specialties") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      tools: String(formData.get("tools") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      delivery_speed: String(formData.get("delivery_speed") ?? ""),
      min_project_budget_usd: normalizeCreatorMinBudget(formData.get("min_project_budget_usd"))
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t.editProfileTitle}</DialogTitle>
          <DialogDescription>{t.editProfileBody}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Field name="name" label={t.fields.name} defaultValue={creator.name} />
          <Field name="headline" label={t.fields.headline} defaultValue={creator.headline ?? ""} />
          <TextField name="bio" label={t.fields.bio} defaultValue={creator.bio ?? ""} />
          <SelectField
            name="country"
            label={t.fields.country}
            options={countryOptions}
            defaultValue={creator.country}
            placeholder={locale === "zh" ? "选择国家 / 地区" : "Select country"}
            required
          />
          <Field name="portfolio_url" label={t.fields.portfolio} defaultValue={creator.portfolio_url} />
          <Field
            name="specialties"
            label={t.fields.specialties}
            defaultValue={creator.specialties.join(", ")}
            placeholder={publishPlaceholder("specialties", locale)}
          />
          <Field
            name="tools"
            label={t.fields.tools}
            defaultValue={creator.tools.join(", ")}
            placeholder={publishPlaceholder("tools", locale)}
          />
          <Field
            name="delivery_speed"
            label={t.fields.delivery}
            defaultValue={creator.delivery_speed}
            placeholder={publishPlaceholder("deliverySpeed", locale)}
          />
          <CreatorMinBudgetField
            key={`${creator.id}-${creator.min_project_budget_usd ?? 0}`}
            locale={locale}
            label={t.fields.minBudget}
            hint={t.fields.minBudgetHint}
            value={normalizeCreatorMinBudget(creator.min_project_budget_usd ?? 0)}
            name="min_project_budget_usd"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit">{t.saveProfile}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PublishWorkDialog({
  locale,
  creatorId,
  open,
  onOpenChange,
  onPublish
}: {
  locale: Locale;
  creatorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish: (work: CreatorWork) => Promise<boolean>;
}) {
  const t = copy[locale];
  const categoryOptions = useMemo(() => getWorkCategoryOptions(locale), [locale]);
  const platformOptions = useMemo(() => getPlatformOptions(locale), [locale]);
  const formatOptions = useMemo(() => getVideoFormatOptions(locale), [locale]);
  const turnaroundOptions = useMemo(() => getTurnaroundOptions(locale), [locale]);
  const [formKey, setFormKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setFormKey((key) => key + 1);
      setSubmitting(false);
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const videoUrl = sanitizeVideoUrl(String(formData.get("video_url") ?? ""));
    const thumbnailInput = String(formData.get("thumbnail_url") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();

    setSubmitting(true);
    const ok = await onPublish({
      id: createWorkId(),
      creator_id: creatorId,
      title,
      category: String(formData.get("category") ?? ""),
      platform: String(formData.get("platform") ?? ""),
      format: String(formData.get("format") ?? "9:16"),
      thumbnail_url: thumbnailInput,
      video_url: videoUrl,
      description: String(formData.get("description") ?? ""),
      turnaround: String(formData.get("turnaround") ?? defaultTurnaroundValue),
      tags: String(formData.get("tags") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      created_at: new Date().toISOString()
    });
    setSubmitting(false);

    if (!ok) {
      return;
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-zinc-200/80 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t.publishTitle}</DialogTitle>
          <DialogDescription>{t.publishBody}</DialogDescription>
        </DialogHeader>
        <form key={formKey} className="grid gap-4" onSubmit={handleSubmit}>
          <Field name="title" label={t.fields.title} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              name="category"
              label={t.fields.category}
              options={categoryOptions}
              placeholder={locale === "zh" ? "选择品类" : "Select category"}
              required
            />
            <SelectField
              name="platform"
              label={t.fields.platform}
              options={platformOptions}
              placeholder={locale === "zh" ? "选择平台" : "Select platform"}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              name="format"
              label={t.fields.format}
              options={formatOptions}
              defaultValue="9:16"
              required
            />
            <SelectField
              name="turnaround"
              label={t.fields.delivery}
              options={turnaroundOptions}
              defaultValue={defaultTurnaroundValue}
              required
            />
          </div>
          <Field
            name="video_url"
            label={t.fields.video}
            placeholder={publishPlaceholder("videoUrl", locale)}
            required
          />
          <Field
            name="thumbnail_url"
            label={t.fields.thumbnail}
            placeholder={publishPlaceholder("thumbnail", locale)}
          />
          <TextField name="description" label={t.fields.description} required />
          <Field name="tags" label={t.fields.tags} placeholder={publishPlaceholder("tags", locale)} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {locale === "zh" ? "发布中…" : "Publishing…"}
                </>
              ) : (
                t.publish
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WorkPreviewDialog({
  locale,
  work,
  onOpenChange
}: {
  locale: Locale;
  work: CreatorWork | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = copy[locale];

  return (
    <Dialog open={Boolean(work)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        {work ? (
          <>
            <DialogHeader>
              <DialogTitle>{work.title}</DialogTitle>
              <DialogDescription>{work.description}</DialogDescription>
            </DialogHeader>
            <div className="relative mx-auto aspect-[9/16] max-h-[min(70vh,560px)] w-full max-w-[320px] overflow-hidden rounded-lg bg-black">
              {work.video_url ? (
                <WorkVideoPlayer
                  videoUrl={work.video_url}
                  thumbnailUrl={work.thumbnail_url}
                  title={work.title}
                />
              ) : (
                <WorkCoverImage
                  src={resolveWorkThumbnail(work.video_url, work.thumbnail_url)}
                  alt={work.title}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{labelWorkCategory(work.category, locale)}</Badge>
              <Badge variant="secondary">{labelPlatform(work.platform, locale)}</Badge>
              <Badge variant="secondary">{labelVideoFormat(work.format, locale)}</Badge>
              <Badge variant="outline">
                {t.turnaround}: {labelTurnaround(work.turnaround, locale)}
              </Badge>
              {work.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
            {work.video_url && !canEmbedVideo(work.video_url) ? (
              <Button asChild variant="outline" className="w-full">
                <a href={work.video_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" /> {t.openOriginal}
                </a>
              </Button>
            ) : work.video_url ? (
              <p className="text-center text-xs text-muted-foreground">
                <a
                  href={work.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> {t.openOriginal}
                </a>
              </p>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  required
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

function TextField({
  name,
  label,
  defaultValue,
  required
}: {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} defaultValue={defaultValue} required={required} rows={4} />
    </div>
  );
}

function SelectField({
  name,
  label,
  options,
  defaultValue,
  placeholder,
  required
}: {
  name: string;
  label: string;
  options: readonly LocalizedOption[] | readonly string[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const normalized = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option
  );

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        {!defaultValue && placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {normalized.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
