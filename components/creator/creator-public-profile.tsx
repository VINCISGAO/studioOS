"use client";

import { WorkCoverImage } from "@/components/creator/work-cover-image";
import { WorkVideoPlayer } from "@/components/creator/work-video-player";
import {
  CreatorAboutPanel,
  CreatorPortfolioWorksGrid,
  CreatorProfileHero,
  CreatorProfileTabs
} from "@/components/creator/creator-profile-ui";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Mail, MessageCircle, Pencil, UserRound } from "lucide-react";
import { submitInquiryAction } from "@/app/actions";
import { syncWorksAction } from "@/app/creator-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  mergeCreatorProfile,
  mergeCreatorWorks,
  readProfileDraft,
  readWorksDraft
} from "@/lib/creator-profile-storage";
import { canEmbedVideo, resolveWorkThumbnail, sanitizeVideoUrl } from "@/lib/media-url";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  labelCountry,
  labelDeliverySpeed,
  labelPlatform,
  labelTurnaround,
  labelVideoFormat,
  labelWorkCategory
} from "@/lib/localized-options";
import { tCertified } from "@/lib/studioos/deposit-copy";
import {
  creatorMinBudgetAboutLabel,
  creatorMinBudgetLabel,
  normalizeCreatorMinBudget
} from "@/lib/studioos/creator-price-preference";
import type { Creator, CreatorWork } from "@/lib/types";
import type { WorkEngagementSnapshot } from "@/lib/work-engagement-utils";

type CreatorPublicProfileProps = {
  locale: Locale;
  baseCreator: Creator;
  baseWorks: CreatorWork[];
  engagement: Record<string, WorkEngagementSnapshot>;
  isLoggedIn: boolean;
  isOwner: boolean;
  selectedWorkId?: string;
  copy: {
    profile: string;
    works: string;
    posts: string;
    about: string;
    inquiry: string;
    inquiryBody: string;
    fields: {
      budget: string;
      message: string;
    };
    submit: string;
    chatHint: string;
    quote: string;
    customQuote: string;
    turnaround: string;
    deposit: string;
    editProfile: string;
    preview: string;
    openOriginal: string;
    empty: string;
    viewStudio: string;
  };
};

