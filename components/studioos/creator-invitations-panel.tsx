import Link from "next/link";
import { Check, Clock, X } from "lucide-react";
import { acceptCreatorInvitationAction } from "@/app/creator-portal-actions";
import { Button } from "@/components/ui/button";
import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { formatCurrency } from "@/lib/utils";

const copy = {
  en: {
    title: "Project invitations",
    accept: "Accept",
    decline: "Decline",
    reviewDecline: "Review",
    match: "Match",
    expires: "Expires",
    empty: "No pending invitations.",
    budget: "Budget",
    deadline: "Deadline"
  },
  zh: {
    title: "项目邀请",
    accept: "接受",
    decline: "拒绝",
    reviewDecline: "去处理",
    match: "匹配度",
    expires: "过期",
    empty: "暂无待处理邀请。",
    budget: "预算",
    deadline: "截止日期"
  }
};

function formatDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function CreatorInvitationsPanel({
  locale,
  invitations,
  compact = false
}: {
  locale: Locale;
  invitations: CreatorPortalInvitationView[];
  compact?: boolean;
}) {
  const t = copy[locale];

  if (!invitations.length) {
    return compact ? null : (
      <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-10 text-center text-sm text-zinc-500">
        {t.empty}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {!compact ? <h2 className="text-lg font-semibold text-zinc-950">{t.title}</h2> : null}
      <ul className="space-y-3">
        {invitations.map((invitation) => (
          <li
            key={invitation.id}
            className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                  {invitation.brandName}
                </p>
                <h3 className="mt-1 truncate text-base font-semibold text-zinc-950">{invitation.title}</h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
                  <span>
                    {t.budget}: {formatCurrency(invitation.budget)} {invitation.currency}
                  </span>
                  <span>
                    {t.deadline}: {formatDate(invitation.deadline, locale)}
                  </span>
                  <span>
                    {t.match}: {Math.round(invitation.matchScore)}%
                  </span>
                  {invitation.expiresAt ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {t.expires}: {formatDate(invitation.expiresAt, locale)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <form action={acceptCreatorInvitationAction}>
                  <input type="hidden" name="lang" value={locale} />
                  <input type="hidden" name="invitationId" value={invitation.id} />
                  <Button type="submit" size="sm" className="rounded-xl bg-indigo-600">
                    <Check className="h-4 w-4" />
                    {t.accept}
                  </Button>
                </form>
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <Link href={withLocale(creatorPortalRoutes.invitations, locale)}>
                    <X className="h-4 w-4" />
                    {t.reviewDecline}
                  </Link>
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
