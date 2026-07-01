"use client";

import type { ReactNode } from "react";
import {
  BadgeCheck,
  Clapperboard,
  Clock3,
  DollarSign,
  MapPin,
  Star
} from "lucide-react";
import { CreatorAvatar, CreatorEditableAvatar } from "@/components/creator/creator-profile-ui";
import type { WorksHeroStat } from "@/lib/studioos/creator-works-ui";
import { cn } from "@/lib/utils";

const iconTone: Record<WorksHeroStat["icon"], string> = {
  works: "bg-violet-50 text-violet-600",
  turnaround: "bg-blue-50 text-blue-600",
  price: "bg-emerald-50 text-emerald-600",
  rating: "bg-amber-50 text-amber-500",
  location: "bg-violet-50 text-violet-600"
};

function StatIcon({ icon }: { icon: WorksHeroStat["icon"] }) {
  const className = "h-4 w-4";
  switch (icon) {
    case "works":
      return <Clapperboard className={className} />;
    case "turnaround":
      return <Clock3 className={className} />;
    case "price":
      return <DollarSign className={className} />;
    case "rating":
      return <Star className={cn(className, "fill-amber-400 text-amber-400")} />;
    case "location":
      return <MapPin className={className} />;
  }
}

export function StudioWorksProfileHero({
  name,
  headline,
  initials,
  avatarUrl,
  avatarEditable = false,
  avatarUploading = false,
  editAvatarLabel,
  onAvatarUpload,
  tags,
  stats,
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
  tags: string[];
  stats: WorksHeroStat[];
  verified?: boolean;
  actions: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
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
                <h2 className="truncate text-2xl font-semibold tracking-tight text-zinc-950">{name}</h2>
                {verified ? <BadgeCheck className="h-5 w-5 shrink-0 text-blue-600" strokeWidth={2.2} /> : null}
              </div>
              {headline ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{headline}</p>
              ) : null}
              {tags.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">{actions}</div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-5 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className="flex items-start gap-3 lg:border-l lg:border-zinc-100 lg:pl-5 first:lg:border-l-0 first:lg:pl-0"
            >
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconTone[stat.icon])}>
                <StatIcon icon={stat.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">{stat.label}</p>
                <p className="mt-0.5 text-lg font-semibold tracking-tight text-zinc-950">{stat.value}</p>
                {stat.subtext ? <p className="mt-0.5 text-xs text-zinc-400">{stat.subtext}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