export function CreatorPublicProfile({
  locale,
  baseCreator,
  baseWorks,
  engagement,
  isLoggedIn,
  isOwner,
  selectedWorkId,
  copy: t
}: CreatorPublicProfileProps) {
  const [creator, setCreator] = useState(baseCreator);
  const [works, setWorks] = useState(baseWorks);
  const [tab, setTab] = useState<"posts" | "about">("posts");
  const [previewWork, setPreviewWork] = useState<CreatorWork | null>(null);
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null);
  const selectedWork = works.find((work) => work.id === selectedWorkId) ?? works[0];

  useEffect(() => {
    const profileDraft = readProfileDraft(baseCreator.id);
    const worksDraft = readWorksDraft(baseCreator.id);
    setCreator(mergeCreatorProfile(baseCreator, profileDraft));
    setWorks(mergeCreatorWorks(baseWorks, worksDraft));
  }, [baseCreator, baseWorks]);

  useEffect(() => {
    if (!isOwner) {
      return;
    }

    const worksDraft = readWorksDraft(baseCreator.id);
    if (!worksDraft?.length) {
      return;
    }

    const formData = new FormData();
    formData.set("works", JSON.stringify(worksDraft));
    void syncWorksAction(formData);
  }, [baseCreator.id, isOwner]);

  useEffect(() => {
    if (!selectedWorkId) {
      return;
    }

    const work = works.find((item) => item.id === selectedWorkId);
    if (work) {
      setPreviewWork(work);
    }
  }, [selectedWorkId, works]);

  const initials = useMemo(
    () =>
      creator.name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join(""),
    [creator.name]
  );

  const minBudgetStat = useMemo(() => {
    const min = normalizeCreatorMinBudget(creator.min_project_budget_usd ?? 0);
    if (!min) return null;
    return creatorMinBudgetLabel(min, locale);
  }, [creator.min_project_budget_usd, locale]);

  function handleActivateWork(work: CreatorWork) {
    if (canEmbedVideo(sanitizeVideoUrl(work.video_url))) {
      setActiveWorkId(work.id);
      return;
    }

    setPreviewWork(work);
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <CreatorProfileHero
        name={creator.name}
        headline={creator.headline}
        initials={initials}
        avatarUrl={creator.avatar_url}
        coverUrl={creator.cover_url}
        stats={[
          { label: t.posts, value: String(works.length) },
          { label: t.turnaround, value: labelDeliverySpeed(creator.delivery_speed, locale) },
          ...(minBudgetStat
            ? [{ label: locale === "zh" ? "商单预算" : "Min. project budget", value: minBudgetStat }]
            : [])
        ]}
        rating={creator.rating}
        country={labelCountry(creator.country, locale)}
        depositNote={creator.deposit_status === "paid" ? tCertified(locale).profileBadge : undefined}
        actions={
          isOwner ? (
            <Button asChild variant="outline" className="h-11 rounded-full px-6 sm:w-auto">
              <Link href={withLocale("/creator/profile", locale)}>
                <Pencil className="h-4 w-4" /> {t.editProfile}
              </Link>
            </Button>
          ) : (
            <Button asChild className="h-11 rounded-full px-6 sm:w-auto">
              <a href="#inquiry">
                <Mail className="h-4 w-4" /> {t.inquiry}
              </a>
            </Button>
          )
        }
      />

      <div className="mt-8">
        <CreatorProfileTabs
          active={tab}
          onChange={(id) => setTab(id as "posts" | "about")}
          tabs={[
            { id: "posts", label: t.works },
            { id: "about", label: t.about }
          ]}
        />

        {tab === "posts" ? (
          <CreatorPortfolioWorksGrid
            locale={locale}
            works={works}
            activeWorkId={activeWorkId}
            engagement={engagement}
            isLoggedIn={isLoggedIn}
            empty={t.empty}
            onActivate={handleActivateWork}
          />
        ) : (
          <CreatorAboutPanel
            title={t.about}
            bio={creator.bio}
            rows={[
              { label: locale === "zh" ? "国家 / 地区" : "Country", value: labelCountry(creator.country, locale) },
              { label: locale === "zh" ? "擅长方向" : "Specialties", value: creator.specialties.join(", ") },
              { label: locale === "zh" ? "制作工具" : "Tools", value: creator.tools.join(", ") },
              {
                label: locale === "zh" ? "商单价格意愿" : "Min. project budget",
                value: creatorMinBudgetAboutLabel(creator.min_project_budget_usd, locale)
              },
              { label: locale === "zh" ? "作品集" : "Portfolio", value: creator.portfolio_url, isLink: true }
            ]}
          />
        )}
      </div>

      {!isOwner ? (
        <section
          id="inquiry"
          className="mt-14 scroll-mt-24 rounded-[28px] border border-zinc-200/80 bg-zinc-50/50 p-6 sm:p-8"
        >
          <h2 className="text-xl font-semibold tracking-[-0.02em]">{t.inquiry}</h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-7 text-zinc-500">{t.inquiryBody}</p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-700">
            <MessageCircle className="h-4 w-4 shrink-0" />
            {t.chatHint}
          </p>
          <form action={submitInquiryAction} className="mt-8 grid max-w-xl gap-5">
              <input type="hidden" name="lang" value={locale} />
              <input type="hidden" name="creator_id" value={creator.id} />
              <input type="hidden" name="work_id" value={selectedWork?.id ?? ""} />
              <Field
                label={t.fields.budget}
                name="budget_range"
                placeholder={locale === "zh" ? "例如 $500-$1,000" : "e.g. $500-$1,000"}
                required
              />
              <div className="grid gap-2">
                <Label htmlFor="message">{t.fields.message}</Label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder={
                    selectedWork
                      ? locale === "zh"
                        ? `例如：希望参考「${selectedWork.title}」的风格，做 3 条 TikTok 短视频。`
                        : `e.g. Three TikTok cuts inspired by "${selectedWork.title}".`
                      : locale === "zh"
                        ? "描述你要做的视频、数量、平台和交付时间。"
                        : "Describe the videos, quantity, platforms, and timeline."
                  }
                />
              </div>
            <div>
              <Button type="submit" size="lg" className="rounded-full px-8">
                <Mail className="h-4 w-4" /> {t.submit}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <Dialog open={Boolean(previewWork)} onOpenChange={(open) => !open && setPreviewWork(null)}>
        <DialogContent className="max-w-md sm:max-w-lg">
          {previewWork ? (
            <>
              <DialogHeader>
                <DialogTitle>{previewWork.title}</DialogTitle>
                <DialogDescription>{previewWork.description}</DialogDescription>
              </DialogHeader>
              <div className="relative mx-auto aspect-[9/16] max-h-[min(70vh,560px)] w-full max-w-[320px] overflow-hidden rounded-lg bg-black">
                {previewWork.video_url ? (
                  <WorkVideoPlayer
                    videoUrl={previewWork.video_url}
                    thumbnailUrl={previewWork.thumbnail_url}
                    title={previewWork.title}
                  />
                ) : (
                  <WorkCoverImage
                    src={resolveWorkThumbnail(previewWork.video_url, previewWork.thumbnail_url)}
                    alt={previewWork.title}
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{labelWorkCategory(previewWork.category, locale)}</Badge>
                <Badge variant="secondary">{labelPlatform(previewWork.platform, locale)}</Badge>
                <Badge variant="secondary">{labelVideoFormat(previewWork.format, locale)}</Badge>
                <Badge variant="outline">
                  {t.turnaround}: {labelTurnaround(previewWork.turnaround, locale)}
                </Badge>
              </div>
              <div className="grid gap-2">
                {!isOwner ? (
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href={withLocale(`/creators/${creator.id}`, locale)}>
                      <UserRound className="h-4 w-4" />
                      {t.viewStudio}: {creator.name}
                    </Link>
                  </Button>
                ) : null}
                {!isOwner ? (
                  <Button asChild>
                    <a href="#inquiry" onClick={() => setPreviewWork(null)}>
                      <Mail className="h-4 w-4" /> {t.inquiry}
                    </a>
                  </Button>
                ) : null}
                {previewWork.video_url && !canEmbedVideo(previewWork.video_url) ? (
                  <Button asChild variant="outline">
                    <a href={previewWork.video_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" /> {t.openOriginal}
                    </a>
                  </Button>
                ) : previewWork.video_url ? (
                  <p className="text-center text-xs text-muted-foreground">
                    <a
                      href={previewWork.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> {t.openOriginal}
                    </a>
                  </p>
                ) : null}
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
  name,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const id = name;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} {...props} />
    </div>
  );
}
