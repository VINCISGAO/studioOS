"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clapperboard, Inbox, Sparkles } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { CreatorHomeMessageRow, CreatorPhaseCount } from "@/lib/studioos/creator-home-ui";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { cn } from "@/lib/utils";

function brandInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "B";
}

const phaseIcons = [Inbox, Clapperboard, Sparkles, CheckCircle2];

export function CreatorHomeBottomPanels({
  locale,
  phases,
  messages
}: {
  locale: Locale;
  phases: CreatorPhaseCount;
  messages: CreatorHomeMessageRow[];
}) {
  const phaseValues = [phases.invitations, phases.production, phases.review, phases.completed];
  const labels =
    locale === "zh"
      ? ["项目邀请", "制作中", "审核交付", "已完成"]
      : ["Invitations", "Production", "Review", "Completed"];
  const messagesHref = withLocale(creatorPortalRoutes.messages, locale);

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-950">
          {locale === "zh" ? "项目阶段概览" : "Project phases"}
        </h2>
        <div className="mt-6 grid grid-cols-4 gap-2">
          {labels.map((label, index) => {
            const Icon = phaseIcons[index];
            const active = index === 0;
            return (
              <div key={label} className="relative text-center">
                {index < labels.length - 1 ? (
                  <span className="absolute left-[calc(50%+20px)] top-5 hidden h-px w-[calc(100%-40px)] bg-zinc-200 sm:block" />
                ) : null}
                <div
                  className={cn(
                    "relative mx-auto flex h-10 w-10 items-center justify-center rounded-full border",
                    active
                      ? "border-violet-200 bg-violet-600 text-white shadow-sm"
                      : "border-zinc-200 bg-white text-zinc-500"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-3 text-xs font-medium text-zinc-700">{label}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-950">
                  {phaseValues[index]} {locale === "zh" ? "个项目" : "projects"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-950">
            {locale === "zh" ? "近期消息" : "Recent messages"}
          </h2>
          <Link href={messagesHref} className="text-sm font-medium text-violet-600 hover:text-violet-700">
            {locale === "zh" ? "查看全部" : "View all"} <ArrowRight className="ml-1 inline h-4 w-4" />
          </Link>
        </div>
        <ul className="space-y-1">
          {messages.map((message) => (
            <li key={message.id}>
              <Link
                href={message.href}
                className="flex items-start gap-3 rounded-xl px-2 py-3 transition hover:bg-zinc-50"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                    message.brandTone ?? "bg-zinc-900"
                  )}
                >
                  {brandInitial(message.brand)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm text-zinc-700">{message.preview}</p>
                    <span className="shrink-0 text-xs text-zinc-400">{message.time}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-2 border-t border-zinc-100 pt-3">
          <Link href={messagesHref} className="text-sm font-medium text-violet-600 hover:text-violet-700">
            {locale === "zh" ? "全部消息" : "All messages"} <ArrowRight className="ml-1 inline h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
