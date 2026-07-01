"use client";

import { useRef, useState, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { Locale } from "@/lib/i18n";
import {
  BRAND_TEAM_INVITE_LINK,
  brandTeamInviteRoleOptions,
  brandTeamRoleLabel,
  buildBrandTeamRoleGuides,
  type BrandTeamRole,
  type BrandTeamRoleGuide
} from "@/lib/studioos/brand-team-ui";
import { cn } from "@/lib/utils";
import { Eye, Link2, Pencil, User, Users, Wallet } from "lucide-react";

const copy = {
  zh: {
    inviteTitle: "邀请成员",
    inviteBody: "发送邀请链接，成员加入后即可访问项目。",
    email: "输入邮箱地址",
    sendInvite: "发送邀请",
    copyLink: "复制邀请链接",
    copied: "已复制邀请链接",
    sent: "邀请已发送",
    permissionsTitle: "团队权限说明"
  },
  en: {
    inviteTitle: "Invite member",
    inviteBody: "Send an invite link — teammates can access projects after joining.",
    email: "Enter email address",
    sendInvite: "Send invite",
    copyLink: "Copy invite link",
    copied: "Invite link copied",
    sent: "Invite sent",
    permissionsTitle: "Role permissions"
  }
} as const;

function RoleGuideIcon({ icon }: { icon: BrandTeamRoleGuide["icon"] }) {
  const className = "h-4 w-4 text-zinc-500";
  switch (icon) {
    case "users":
      return <Users className={className} />;
    case "user":
      return <User className={className} />;
    case "pencil":
      return <Pencil className={className} />;
    case "eye":
      return <Eye className={className} />;
    case "wallet":
      return <Wallet className={className} />;
  }
}

export function BrandTeamSidebar({
  locale,
  inviteEmailRef
}: {
  locale: Locale;
  inviteEmailRef?: RefObject<HTMLInputElement | null>;
}) {
  const t = copy[locale];
  const localEmailRef = useRef<HTMLInputElement>(null);
  const emailRef = inviteEmailRef ?? localEmailRef;
  const [inviteRole, setInviteRole] = useState<BrandTeamRole>("member");
  const [feedback, setFeedback] = useState<string | null>(null);
  const guides = buildBrandTeamRoleGuides(locale);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2400);
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(BRAND_TEAM_INVITE_LINK);
      showFeedback(t.copied);
    } catch {
      showFeedback(t.copied);
    }
  }

  function sendInvite() {
    showFeedback(t.sent);
    if (emailRef.current) {
      emailRef.current.value = "";
    }
  }

  return (
    <aside className="space-y-4">
      <section className="rounded-[20px] border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6">
        <h2 className="text-base font-semibold text-zinc-950">{t.inviteTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t.inviteBody}</p>

        <div className="mt-4 space-y-3">
          <Input
            ref={emailRef}
            type="email"
            placeholder={t.email}
            className="h-10 rounded-lg border-zinc-200"
          />
          <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as BrandTeamRole)}>
            <SelectTrigger className="h-10 rounded-lg border-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {brandTeamInviteRoleOptions.map((role) => (
                <SelectItem key={role} value={role}>
                  {brandTeamRoleLabel(role, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            onClick={sendInvite}
            className="h-10 w-full rounded-lg bg-violet-600 text-sm font-medium text-white hover:bg-violet-700"
          >
            {t.sendInvite}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => void copyInviteLink()}
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 text-sm font-medium text-violet-600 transition hover:text-violet-700"
        >
          <Link2 className="h-4 w-4" />
          {t.copyLink}
        </button>

        {feedback ? (
          <p className="mt-3 text-center text-xs font-medium text-emerald-600" role="status">
            {feedback}
          </p>
        ) : null}
      </section>

      <section className="rounded-[20px] border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6">
        <h2 className="text-base font-semibold text-zinc-950">{t.permissionsTitle}</h2>
        <ul className="mt-4 space-y-4">
          {guides.map((guide) => (
            <li key={guide.role} className="flex gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-50">
                <RoleGuideIcon icon={guide.icon} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900">{guide.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{guide.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

export function BrandTeamRolesPanel({ locale }: { locale: Locale }) {
  const guides = buildBrandTeamRoleGuides(locale);
  const title = locale === "zh" ? "角色与权限" : "Roles & permissions";
  const subtitle =
    locale === "zh"
      ? "为不同岗位分配合适权限，确保 Campaign、审片与财务数据安全可控。"
      : "Assign the right access for each role across campaigns, review, and billing.";

  return (
    <section className="rounded-[20px] border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6">
      <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">{subtitle}</p>
      <ul className="mt-6 divide-y divide-zinc-100">
        {guides.map((guide) => (
          <li key={guide.role} className="flex gap-4 py-4 first:pt-0 last:pb-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-50">
              <RoleGuideIcon icon={guide.icon} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-950">{guide.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">{guide.description}</p>
            </div>
            <span
              className={cn(
                "hidden shrink-0 self-start rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex",
                guide.role === "admin"
                  ? "bg-violet-50 text-violet-700"
                  : "bg-zinc-100 text-zinc-600"
              )}
            >
              {brandTeamRoleLabel(guide.role, locale)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
