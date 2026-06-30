"use client";

import Image from "next/image";
import { PortfolioWorkCard } from "@/components/creator/portfolio-work-card";
import { WorkGridTile } from "@/components/creator/work-grid-tile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { CreatorWork } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { labelPlatform } from "@/lib/localized-options";
import type { WorkEngagementSnapshot } from "@/lib/work-engagement-utils";
import { baseViewCount } from "@/lib/work-engagement-utils";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Clock,
  DollarSign,
  Grid3X3,
  LayoutList,
  Loader2,
  MapPin,
  ShieldCheck,
  Star
} from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";
import { useMemo } from "react";

export type ProfileStat = {
  label: string;
  value: string;
};

export type WorkSortKey = "newest" | "oldest" | "title";

export type WorkViewMode = "grid" | "list";

const WORKS_PAGE_SIZE = 6;

const toolbarCopy = {
  en: {
    newest: "Latest",
    oldest: "Oldest",
    title: "Title A–Z"
  },
  zh: {
    newest: "最新发布",
    oldest: "最早发布",
    title: "标题 A–Z"
  }
};

function fallbackEngagement(workId: string): WorkEngagementSnapshot {
  return {
    likeCount: 0,
    likedByMe: false,
    views: baseViewCount(workId)
  };
}

export function CreatorAvatar({
  initials,
  avatarUrl,
  size = "lg"
}: {
  initials: string;
  avatarUrl?: string;
  size?: "md" | "lg" | "xl";
}) {
  const dim =
    size === "xl" ? "h-28 w-28" : size === "lg" ? "h-20 w-20 sm:h-24 sm:w-24" : "h-16 w-16";
  const text = size === "xl" ? "text-3xl" : size === "lg" ? "text-xl sm:text-2xl" : "text-lg";

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-zinc-900 ring-2 ring-zinc-100",
        dim
      )}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" fill className="object-cover" sizes="112px" unoptimized />
      ) : (
        <div className={cn("flex h-full w-full items-center justify-center font-medium text-white", text)}>
          {initials.slice(0, 2)}
        </div>
      )}
    </div>
  );
}

