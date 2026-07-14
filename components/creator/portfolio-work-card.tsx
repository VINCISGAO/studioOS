"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { WorkCoverImage } from "@/components/creator/work-cover-image";
import { WorkVideoPlayer } from "@/components/creator/work-video-player";
import type { WorkEngagementSnapshot } from "@/lib/work-engagement-utils";
import { formatEngagementCount, seedWorkDuration } from "@/lib/work-engagement-utils";
import type { CreatorWork } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { labelPlatform, labelWorkCategory } from "@/lib/localized-options";
import { canEmbedVideo, resolveWorkThumbnail, sanitizeVideoUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Heart, MoreHorizontal, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";

const cardCopy = {
  en: {
    deliveryDate: (date: string) => `Delivered ${date}`,
    loginToLike: "Account required to like"
  },
  zh: {
    deliveryDate: (date: string) => `交付日期 ${date}`,
    loginToLike: "需账号才可点赞"
  }
};

function formatDeliveryDate(iso: string, locale: Locale) {
  const date = new Date(iso);
  return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function WorkMoreMenu({
  labels,
  onHide,
  onShow,
  onDelete,
  isHidden
}: {
  labels: { hide: string; show: string; delete: string };
  onHide?: () => void;
  onShow?: () => void;
  onDelete?: () => void;
  isHidden?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onPointerDown);
      return () => document.removeEventListener("mousedown", onPointerDown);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="More"
        className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
          {isHidden ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              onClick={(event) => {
                event.stopPropagation();
                onShow?.();
                setOpen(false);
              }}
            >
              <Eye className="h-3.5 w-3.5" />
              {labels.show}
            </button>
          ) : (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              onClick={(event) => {
                event.stopPropagation();
                onHide?.();
                setOpen(false);
              }}
            >
              <EyeOff className="h-3.5 w-3.5" />
              {labels.hide}
            </button>
          )}
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            onClick={(event) => {
              event.stopPropagation();
              onDelete?.();
              setOpen(false);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {labels.delete}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function WorkLikeButton({
  workId,
  locale,
  isLoggedIn,
  engagement,
  redirectToLoginOnLike = true
}: {
  workId: string;
  locale: Locale;
  isLoggedIn: boolean;
  engagement: WorkEngagementSnapshot;
  redirectToLoginOnLike?: boolean;
}) {
  const router = useRouter();
  const t = cardCopy[locale];
  const [liked, setLiked] = useState(engagement.likedByMe);
  const [likeCount, setLikeCount] = useState(engagement.likeCount);
  const [pending, setPending] = useState(false);

  async function handleClick(event: React.MouseEvent) {
    event.stopPropagation();
    event.preventDefault();

    if (!isLoggedIn) {
      if (redirectToLoginOnLike) {
        router.push(withLocale("/login", locale));
      }
      return;
    }

    if (pending) {
      return;
    }

    setPending(true);
    try {
      const response = await fetch(`/api/works/${workId}/like`, { method: "POST" });
      if (response.status === 401) {
        if (redirectToLoginOnLike) {
          router.push(withLocale("/login", locale));
        }
        return;
      }
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { liked: boolean; likeCount: number };
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      title={isLoggedIn ? undefined : t.loginToLike}
      aria-pressed={liked}
      aria-label={locale === "zh" ? "点赞" : "Like"}
      disabled={pending}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition",
        liked ? "text-rose-500" : "text-zinc-500 hover:text-rose-500",
        pending && "opacity-60"
      )}
    >
      <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} />
      {formatEngagementCount(likeCount)}
    </button>
  );
}

export function PortfolioWorkCard({
  locale,
  work,
  engagement,
  isLoggedIn,
  isActive,
  viewMode = "grid",
  creatorName,
  creatorHref,
  onActivate,
  ownerActions,
  redirectToLoginOnLike = true
}: {
  locale: Locale;
  work: CreatorWork;
  engagement: WorkEngagementSnapshot;
  isLoggedIn: boolean;
  isActive?: boolean;
  viewMode?: "grid" | "list";
  creatorName?: string;
  creatorHref?: string;
  onActivate: () => void;
  ownerActions?: {
    onHide: () => void;
    onShow: () => void;
    onDelete: () => void;
    labels: { hide: string; show: string; delete: string; hidden: string };
  };
  redirectToLoginOnLike?: boolean;
}) {
  const poster = resolveWorkThumbnail(work.video_url, work.thumbnail_url);
  const platformLabel = labelPlatform(work.platform, locale);
  const deliveryDate = formatDeliveryDate(work.created_at, locale);
  const cleanUrl = sanitizeVideoUrl(work.video_url);
  const playable = canEmbedVideo(cleanUrl);
  const duration = seedWorkDuration(work.id);

  const media = (
    <div
      className={cn(
        "relative overflow-hidden bg-zinc-100",
        viewMode === "grid" ? "aspect-[16/10] w-full" : "h-24 w-40 shrink-0 rounded-xl"
      )}
    >
      {isActive && playable ? (
        <WorkVideoPlayer videoUrl={work.video_url} thumbnailUrl={work.thumbnail_url} title={work.title} />
      ) : poster ? (
        <WorkCoverImage src={poster} alt={work.title} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-xs text-zinc-500">
          {platformLabel}
        </div>
      )}
      <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
        {duration}
      </span>
      {work.hidden ? (
        <span className="absolute left-2 top-2 rounded-full bg-zinc-900/80 px-2 py-0.5 text-[10px] font-medium text-white">
          {ownerActions?.labels.hidden}
        </span>
      ) : null}
    </div>
  );

  const body = (
    <>
      <h3 className="line-clamp-1 text-[15px] font-semibold text-zinc-950">{work.title}</h3>
      <p className="mt-1 text-sm text-zinc-500">
        {platformLabel} · {work.format}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
          {labelWorkCategory(work.category, locale)}
        </span>
        <span className="text-sm text-zinc-400">{deliveryDate}</span>
      </div>
      {creatorName && creatorHref ? (
        <Link
          href={creatorHref}
          onClick={(event) => event.stopPropagation()}
          className="mt-2 inline-flex text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
        >
          {creatorName}
        </Link>
      ) : null}
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {formatEngagementCount(engagement.views)}
          </span>
          <WorkLikeButton
            workId={work.id}
            locale={locale}
            isLoggedIn={isLoggedIn}
            engagement={engagement}
            redirectToLoginOnLike={redirectToLoginOnLike}
          />
        </div>
        {ownerActions ? (
          <WorkMoreMenu
            labels={ownerActions.labels}
            isHidden={work.hidden}
            onHide={ownerActions.onHide}
            onShow={ownerActions.onShow}
            onDelete={ownerActions.onDelete}
          />
        ) : null}
      </div>
    </>
  );

  if (viewMode === "list") {
    return (
      <button
        type="button"
        onClick={onActivate}
        className="flex w-full gap-4 rounded-[20px] border border-zinc-200/80 bg-white p-3 text-left shadow-sm transition hover:border-zinc-300 hover:shadow-md"
      >
        {media}
        <div className="min-w-0 flex-1 py-1">{body}</div>
      </button>
    );
  }

  return (
    <article className="overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow-md">
      <button type="button" onClick={onActivate} className="block w-full text-left">
        {media}
      </button>
      <div className="p-4">{body}</div>
    </article>
  );
}
