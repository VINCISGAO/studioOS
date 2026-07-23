"use client";

import Image from "next/image";
import Link from "next/link";
import { creatorAvatarTone, creatorInitials } from "@/lib/studioos/creator-display";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { profileImageClassName } from "@/lib/studioos/profile-image-styles";
import { cn } from "@/lib/utils";

export function BrandCreatorAvatarLink({
  locale,
  creatorId,
  creatorName,
  avatarUrl,
  size = "md",
  className
}: {
  locale: Locale;
  creatorId: string;
  creatorName: string;
  avatarUrl?: string | null;
  size?: "md" | "lg";
  className?: string;
}) {
  const dim = size === "lg" ? "h-14 w-14 text-sm" : "h-11 w-11 text-xs";
  const href = withLocale(`/creators/${creatorId}`, locale);
  const initials = creatorInitials(creatorName, creatorId);
  const tone = creatorAvatarTone(creatorId);
  const resolvedAvatar = avatarUrl?.trim() || null;

  return (
    <Link
      href={href}
      aria-label={locale === "zh" ? `查看 ${creatorName} 的主页` : `View ${creatorName}'s profile`}
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-200/80 transition hover:ring-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
        dim,
        className
      )}
    >
      {resolvedAvatar ? (
        <Image
          src={resolvedAvatar}
          alt=""
          fill
          className={profileImageClassName("photo")}
          sizes={size === "lg" ? "56px" : "44px"}
          unoptimized
        />
      ) : (
        <span className={cn("flex h-full w-full items-center justify-center font-semibold", tone)}>
          {initials}
        </span>
      )}
    </Link>
  );
}
