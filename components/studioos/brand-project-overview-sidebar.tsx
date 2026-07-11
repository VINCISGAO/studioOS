"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import {
  MessageSquare,
  Upload
} from "lucide-react";

const copy = {
  en: {
    quickActions: "Quick actions",
    uploadVersion: "Upload new version",
    uploadHint: "Submit the latest deliverable",
    sendMessage: "Send message",
    sendHint: "Contact accepted creators"
  },
  zh: {
    quickActions: "快速操作",
    uploadVersion: "上传新版本",
    uploadHint: "提交最新作品版本",
    sendMessage: "发送消息",
    sendHint: "联系已接受的 Creator"
  }
};

export function BrandProjectOverviewSidebar({
  locale,
  projectId,
  hasDeliverables,
  canMessage
}: {
  locale: Locale;
  projectId: string;
  hasDeliverables: boolean;
  canMessage: boolean;
}) {
  const t = copy[locale];

  return (
    <aside className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-3.5">
          <h3 className="text-sm font-semibold text-zinc-950">{t.quickActions}</h3>
        </div>
        <ul className="divide-y divide-zinc-100">
          <li>
            <Link
              href={withLocale(hasDeliverables ? brandPortalRoutes.projectReview(projectId) : brandPortalRoutes.project(projectId), locale)}
              className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-zinc-50"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <Upload className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-900">{t.uploadVersion}</p>
                <p className="text-xs text-zinc-500">{t.uploadHint}</p>
              </div>
            </Link>
          </li>
          {canMessage ? (
            <li>
              <Link
                href={withLocale(`${brandPortalRoutes.messages}?tab=project`, locale)}
                className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-zinc-50"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <MessageSquare className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{t.sendMessage}</p>
                  <p className="text-xs text-zinc-500">{t.sendHint}</p>
                </div>
              </Link>
            </li>
          ) : null}
        </ul>
      </section>
    </aside>
  );
}
