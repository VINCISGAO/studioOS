import { getAppUiLocale } from "@/lib/app-language";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { aiSupportConversationService } from "@/features/ai-support/conversation.service";
import { adminSupportService } from "@/features/admin/support/admin-support.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams, withLocale } from "@/lib/i18n";

const copy = {
  en: {
    title: "Support",
    subtitle: "Disputes, refunds, and brand or creator support tickets.",
    openItems: "Open items",
    disputes: "Disputes & refunds",
    aiConversations: "AI support conversations",
    aiSubtitle: "Database-backed conversations ready for human handoff.",
    noMessages: "No messages yet",
    unassigned: "Unassigned",
    empty: "No AI support conversations yet."
  },
  zh: {
    title: "支持",
    subtitle: "争议、退款与品牌方或创作者支持工单。",
    openItems: "待处理事项",
    disputes: "争议与退款",
    aiConversations: "智能客服会话",
    aiSubtitle: "真实数据库会话，支持人工接管查看。",
    noMessages: "暂无消息",
    unassigned: "未分配",
    empty: "暂无智能客服会话。"
  }
} as const;

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const user = await getAdminSessionUser();
  const overview = user ? await adminSupportService.getOverview(user) : { openItems: 0 };
  const conversations = user
    ? await aiSupportConversationService.listConversations({
        limit: 8
      })
    : [];

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-2 text-sm text-zinc-500">{t.subtitle}</p>
      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-6">
          <p className="text-sm text-zinc-500">{t.openItems}</p>
          <p className="mt-2 text-4xl font-semibold">{overview.openItems}</p>
          <div className="mt-6 flex gap-3">
            <Link
              href={withLocale("/admin/disputes", locale)}
              className="text-sm font-medium text-zinc-900 hover:underline"
            >
              {t.disputes} →
            </Link>
          </div>
        </CardContent>
      </Card>
      <Card className="mt-6 border-zinc-200/80 shadow-none">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-zinc-950">{t.aiConversations}</p>
              <p className="mt-1 text-sm text-zinc-500">{t.aiSubtitle}</p>
            </div>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
              {conversations.length}
            </span>
          </div>
          <div className="mt-5 divide-y divide-zinc-100">
            {conversations.length ? (
              conversations.map((conversation) => {
                const latest = conversation.messages[0];
                return (
                  <div key={conversation.id} className="grid gap-2 py-4 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-zinc-950">{conversation.creator.displayName}</p>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                          {conversation.status}
                        </span>
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                          {conversation.channel}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-zinc-500">
                        {latest?.content ?? t.noMessages}
                      </p>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {conversation.assignedAgent?.fullName ?? t.unassigned}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-sm text-zinc-500">{t.empty}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
