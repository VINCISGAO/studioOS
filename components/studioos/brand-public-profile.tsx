"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BrandAboutPanel,
  BrandAdsGrid,
  BrandProfileHero,
  BrandProfileTabs
} from "@/components/studioos/brand-profile-ui";
import { WorkVideoPlayer } from "@/components/creator/work-video-player";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { BrandShowcaseAd, StoredBrandProfile } from "@/lib/brand-profile-types";
import { Pencil, UserRound } from "lucide-react";

const copy = {
  en: {
    ads: "Ads",
    about: "About",
    byStudio: "Made by",
    visitStudio: "View studio profile",
    edit: "Edit page",
    website: "Website",
    industry: "Industry",
    company: "Company",
    empty: "No public ads yet.",
    brand: "Advertiser",
    published: "Live",
    draft: "Draft",
    adsCount: "ads",
    aboutTitle: "About this brand",
    previewBanner: "Preview — only you can see this page until you publish."
  },
  zh: {
    ads: "广告作品",
    about: "品牌介绍",
    byStudio: "制作团队",
    visitStudio: "查看团队主页",
    edit: "编辑主页",
    website: "官网",
    industry: "行业",
    company: "公司",
    empty: "还没有公开的广告作品。",
    brand: "广告主",
    published: "已发布",
    draft: "未发布",
    adsCount: "条广告",
    aboutTitle: "品牌介绍",
    previewBanner: "预览模式 — 发布前仅你自己可见。"
  }
};

export function BrandPublicProfile({
  locale,
  profile,
  isOwner,
  isPreview = false
}: {
  locale: Locale;
  profile: StoredBrandProfile;
  isOwner: boolean;
  isPreview?: boolean;
}) {
  const t = copy[locale];
  const [tab, setTab] = useState<"ads" | "about">("ads");
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null);
  const [previewAd, setPreviewAd] = useState<BrandShowcaseAd | null>(null);
  const ads = profile.showcase_ads.filter((item) => item.visible);

  const initials = profile.display_name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const aboutRows = [
    profile.company_name ? { label: t.company, value: profile.company_name } : null,
    profile.industry ? { label: t.industry, value: profile.industry } : null,
    profile.website ? { label: t.website, value: profile.website, isLink: true as const } : null
  ].filter(Boolean) as { label: string; value: string; isLink?: boolean }[];

  return (
    <div>
      {isPreview ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t.previewBanner}
        </div>
      ) : null}

      <BrandProfileHero
        name={profile.display_name}
        headline={profile.headline}
        initials={initials}
        avatarUrl={profile.logo_url || undefined}
        industry={profile.industry}
        adsCount={ads.length}
        adsLabel={t.adsCount}
        isPublished={Boolean(profile.profile_completed_at)}
        brandLabel={t.brand}
        publishedLabel={t.published}
        draftLabel={t.draft}
        actions={
          isOwner ? (
            <Button asChild size="sm" className="rounded-full bg-indigo-600 hover:bg-indigo-700">
              <Link href={withLocale("/brand/profile", locale)}>
                <Pencil className="h-4 w-4" />
                {t.edit}
              </Link>
            </Button>
          ) : null
        }
      />

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
          ads={ads}
          activeWorkId={activeWorkId}
          empty={t.empty}
          locale={locale}
          byStudioLabel={t.byStudio}
          onActivate={(ad) => setActiveWorkId(activeWorkId === ad.id ? null : ad.id)}
          onExpand={(ad) => setPreviewAd(ad)}
        />
      ) : (
        <BrandAboutPanel title={t.aboutTitle} bio={profile.bio} rows={aboutRows} />
      )}

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
              <Button asChild className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700">
                <Link href={withLocale(`/creators/${previewAd.creator_id}`, locale)}>
                  <UserRound className="h-4 w-4" />
                  {t.visitStudio}: {previewAd.creator_name}
                </Link>
              </Button>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
