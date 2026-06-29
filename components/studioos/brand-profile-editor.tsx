"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  polishBrandProfileAction,
  saveBrandProfileAction,
  syncBrandShowcaseAction,
  toggleBrandShowcaseAdAction,
  uploadBrandAvatarAction
} from "@/app/brand-profile-actions";
import { WorkVideoPlayer } from "@/components/creator/work-video-player";
import {
  BrandAboutPanel,
  BrandAdsGrid,
  BrandProfileHero,
  BrandProfileTabs
} from "@/components/studioos/brand-profile-ui";
import { brandTheme } from "@/lib/studioos/brand-theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { BrandShowcaseAd, StoredBrandProfile } from "@/lib/brand-profile-types";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  RefreshCw,
  Sparkles,
  XCircle
} from "lucide-react";

const copy = {
  en: {
    myPage: "My brand page",
    publicPage: "View public page",
    editProfile: "Edit profile",
    editAvatar: "Change logo",
    publish: "Publish page",
    publishing: "Publishing…",
    save: "Save",
    saved: "Profile saved",
    published: "Page published",
    publishSuccessTitle: "Published successfully",
    publishSuccessHint: "Your brand page is live. Share the link with studios and partners.",
    viewPublishedPage: "Open live page",
    ads: "Ads",
    about: "About",
    aboutTitle: "About this brand",
    byStudio: "Made by",
    company: "Company",
    emptyAds: "No ads yet. Complete a project and sync from orders.",
    sync: "Sync from orders",
    syncing: "Syncing…",
    show: "Show",
    hide: "Hide",
    visible: "Public",
    hidden: "Hidden",
    brand: "Advertiser",
    publishedBadge: "Live",
    draftBadge: "Draft",
    adsCount: "ads",
    editTitle: "Edit brand profile",
    editHint: "This is what visitors see on your public advertiser page.",
    headline: "Headline",
    headlineHint: "One line — what your brand does",
    bio: "About",
    bioHint: "Products, audience, ad style",
    displayName: "Display name",
    industry: "Industry",
    website: "Website",
    aiTitle: "AI copy assistant",
    aiHint: "Describe your brand casually — AI drafts headline and bio.",
    aiPlaceholder: "e.g. DTC skincare brand in North America, clean ingredients, TikTok ads…",
    aiPolish: "Polish with AI",
    aiPolishing: "Polishing…",
    aiApplied: "Headline and bio updated.",
    aiNeedInput: "Add a few lines about your brand first",
    draftHint: "Fill in headline and bio, then publish to make your page public.",
    previewDraft: "Preview draft page",
    visitStudio: "View studio",
    avatarUpdated: "Logo updated",
    avatarFailed: "Logo upload failed"
  },
  zh: {
    myPage: "我的品牌主页",
    publicPage: "查看公开主页",
    editProfile: "编辑资料",
    editAvatar: "更换头像",
    publish: "发布主页",
    publishing: "发布中…",
    save: "保存",
    saved: "资料已保存",
    published: "主页已发布",
    publishSuccessTitle: "发布成功",
    publishSuccessHint: "品牌主页已公开，可以分享给制作团队和合作伙伴。",
    viewPublishedPage: "打开已发布主页",
    ads: "广告作品",
    about: "品牌介绍",
    aboutTitle: "品牌介绍",
    byStudio: "制作团队",
    company: "公司",
    emptyAds: "还没有广告。完成项目后从订单同步。",
    sync: "从订单同步",
    syncing: "同步中…",
    show: "展示",
    hide: "隐藏",
    visible: "已公开",
    hidden: "已隐藏",
    brand: "广告主",
    publishedBadge: "已发布",
    draftBadge: "未发布",
    adsCount: "条广告",
    editTitle: "编辑品牌资料",
    editHint: "访客会在你的广告主公开主页上看到这些内容。",
    headline: "一句话介绍",
    headlineHint: "例如：北美 DTC 护肤品牌",
    bio: "品牌介绍",
    bioHint: "产品、受众、广告风格",
    displayName: "显示名称",
    industry: "行业",
    website: "官网",
    aiTitle: "AI 辅助写介绍",
    aiHint: "用口语描述品牌，AI 会整理成一句话介绍和品牌介绍。",
    aiPlaceholder: "例如：北美 DTC 护肤品牌，主打清洁成分，主要做 TikTok 效果广告…",
    aiPolish: "AI 整理介绍",
    aiPolishing: "整理中…",
    aiApplied: "已更新一句话介绍和品牌介绍。",
    aiNeedInput: "先写几句关于品牌的信息",
    draftHint: "填写一句话介绍和品牌介绍后发布，主页才会对外公开。",
    previewDraft: "预览草稿主页",
    visitStudio: "查看团队",
    avatarUpdated: "头像已更新",
    avatarFailed: "头像上传失败"
  }
};

type Toast = { message: string; variant: "success" | "error" | "default"; detail?: string };