export function CreatorEditableAvatar({
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
  size?: "md" | "lg" | "xl";
}) {
  const dim =
    size === "xl" ? "h-28 w-28" : size === "lg" ? "h-20 w-20 sm:h-24 sm:w-24" : "h-16 w-16";
  const text = size === "xl" ? "text-3xl" : size === "lg" ? "text-xl sm:text-2xl" : "text-lg";

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
        <Image src={avatarUrl} alt="" fill className="object-cover" sizes="112px" unoptimized />
      ) : (
        <div className={cn("flex h-full w-full items-center justify-center bg-zinc-900 font-medium text-white", text)}>
          {initials.slice(0, 2)}
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
      <div className={cn("relative shrink-0 overflow-hidden rounded-full ring-2 ring-zinc-100", dim)}>
        {body}
      </div>
    );
  }

  return (
    <label
      className={cn(
        "group relative shrink-0 cursor-pointer overflow-hidden rounded-full ring-2 ring-zinc-100 transition hover:ring-zinc-300",
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

export function CreatorProfileHero({
  name,
  headline,
  initials,
  avatarUrl,
  avatarEditable = false,
  avatarUploading = false,
  editAvatarLabel,
  onAvatarUpload,
  stats,
  rating,
  country,
  depositNote,
  verified = false,
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
  stats: ProfileStat[];
  rating: number;
  country: string;
  depositNote?: string;
  verified?: boolean;
  actions: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-5">
            {avatarEditable ? (
              <CreatorEditableAvatar
                initials={initials}
                avatarUrl={avatarUrl}
                editable
                uploading={avatarUploading}
                editLabel={editAvatarLabel ?? "Change photo"}
                onUpload={onAvatarUpload}
                size="xl"
              />
            ) : (
              <CreatorAvatar initials={initials} avatarUrl={avatarUrl} size="xl" />
            )}

            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-zinc-950">{name}</h1>
                {verified ? <BadgeCheck className="h-5 w-5 shrink-0 text-blue-600" strokeWidth={2.2} /> : null}
              </div>
              {headline ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{headline}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">{actions}</div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-zinc-100 pt-5 text-sm text-zinc-600">
          {stats.map((stat, index) => {
            const Icon = index === 0 ? Clapperboard : index === 1 ? Clock : DollarSign;
            return (
              <span key={stat.label} className="inline-flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-zinc-400" />
                <span className="font-semibold text-zinc-900">{stat.value}</span>
                <span>{stat.label}</span>
              </span>
            );
          })}
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-zinc-900">{rating}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-zinc-400" />
            {country}
          </span>
          {depositNote ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              {depositNote}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function CreatorProfileTabs({
  tabs,
  active,
  onChange,
  trailing
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  trailing?: ReactNode;
}) {
  return (
    <div className="mt-8 flex flex-col gap-4 border-b border-zinc-200 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex gap-8 overflow-x-auto">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition",
              active === id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-400 hover:text-zinc-600"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {trailing ? <div className="pb-3 lg:shrink-0">{trailing}</div> : null}
    </div>
  );
}

export function StudioProfileWorksToolbar({
  locale,
  sortKey,
  viewMode,
  onSortChange,
  onViewModeChange
}: {
  locale: Locale;
  sortKey: WorkSortKey;
  viewMode: WorkViewMode;
  onSortChange: (value: WorkSortKey) => void;
  onViewModeChange: (value: WorkViewMode) => void;
}) {
  const t = toolbarCopy[locale];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={sortKey} onValueChange={(value) => onSortChange(value as WorkSortKey)}>
        <SelectTrigger className="h-9 w-[132px] rounded-lg border-zinc-200 bg-white text-sm shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">{t.newest}</SelectItem>
          <SelectItem value="oldest">{t.oldest}</SelectItem>
          <SelectItem value="title">{t.title}</SelectItem>
        </SelectContent>
      </Select>

      <div className="ml-1 flex items-center rounded-lg border border-zinc-200 bg-white p-0.5">
        <button
          type="button"
          aria-label="Grid view"
          className={cn(
            "rounded-md p-1.5 transition",
            viewMode === "grid" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-zinc-600"
          )}
          onClick={() => onViewModeChange("grid")}
        >
          <Grid3X3 className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="List view"
          className={cn(
            "rounded-md p-1.5 transition",
            viewMode === "list" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-zinc-600"
          )}
          onClick={() => onViewModeChange("list")}
        >
          <LayoutList className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function StudioProfilePagination({
  locale,
  page,
  totalPages,
  onPageChange
}: {
  locale: Locale;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav
      aria-label={locale === "zh" ? "作品分页" : "Works pagination"}
      className="mt-10 flex items-center justify-center gap-1"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          onClick={() => onPageChange(pageNumber)}
          className={cn(
            "flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition",
            pageNumber === page
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
          )}
        >
          {pageNumber}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

export function StudioProfileWorksGrid({
  locale,
  works,
  activeWorkId,
  viewMode,
  page,
  sortKey,
  onPageChange,
  engagement,
  isLoggedIn,
  empty,
  onActivate,
  ownerActions
}: {
  locale: Locale;
  works: CreatorWork[];
  activeWorkId: string | null;
  viewMode: WorkViewMode;
  page: number;
  sortKey: WorkSortKey;
  onPageChange: (page: number) => void;
  engagement: Record<string, WorkEngagementSnapshot>;
  isLoggedIn: boolean;
  empty: ReactNode;
  onActivate: (work: CreatorWork) => void;
  ownerActions?: {
    onHide: (work: CreatorWork) => void;
    onShow: (work: CreatorWork) => void;
    onDelete: (work: CreatorWork) => void;
    labels: {
      hide: string;
      show: string;
      delete: string;
      hidden: string;
    };
  };
}) {
  const sorted = useMemo(() => {
    const next = [...works];
    next.sort((a, b) => {
      if (sortKey === "title") {
        return a.title.localeCompare(b.title);
      }
      const delta = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortKey === "oldest" ? delta : -delta;
    });
    return next;
  }, [works, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / WORKS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * WORKS_PAGE_SIZE, safePage * WORKS_PAGE_SIZE);

  if (!works.length) {
    return (
      <div className="mt-10 rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-16 text-center text-zinc-500">
        {empty}
      </div>
    );
  }

  if (!paged.length) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "mt-6",
          viewMode === "grid"
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            : "flex flex-col gap-3"
        )}
      >
        {paged.map((work) => (
          <PortfolioWorkCard
            key={work.id}
            locale={locale}
            work={work}
            engagement={engagement[work.id] ?? fallbackEngagement(work.id)}
            isLoggedIn={isLoggedIn}
            isActive={activeWorkId === work.id}
            viewMode={viewMode}
            onActivate={() => onActivate(work)}
            ownerActions={
              ownerActions
                ? {
                    onHide: () => ownerActions.onHide(work),
                    onShow: () => ownerActions.onShow(work),
                    onDelete: () => ownerActions.onDelete(work),
                    labels: ownerActions.labels
                  }
                : undefined
            }
          />
        ))}
      </div>
      <StudioProfilePagination
        locale={locale}
        page={safePage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
}

/** Portfolio grid for public pages and marketing home. */
export function CreatorPortfolioWorksGrid({
  locale,
  works,
  activeWorkId,
  engagement,
  isLoggedIn,
  empty,
  onActivate,
  creatorByWorkId,
  columns = 3
}: {
  locale: Locale;
  works: CreatorWork[];
  activeWorkId: string | null;
  engagement: Record<string, WorkEngagementSnapshot>;
  isLoggedIn: boolean;
  empty: ReactNode;
  onActivate: (work: CreatorWork) => void;
  creatorByWorkId?: Record<string, { name: string; href: string }>;
  columns?: 3 | 4;
}) {
  if (!works.length) {
    return (
      <div className="mt-10 rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-16 text-center text-zinc-500">
        {empty}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2",
        columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
      )}
    >
      {works.map((work) => {
        const creator = creatorByWorkId?.[work.id];
        return (
          <PortfolioWorkCard
            key={work.id}
            locale={locale}
            work={work}
            engagement={engagement[work.id] ?? fallbackEngagement(work.id)}
            isLoggedIn={isLoggedIn}
            isActive={activeWorkId === work.id}
            creatorName={creator?.name}
            creatorHref={creator?.href}
            onActivate={() => onActivate(work)}
          />
        );
      })}
    </div>
  );
}

/** @deprecated Use CreatorPortfolioWorksGrid. */
export function CreatorWorksGrid({
  locale = "en",
  works,
  activeWorkId,
  selectedWorkId,
  empty,
  onActivate,
  onExpand,
  ownerActions
}: {
  locale?: Locale;
  works: CreatorWork[];
  activeWorkId: string | null;
  selectedWorkId?: string;
  empty: ReactNode;
  onActivate: (work: CreatorWork) => void;
  onExpand: (work: CreatorWork) => void;
  ownerActions?: {
    onHide: (work: CreatorWork) => void;
    onShow: (work: CreatorWork) => void;
    onDelete: (work: CreatorWork) => void;
    labels: {
      hide: string;
      show: string;
      delete: string;
      hidden: string;
    };
  };
}) {
  if (!works.length) {
    return (
      <div className="mt-10 rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-16 text-center text-zinc-500">
        {empty}
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-5">
      {works.map((work) => (
        <WorkGridTile
          key={work.id}
          videoUrl={work.video_url}
          thumbnailUrl={work.thumbnail_url}
          title={work.title}
          platform={labelPlatform(work.platform, locale)}
          isActive={activeWorkId === work.id}
          isHidden={Boolean(work.hidden)}
          ownerActions={
            ownerActions
              ? {
                  onHide: () => ownerActions.onHide(work),
                  onShow: () => ownerActions.onShow(work),
                  onDelete: () => ownerActions.onDelete(work),
                  hideLabel: ownerActions.labels.hide,
                  showLabel: ownerActions.labels.show,
                  deleteLabel: ownerActions.labels.delete,
                  hiddenLabel: ownerActions.labels.hidden
                }
              : undefined
          }
          onActivate={() => onActivate(work)}
          onExpand={() => onExpand(work)}
          className={cn(
            "rounded-[20px] shadow-sm ring-1 ring-zinc-200/80 transition hover:shadow-md",
            selectedWorkId === work.id ? "ring-2 ring-zinc-900" : undefined
          )}
        />
      ))}
    </div>
  );
}

export function CreatorAboutPanel({
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
      <div className="rounded-[24px] border border-zinc-200/80 bg-white p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-900">{title}</h2>
        <p className="mt-4 text-[15px] leading-8 text-zinc-600">{bio || "—"}</p>
      </div>
      <div className="grid gap-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-[20px] border border-zinc-200/80 bg-white px-5 py-4">
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">{row.label}</div>
            {row.isLink ? (
              <a
                href={row.value}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block break-all text-sm font-medium text-zinc-900 hover:underline"
              >
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
