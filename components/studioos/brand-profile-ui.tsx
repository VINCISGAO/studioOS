"use client";

import Image from "next/image";
import Link from "next/link";
import { WorkGridTile } from "@/components/creator/work-grid-tile";
import { Badge } from "@/components/ui/badge";
import type { BrandShowcaseAd } from "@/lib/brand-profile-types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { buildAvatarInitials } from "@/lib/studioos/avatar-initials";
import { brandTheme } from "@/lib/studioos/brand-theme";
import { cn } from "@/lib/utils";
import { ArrowRight, Building2, Camera, Globe, Loader2, Megaphone, UserRound } from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";

export function BrandAvatar({
  initials,
  avatarUrl,
  size = "lg"
}: {
  initials: string;
  avatarUrl?: string;
  size?: "md" | "lg";
}) {
  const dim = size === "lg" ? "h-20 w-20 sm:h-24 sm:w-24" : "h-16 w-16";
  const text = size === "lg" ? "text-xl sm:text-2xl" : "text-lg";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl font-medium text-white ring-2",
        brandTheme.avatarBg,
        brandTheme.heroRing,
        dim,
        text
      )}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" fill className="object-cover" sizes="96px" unoptimized />
      ) : (
        buildAvatarInitials(initials, "B")
      )}
    </div>
  );
}

export function BrandEditableAvatar({
  initials,
  avatarUrl,
  editable = false,
  uploading = false,
  editLabel,
  onUpload,
  size = "lg"
}: {
  initials: string;
  avatarUrl?: string;
  editable?: boolean;
  uploading?: boolean;
  editLabel: string;
  onUpload?: (file: File) => void;
  size?: "md" | "lg";
}) {
  const dim = size === "lg" ? "h-20 w-20 sm:h-24 sm:w-24" : "h-16 w-16";
  const text = size === "lg" ? "text-xl sm:text-2xl" : "text-lg";

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
    event.target.value = "";
  }

  const body = (
    <>
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" fill className="object-cover" sizes="96px" unoptimized />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center font-medium text-white",
            brandTheme.avatarBg,
            text
          )}
        >
          {buildAvatarInitials(initials, "B")}
        </div>
      )}
      {editable ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/45">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-white opacity-0 group-hover:opacity-100" />
          ) : (
            <Camera className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100" />
          )}
        </div>
      ) : null}
    </>
  );

  if (!editable) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-2xl ring-2",
          brandTheme.heroRing,
          dim
        )}
      >
        {body}
      </div>
    );
  }

  return (
    <label
      className={cn(
        "group relative shrink-0 cursor-pointer overflow-hidden rounded-2xl ring-2 transition hover:ring-indigo-300",
        brandTheme.heroRing,
        dim
      )}
      title={editLabel}
    >
      {body}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        disabled={uploading}
        onChange={handleChange}
      />
    </label>
  );
}