function ToastBanner({ toast }: { toast: Toast }) {
  const isSuccess = toast.variant === "success";
  const isError = toast.variant === "error";

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border px-4 py-3 shadow-lg",
        isSuccess && "border-emerald-200 bg-emerald-50",
        isError && "border-red-200 bg-red-50",
        !isSuccess && !isError && "border-zinc-200 bg-zinc-900 text-white"
      )}
    >
      <div className="flex items-start gap-3">
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        ) : isError ? (
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        ) : null}
        <div>
          <p
            className={cn(
              "text-sm font-semibold",
              isSuccess && "text-emerald-950",
              isError && "text-red-950",
              !isSuccess && !isError && "text-white"
            )}
          >
            {toast.message}
          </p>
          {toast.detail ? (
            <p
              className={cn(
                "mt-1 text-sm leading-6",
                isSuccess && "text-emerald-900/90",
                isError && "text-red-900/90",
                !isSuccess && !isError && "text-zinc-300"
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

export function BrandProfileEditor({
  locale,
  profile
}: {
  locale: Locale;
  profile: StoredBrandProfile;
}) {
  const t = copy[locale];
  const router = useRouter();
  const publishSuccessRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"ads" | "about">("ads");
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(Boolean(profile.profile_completed_at));
  const [isPending, startTransition] = useTransition();
  const [isPolishing, startPolish] = useTransition();
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null);
  const [previewAd, setPreviewAd] = useState<BrandShowcaseAd | null>(null);
  const [references, setReferences] = useState(profile.showcase_ads);

  const [companyName, setCompanyName] = useState(profile.company_name);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [industry, setIndustry] = useState(profile.industry);
  const [website, setWebsite] = useState(profile.website);
  const [headline, setHeadline] = useState(profile.headline);
  const [bio, setBio] = useState(profile.bio);
  const [aiDraft, setAiDraft] = useState("");
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState(profile.logo_url);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const publicHref = withLocale(`/brands/${profile.id}`, locale);
  const isPublished = Boolean(profile.profile_completed_at);
  const visibleAds = useMemo(() => references.filter((item) => item.visible), [references]);

  useEffect(() => {
    setReferences(profile.showcase_ads);
    setCompanyName(profile.company_name);
    setDisplayName(profile.display_name);
    setIndustry(profile.industry);
    setWebsite(profile.website);
    setHeadline(profile.headline);
    setBio(profile.bio);
    setLogoUrl(profile.logo_url);
    setPublishSuccess(Boolean(profile.profile_completed_at));
  }, [profile]);

  const initials = useMemo(
    () =>
      displayName
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join(""),
    [displayName]
  );

  const aboutRows = useMemo(
    () =>
      [
        companyName ? { label: t.company, value: companyName } : null,
        industry ? { label: t.industry, value: industry } : null,
        website ? { label: t.website, value: website, isLink: true as const } : null
      ].filter(Boolean) as { label: string; value: string; isLink?: boolean }[],
    [companyName, industry, website, t.company, t.industry, t.website]
  );

  function notify(message: string, variant: Toast["variant"] = "default", detail?: string) {
    setToast({ message, variant, detail });
    window.setTimeout(() => setToast(null), variant === "success" ? 4500 : 3000);
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

      if (markComplete) {
        setPublishSuccess(true);
        setEditOpen(false);
        notify(t.publishSuccessTitle, "success", t.publishSuccessHint);
        requestAnimationFrame(() => {
          publishSuccessRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      } else {
        notify(t.saved, "success");
      }
      router.refresh();
    });
  }

  function handlePolish() {
    setFormError(null);
    setAiNotice(null);

    const hasContext =
      aiDraft.trim() ||
      headline.trim() ||
      bio.trim() ||
      companyName.trim() ||
      displayName.trim() ||
      industry.trim();

    if (!hasContext) {
      setFormError(t.aiNeedInput);
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
        return;
      }

      setHeadline(result.headline);
      setBio(result.bio);
      setAiNotice(t.aiApplied);
    });
  }

  function handleSync() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      await syncBrandShowcaseAction(fd);
      router.refresh();
    });
  }

  function toggleAd(adId: string, visible: boolean) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("ad_id", adId);
      fd.set("visible", visible ? "1" : "0");
      await toggleBrandShowcaseAdAction(fd);
      setReferences((prev) => prev.map((item) => (item.id === adId ? { ...item, visible } : item)));
      router.refresh();
    });
  }

  async function handleAvatarUpload(file: File) {
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("avatar_file", file);
      const result = await uploadBrandAvatarAction(fd);
      if (!result.ok) {
        notify(result.error, "error");
        return;
      }
      setLogoUrl(result.logo_url);
      notify(t.avatarUpdated, "success");
      router.refresh();
    } catch {
      notify(t.avatarFailed, "error");
    } finally {
      setAvatarUploading(false);
    }
  }

  return (
    <div className={cn("mx-auto w-full max-w-6xl pb-10", brandTheme.pageBg)}>
      {toast ? <ToastBanner toast={toast} /> : null}

      <BrandProfileHero
        name={displayName || companyName}
        headline={headline}
        initials={initials}
        avatarUrl={logoUrl || undefined}
        avatarEditable
        avatarUploading={avatarUploading}
        editAvatarLabel={t.editAvatar}
        onAvatarUpload={(file) => void handleAvatarUpload(file)}
        industry={industry}
        adsCount={visibleAds.length}
        adsLabel={t.adsCount}
        isPublished={isPublished || publishSuccess}
        brandLabel={t.brand}
        publishedLabel={t.publishedBadge}
        draftLabel={t.draftBadge}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-indigo-200 text-indigo-900 hover:bg-indigo-50"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4" /> {t.editProfile}
            </Button>
            <Button
              size="sm"
              className="rounded-full bg-indigo-600 hover:bg-indigo-700"
              disabled={isPending}
              onClick={() => handleSave(true)}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {t.publishing}
                </>
              ) : publishSuccess || isPublished ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> {t.published}
                </>
              ) : (
                t.publish
              )}
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-full text-indigo-700 hover:bg-indigo-50">
              <Link href={publicHref} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> {t.publicPage}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={isPending}
              onClick={handleSync}
            >
              <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
              {isPending ? t.syncing : t.sync}
            </Button>
          </>
        }
      />

      {!isPublished && !publishSuccess ? (
        <p className="mt-4 text-sm text-zinc-500">{t.draftHint}</p>
      ) : null}

      {publishSuccess ? (
        <div
          ref={publishSuccessRef}
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 sm:px-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">{t.publishSuccessTitle}</p>
                <p className="mt-0.5 text-sm text-emerald-800">{t.publishSuccessHint}</p>
              </div>
            </div>
            <Button asChild className="rounded-full bg-indigo-600 hover:bg-indigo-700">
              <Link href={publicHref} target="_blank" rel="noreferrer">
                {t.viewPublishedPage}
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      <BrandProfileTabs
        tabs={[
          { id: "ads", label: t.ads },
          { id: "about", label: t.about }
        ]}
        active={tab}
        onChange={(id) => setTab(id as "ads" | "about")}
      />

      {tab === "ads" ? (
        <BrandAdsGrid
          ads={references}
          activeWorkId={activeWorkId}
          empty={t.emptyAds}
          locale={locale}
          byStudioLabel={t.byStudio}
          onActivate={(ad) => setActiveWorkId(activeWorkId === ad.id ? null : ad.id)}
          onExpand={(ad) => setPreviewAd(ad)}
          ownerActions={(ad) => (
            <div className="flex items-center justify-between gap-2 px-0.5">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-indigo-700"
                disabled={isPending}
                onClick={() => toggleAd(ad.id, !ad.visible)}
              >
                {ad.visible ? (
                  <>
                    <Eye className="h-3.5 w-3.5" /> {t.hide}
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5" /> {t.show}
                  </>
                )}
              </Button>
              <Badge variant={ad.visible ? "secondary" : "outline"} className="font-normal">
                {ad.visible ? t.visible : t.hidden}
              </Badge>
            </div>
          )}
        />
      ) : (
        <BrandAboutPanel title={t.aboutTitle} bio={bio} rows={aboutRows} />
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t.editTitle}</DialogTitle>
            <p className="text-sm text-zinc-500">{t.editHint}</p>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.company} value={companyName} onChange={setCompanyName} />
              <Field label={t.displayName} value={displayName} onChange={setDisplayName} />
              <Field label={t.industry} value={industry} onChange={setIndustry} />
              <Field label={t.website} value={website} onChange={setWebsite} placeholder="https://" />
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-indigo-950">{t.aiTitle}</p>
                  <p className="mt-0.5 text-xs text-indigo-700/80">{t.aiHint}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-indigo-200"
                  disabled={isPolishing}
                  onClick={handlePolish}
                >
                  {isPolishing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> {t.aiPolishing}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> {t.aiPolish}
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={aiDraft}
                onChange={(e) => setAiDraft(e.target.value)}
                rows={3}
                placeholder={t.aiPlaceholder}
                disabled={isPolishing}
                className="mt-3 resize-none border-indigo-100 bg-white"
              />
              {aiNotice ? <p className="mt-2 text-xs text-emerald-700">{aiNotice}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline">{t.headline}</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={t.headlineHint}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">{t.bio}</Label>
              <Textarea
                id="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t.bioHint}
              />
            </div>

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={isPending || isPolishing} onClick={() => handleSave(false)}>
              {t.save}
            </Button>
            <Button
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={isPending || isPolishing}
              onClick={() => handleSave(true)}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {t.publishing}
                </>
              ) : (
                t.publish
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(previewAd)} onOpenChange={(open) => !open && setPreviewAd(null)}>
        <DialogContent className="max-w-md sm:max-w-lg">
          {previewAd ? (
            <>
              <DialogHeader>
                <DialogTitle>{previewAd.title}</DialogTitle>
              </DialogHeader>
              <div className="relative mx-auto aspect-[9/16] max-h-[min(70vh,560px)] w-full max-w-[320px] overflow-hidden rounded-lg bg-black">
                <WorkVideoPlayer
                  videoUrl={previewAd.video_url}
                  thumbnailUrl={previewAd.thumbnail_url}
                  title={previewAd.title}
                />
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
