import { getAppUiLocale } from "@/lib/app-language";
import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { AdminPageActionLink, AdminPageShell } from "@/components/studioos/admin-page-shell";
import { adminDatabaseService } from "@/features/admin/database/admin-database.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type Locale, type SearchParams } from "@/lib/i18n";
import { adminConversationStatusLabel, adminUserRoleLabel } from "@/lib/studioos/admin-enum-labels";

const copy = {
  en: {
    eyebrow: "Database Binding",
    title: "Phase 1 DB overview",
    subtitle: "Core module counts and recent records from the production database.",
    disabled: "Sign in as admin with DATABASE_URL configured.",
    back: "Back to overview",
    modules: "Core modules",
    recent: "Recent records",
    users: "Users",
    campaigns: "Campaigns",
    orders: "Orders",
    conversations: "Conversations"
  },
  zh: {
    eyebrow: "数据库绑定",
    title: "Phase 1 数据库总览",
    subtitle: "生产数据库核心模块统计与最近记录。",
    disabled: "请使用管理员账号登录，并确保 DATABASE_URL 已配置。",
    back: "返回总览",
    modules: "核心模块",
    recent: "最近数据",
    users: "用户",
    campaigns: "活动",
    orders: "订单",
    conversations: "会话"
  }
};

const moduleLabels: Record<string, Record<Locale, string>> = {
  users: { en: "Users", zh: "用户" },
  creators: { en: "Creator Profiles", zh: "创作者资料" },
  brands: { en: "Brand Profiles", zh: "品牌方资料" },
  works: { en: "Works", zh: "作品" },
  aiConfigs: { en: "AI Configs", zh: "AI 配置" },
  conversations: { en: "Conversations", zh: "会话" },
  orders: { en: "Orders", zh: "订单" },
  campaigns: { en: "Campaigns", zh: "活动" },
  attributions: { en: "Attributions", zh: "归因" },
  walletAccounts: { en: "Wallet Accounts", zh: "钱包账户" },
  ledgerEntries: { en: "Ledger Entries", zh: "账本记录" },
  withdrawalRequests: { en: "Withdrawals", zh: "提现申请" },
  referralCodes: { en: "Referral Codes", zh: "推荐码" },
  referralCommissions: { en: "Referral Commissions", zh: "推荐佣金" }
};

function shortId(id: string) {
  return id.length > 12 ? `${id.slice(0, 8)}...` : id;
}

export default async function AdminDatabasePage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const sessionUser = await getAdminSessionUser();
  const overview = sessionUser ? await adminDatabaseService.getOverview(sessionUser) : null;

  return (
    <AdminPageShell
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      actions={<AdminPageActionLink href="/admin">← {t.back}</AdminPageActionLink>}
    >
      {!overview?.enabled ? (
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-6 text-sm text-zinc-500">{t.disabled}</CardContent>
        </Card>
      ) : (
        <>
          <section className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <Database className="h-4 w-4 text-zinc-500" />
              <h2 className="text-lg font-semibold">{t.modules}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(overview.counts).map(([key, value]) => (
                <Card key={key} className="border-zinc-200/80 shadow-none">
                  <CardContent className="p-4">
                    <p className="text-xs text-zinc-500">{moduleLabels[key]?.[locale] ?? key}</p>
                    <p className="mt-2 text-2xl font-semibold">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-2">
            <Card className="border-zinc-200/80 shadow-none">
              <CardContent className="p-5">
                <h2 className="font-semibold">{t.recent}: {t.users}</h2>
                <div className="mt-4 space-y-3">
                  {overview.recent.users.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{item.email}</span>
                      <Badge variant="secondary">{adminUserRoleLabel(item.role, locale)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 shadow-none">
              <CardContent className="p-5">
                <h2 className="font-semibold">{t.recent}: {t.campaigns}</h2>
                <div className="mt-4 space-y-3">
                  {overview.recent.campaigns.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{item.title}</span>
                      <StatusBadge status={item.status} locale={locale} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 shadow-none">
              <CardContent className="p-5">
                <h2 className="font-semibold">{t.recent}: {t.orders}</h2>
                <div className="mt-4 space-y-3">
                  {overview.recent.orders.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">
                        {shortId(item.id)} · {item.serviceProject}
                      </span>
                      <span>${item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 shadow-none">
              <CardContent className="p-5">
                <h2 className="font-semibold">{t.recent}: {t.conversations}</h2>
                <div className="mt-4 space-y-3">
                  {overview.recent.conversations.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">
                        {shortId(item.id)} · {item.channel}
                      </span>
                      <Badge variant="secondary">{adminConversationStatusLabel(item.status, locale)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </AdminPageShell>
  );
}