export function BrandProfileHero({
  name,
  headline,
  initials,
  avatarUrl,
  avatarEditable = false,
  avatarUploading = false,
  editAvatarLabel,
  onAvatarUpload,
  industry,
  adsCount,
  adsLabel,
  isPublished,
  brandLabel,
  publishedLabel,
  draftLabel,
  actions
}: {
  name: string;
  headline?: string;
  initials: string;
  avatarUrl?: string;
  avatarEditable?: boolean;
  avatarUploading?: boolean;
  editAvatarLabel?: string;
  onAvatarUpload?: (file: File) => void;
  industry?: string;
  adsCount: number;
  adsLabel: string;
  isPublished: boolean;
  brandLabel: string;
  publishedLabel: string;
  draftLabel: string;
  actions: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 sm:gap-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4 sm:gap-5">
            {avatarEditable ? (
              <BrandEditableAvatar
                initials={initials}
                avatarUrl={avatarUrl}
                editable
                uploading={avatarUploading}
                editLabel={editAvatarLabel ?? "Change photo"}
                onUpload={onAvatarUpload}
              />
            ) : (
              <BrandAvatar initials={initials} avatarUrl={avatarUrl} />
            )}
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">{name}</h1>
                <Badge className={cn("font-normal", brandTheme.badge)}>
                  <Megaphone className="mr-1 h-3 w-3" />
                  {brandLabel}
                </Badge>
                {!isPublished ? (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 font-normal text-amber-800">
                    {draftLabel}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 font-normal text-emerald-800">
                    {publishedLabel}
                  </Badge>
                )}
              </div>
              {headline ? (
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-500 sm:max-w-xl">{headline}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">{actions}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-indigo-50 pt-4 text-sm">
          <span className={cn("inline-flex items-center rounded-full px-3 py-1 ring-1", brandTheme.statPill)}>
            <span className="font-medium">{adsCount}</span>
            <span className="ml-1.5 opacity-80">{adsLabel}</span>
          </span>
          {industry ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-3 py-1 text-zinc-600 ring-1 ring-zinc-200/80">
              <Building2 className="h-3.5 w-3.5" />
              {industry}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function BrandProfileTabs({
  tabs,
  active,
  onChange
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mt-8 flex gap-6 overflow-x-auto border-b border-indigo-100">
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition",
            active === id ? brandTheme.tabActive : brandTheme.tabIdle
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function BrandAdsGrid({
  ads,
  activeWorkId,
  empty,
  locale,
  byStudioLabel,
  onActivate,
  onExpand,
  ownerActions
}: {
  ads: BrandShowcaseAd[];
  activeWorkId: string | null;
  empty: ReactNode;
  locale: Locale;
  byStudioLabel: string;
  onActivate: (ad: BrandShowcaseAd) => void;
  onExpand: (ad: BrandShowcaseAd) => void;
  ownerActions?: (ad: BrandShowcaseAd) => ReactNode;
}) {
  if (!ads.length) {
    return (
      <div className="mt-10 rounded-[24px] border border-dashed border-indigo-200/80 bg-indigo-50/30 px-6 py-16 text-center text-zinc-500">
        {empty}
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-5">
      {ads.map((ad) => (
        <div key={ad.id} className="space-y-2">
          <WorkGridTile
            videoUrl={ad.video_url}
            thumbnailUrl={ad.thumbnail_url}
            title={ad.title}
            platform={ad.platform}
            isActive={activeWorkId === ad.id}
            isHidden={!ad.visible}
            onActivate={() => onActivate(ad)}
            onExpand={() => onExpand(ad)}
            className={cn(
              "rounded-[20px] shadow-sm ring-1 transition hover:shadow-md",
              brandTheme.cardRing,
              !ad.visible && "opacity-60"
            )}
          />
          {ad.creator_id === "brand" ? (
            <span className="inline-flex items-center gap-1.5 px-0.5 text-xs font-medium text-indigo-700">
              <UserRound className="h-3.5 w-3.5" />
              {byStudioLabel}: {ad.creator_name}
            </span>
          ) : (
            <Link
              href={withLocale(`/creators/${ad.creator_id}`, locale)}
              className="inline-flex items-center gap-1.5 px-0.5 text-xs font-medium text-indigo-700 hover:text-indigo-900"
            >
              <UserRound className="h-3.5 w-3.5" />
              {byStudioLabel}: {ad.creator_name}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {ownerActions ? ownerActions(ad) : null}
        </div>
      ))}
    </div>
  );
}

export function BrandAboutPanel({
  title,
  bio,
  rows
}: {
  title: string;
  bio?: string;
  rows: { label: string; value: string; isLink?: boolean }[];
}) {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <div className="rounded-[24px] border border-indigo-100/80 bg-white p-6 shadow-sm shadow-indigo-50/50 sm:p-8">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-900">{title}</h2>
        <p className="mt-4 text-[15px] leading-8 text-zinc-600">{bio || "—"}</p>
      </div>
      <div className="grid gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-[20px] border border-indigo-100/80 bg-white px-5 py-4 shadow-sm shadow-indigo-50/30"
          >
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-indigo-400">{row.label}</div>
            {row.isLink ? (
              <a
                href={row.value}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 break-all text-sm font-medium text-indigo-700 hover:underline"
              >
                <Globe className="h-3.5 w-3.5 shrink-0" />
                {row.value}
              </a>
            ) : (
              <div className="mt-2 text-sm font-medium leading-6 text-zinc-800">{row.value}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
