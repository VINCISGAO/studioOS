"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { Locale } from "@/lib/i18n";
import {
  BRAND_TEAM_PAGE_SIZE,
  brandTeamMemberAvatarTone,
  brandTeamMemberInitials,
  brandTeamRoleLabel,
  brandTeamStatusLabel,
  filterBrandTeamMembers,
  formatBrandTeamJoinDate,
  type BrandTeamMember,
  type BrandTeamRole
} from "@/lib/studioos/brand-team-ui";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, Search } from "lucide-react";

const copy = {
  zh: {
    title: "团队成员",
    invite: "邀请成员",
    search: "搜索成员姓名、邮箱或角色",
    allRoles: "全部角色",
    member: "成员",
    role: "角色",
    joined: "加入时间",
    status: "状态",
    actions: "操作",
    empty: "没有匹配的成员。"
  },
  en: {
    title: "Team members",
    invite: "Invite member",
    search: "Search by name, email, or role",
    allRoles: "All roles",
    member: "Member",
    role: "Role",
    joined: "Joined",
    status: "Status",
    actions: "Actions",
    empty: "No members match your filters."
  }
} as const;

const roleFilterOptions: Array<BrandTeamRole | "all"> = [
  "all",
  "admin",
  "ad_manager",
  "creative",
  "review_viewer",
  "finance_viewer",
  "member"
];

function StatusBadge({ status, locale }: { status: BrandTeamMember["status"]; locale: Locale }) {
  const active = status === "active";
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-zinc-700">
      <span
        className={cn("h-2 w-2 rounded-full", active ? "bg-emerald-500" : "bg-amber-500")}
        aria-hidden
      />
      {brandTeamStatusLabel(status, locale)}
    </span>
  );
}

export function BrandTeamMemberPanel({
  locale,
  members,
  onInviteClick
}: {
  locale: Locale;
  members: BrandTeamMember[];
  onInviteClick: () => void;
}) {
  const t = copy[locale];
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<BrandTeamRole | "all">("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => filterBrandTeamMembers(members, query, roleFilter, locale),
    [members, query, roleFilter, locale]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / BRAND_TEAM_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * BRAND_TEAM_PAGE_SIZE,
    currentPage * BRAND_TEAM_PAGE_SIZE
  );

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updateRoleFilter(value: BrandTeamRole | "all") {
    setRoleFilter(value);
    setPage(1);
  }

  return (
    <section className="overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-zinc-950">{t.title}</h2>
        <Button
          type="button"
          onClick={onInviteClick}
          className="h-9 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          {t.invite}
        </Button>
      </div>

      <div className="flex flex-col gap-3 border-b border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder={t.search}
            className="h-10 rounded-lg border-zinc-200 pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(value) => updateRoleFilter(value as BrandTeamRole | "all")}>
          <SelectTrigger className="h-10 w-full rounded-lg border-zinc-200 sm:w-[160px]">
            <SelectValue placeholder={t.allRoles} />
          </SelectTrigger>
          <SelectContent>
            {roleFilterOptions.map((role) => (
              <SelectItem key={role} value={role}>
                {brandTeamRoleLabel(role, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-5 text-xs font-medium text-zinc-500 sm:px-6">{t.member}</TableHead>
            <TableHead className="text-xs font-medium text-zinc-500">{t.role}</TableHead>
            <TableHead className="text-xs font-medium text-zinc-500">{t.joined}</TableHead>
            <TableHead className="text-xs font-medium text-zinc-500">{t.status}</TableHead>
            <TableHead className="px-5 text-right text-xs font-medium text-zinc-500 sm:px-6">
              {t.actions}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.length ? (
            pageItems.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="px-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        brandTeamMemberAvatarTone(member.id)
                      )}
                    >
                      {brandTeamMemberInitials(member.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-950">{member.name}</p>
                      <p className="truncate text-xs text-zinc-500">{member.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-zinc-700">
                  {brandTeamRoleLabel(member.role, locale)}
                </TableCell>
                <TableCell className="text-sm text-zinc-600">
                  {formatBrandTeamJoinDate(member.joinedAt, locale)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={member.status} locale={locale} />
                </TableCell>
                <TableCell className="px-5 text-right sm:px-6">
                  <button
                    type="button"
                    aria-label={t.actions}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-600"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="px-6 py-16 text-center text-sm text-zinc-500">
                {t.empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {filtered.length > 0 ? (
        <div className="flex items-center justify-center gap-1 border-t border-zinc-100 px-4 py-4">
          <button
            type="button"
            aria-label={locale === "zh" ? "上一页" : "Previous page"}
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-medium",
                pageNumber === currentPage
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              )}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            aria-label={locale === "zh" ? "下一页" : "Next page"}
            disabled={currentPage >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
