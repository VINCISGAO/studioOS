import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { aiSupportConversationService } from "@/features/ai-support/conversation.service";
import { adminSupportService } from "@/features/admin/support/admin-support.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const user = await getAdminSessionUser();
  const overview = user ? await adminSupportService.getOverview(user) : { openItems: 0 };
  const conversations =
    user && (user.role === "ADMIN" || user.role === "SUPPORT" || user.role === "SYSTEM")
      ? await aiSupportConversationService.listConversations({
          limit: 8
        })
      : [];

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Support</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {locale === "zh" ? "争议、退款与 Brand / Studio 支持工单。" : "Disputes, refunds, and brand/studio support."}
      </p>
      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-6">
          <p className="text-sm text-zinc-500">{locale === "zh" ? "待处理事项" : "Open items"}</p>
          <p className="mt-2 text-4xl font-semibold">{overview.openItems}</p>
          <div className="mt-6 flex gap-3">
            <Link
              href={withLocale("/admin/disputes", locale)}
              className="text-sm font-medium text-zinc-900 hover:underline"
            >
              {locale === "zh" ? "争议与退款" : "Disputes & refunds"} →
            </Link>
          </div>
        </CardContent>
      </Card>
      <Card className="mt-6 border-zinc-200/80 shadow-none">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-zinc-950">
                {locale === "zh" ? "AI 客服会话" : "AI support conversations"}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {locale === "zh" ? "真实数据库会话，支持人工接管查看。" : "Database-backed conversations ready for human handoff."}
              </p>
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
                        {latest?.content ?? (locale === "zh" ? "暂无消息" : "No messages yet")}
                      </p>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {conversation.assignedAgent?.fullName ?? (locale === "zh" ? "未分配" : "Unassigned")}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-sm text-zinc-500">
                {locale === "zh" ? "暂无 AI 客服会话。" : "No AI support conversations yet."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
