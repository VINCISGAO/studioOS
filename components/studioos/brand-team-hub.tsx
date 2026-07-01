"use client";

import { useRef, useState } from "react";
import { BrandTeamMemberPanel } from "@/components/studioos/brand-team-member-panel";
import { BrandTeamRolesPanel, BrandTeamSidebar } from "@/components/studioos/brand-team-sidebar";
import { BrandTeamStatCards } from "@/components/studioos/brand-team-stat-cards";
import type { Locale } from "@/lib/i18n";
import {
  buildBrandTeamStatCards,
  type BrandTeamMember,
  type BrandTeamStatCard
} from "@/lib/studioos/brand-team-ui";
import { cn } from "@/lib/utils";

type BrandTeamTab = "members" | "roles";

const copy = {
  zh: {
    title: "团队",
    subtitle: "邀请同事查看 Campaign、审片与账单。",
    membersTab: "成员管理",
    rolesTab: "角色与权限"
  },
  en: {
    title: "Team",
    subtitle: "Invite teammates to view campaigns, review cuts, and billing.",
    membersTab: "Members",
    rolesTab: "Roles & permissions"
  }
} as const;

export function BrandTeamHub({
  locale,
  members,
  statCards
}: {
  locale: Locale;
  members: BrandTeamMember[];
  statCards?: BrandTeamStatCard[];
}) {
  const t = copy[locale];
  const cards = statCards ?? buildBrandTeamStatCards(locale);
  const [tab, setTab] = useState<BrandTeamTab>("members");
  const inviteEmailRef = useRef<HTMLInputElement>(null);

  function focusInviteEmail() {
    inviteEmailRef.current?.focus();
    inviteEmailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{t.title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{t.subtitle}</p>
      </header>

      <BrandTeamStatCards cards={cards} />

      <nav
        className="flex gap-1 overflow-x-auto border-b border-zinc-200/80"
        aria-label={locale === "zh" ? "团队页签" : "Team tabs"}
      >
        {(
          [
            { id: "members" as const, label: t.membersTab },
            { id: "roles" as const, label: t.rolesTab }
          ] as const
        ).map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "relative shrink-0 px-4 py-3 text-sm font-medium transition",
                active ? "font-semibold text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              {item.label}
              {active ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-violet-600" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {tab === "members" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <BrandTeamMemberPanel locale={locale} members={members} onInviteClick={focusInviteEmail} />
          <BrandTeamSidebar locale={locale} inviteEmailRef={inviteEmailRef} />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <BrandTeamRolesPanel locale={locale} />
          <BrandTeamSidebar locale={locale} inviteEmailRef={inviteEmailRef} />
        </div>
      )}
    </div>
  );
}
