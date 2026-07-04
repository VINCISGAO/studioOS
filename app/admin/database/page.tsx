import Link from "next/link";
import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { adminDatabaseService } from "@/features/admin/database/admin-database.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { isPrismaAdminRole } from "@/lib/auth/route-access";
import { getLocale, type SearchParams } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Database Binding",
    title: "Phase 1 DB overview",
    disabled: "Sign in as admin with DATABASE_URL configured.",
    back: "Back to admin",
    modules: "Core modules",
    recent: "Recent records"
  },
  zh: {
    eyebrow: "数据库绑定",
    title: "Phase 1 数据库总览",
    disabled: "请使用管理员账号登录，并确保 DATABASE_URL 已配置。",
    back: "返回后台",
    modules: "核心模块",
    recent: "最近数据"
  }
};

const moduleLabels: Record<string, string> = {
  users: "Users",
  creators: "Creator Profiles",
  brands: "Brand Profiles",
  works: "Works",
  aiConfigs: "AI Configs",
  conversations: "Conversations",
  orders: "Orders",
  campaigns: "Campaigns",
  attributions: "Attributions",
  walletAccounts: "Wallet Accounts",
  ledgerEntries: "Ledger Entries",
  withdrawalRequests: "Withdrawals",
  referralCodes: "Referral Codes",
  referralCommissions: "Referral Commissions"
};

function shortId(id: string) {
  return id.length > 12 ? `${id.slice(0, 8)}...` : id;
}

export default async function AdminDatabasePage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = getLocale(await searchParams);
  const t = copy[locale];
  const sessionUser = await getAdminSessionUser();
  const isAdmin = sessionUser ? isPrismaAdminRole(sessionUser.role) : false;
  const overview = isAdmin && sessionUser ? await adminDatabaseService.getOverview(sessionUser) : null;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{t.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t.title}</h1>
        </div>
        <Link href="/admin" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
          {t.back}
        </Link>
      </div>

      {!overview?.enabled ? (
        <Card className="mt-8 border-zinc-200/80 shadow-none">
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
                    <p className="text-xs text-zinc-500">{moduleLabels[key] ?? key}</p>
                    <p className="mt-2 text-2xl font-semibold">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-2">
            <Card className="border-zinc-200/80 shadow-none">
              <CardContent className="p-5">
                <h2 className="font-semibold">{t.recent}: Users</h2>
                <div className="mt-4 space-y-3">
                  {overview.recent.users.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{item.email}</span>
                      <Badge variant="secondary">{item.role}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 shadow-none">
              <CardContent className="p-5">
                <h2 className="font-semibold">{t.recent}: Campaigns</h2>
                <div className="mt-4 space-y-3">
                  {overview.recent.campaigns.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{item.title}</span>
                      <Badge variant="secondary">{item.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 shadow-none">
              <CardContent className="p-5">
                <h2 className="font-semibold">{t.recent}: Orders</h2>
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
                <h2 className="font-semibold">{t.recent}: Conversations</h2>
                <div className="mt-4 space-y-3">
                  {overview.recent.conversations.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">
                        {shortId(item.id)} · {item.channel}
                      </span>
                      <Badge variant="secondary">{item.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
