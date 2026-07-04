import Link from "next/link";
import { ArrowLeft, Crown } from "lucide-react";
import { updateCommissionRuleAction } from "@/app/membership-admin-actions";
import { AdminFormCsrf } from "@/components/studioos/admin-form-csrf";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { membershipAdminService } from "@/features/membership/membership-admin.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { formatCurrency } from "@/lib/utils";

const copy = {
  en: {
    back: "Back to admin",
    title: "Creator membership & commission",
    subtitle: "All rates and thresholds are stored in the database — never hard-coded.",
    rule: "Active commission rule",
    plans: "Membership plans",
    save: "Save rule",
    fee: "Annual fee",
    commission: "Commission",
    duration: "Duration (days)"
  },
  zh: {
    back: "返回管理后台",
    title: "创作者会员与佣金",
    subtitle: "所有费率与门槛存于数据库，不在代码中写死。",
    rule: "当前佣金规则",
    plans: "会员方案",
    save: "保存规则",
    fee: "年费",
    commission: "佣金",
    duration: "有效期（天）"
  }
};

export default async function AdminMembershipPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = getLocale(await searchParams);
  const t = copy[locale];
  const user = await getAdminSessionUser();
  const config = user ? await membershipAdminService.getConfiguration(user) : { rule: null, plans: [] };
  const rule = config.rule;

  return (
    <div>
      <Button asChild variant="outline" size="sm">
        <Link href={withLocale(adminPortalRoutes.dashboard, locale)}>
          <ArrowLeft className="h-4 w-4" /> {t.back}
        </Link>
      </Button>
      <div className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Platform</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{t.subtitle}</p>
      </div>

      {rule ? (
        <Card className="mt-8 shadow-none">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">{t.rule}</h2>
            <form action={updateCommissionRuleAction} className="mt-6 grid gap-4 sm:grid-cols-2">
              <AdminFormCsrf />
              <input type="hidden" name="lang" value={locale} />
              <input type="hidden" name="name" value={rule.name} />
              <div>
                <Label htmlFor="default_creator_commission_percentage">{t.commission} (default %)</Label>
                <Input
                  id="default_creator_commission_percentage"
                  name="default_creator_commission_percentage"
                  type="number"
                  step="0.01"
                  defaultValue={Number(rule.defaultCreatorCommissionPercentage)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="verified_creator_commission_percentage">{t.commission} (verified %)</Label>
                <Input
                  id="verified_creator_commission_percentage"
                  name="verified_creator_commission_percentage"
                  type="number"
                  step="0.01"
                  defaultValue={Number(rule.verifiedCreatorCommissionPercentage)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="client_service_fee_percentage">Client service fee %</Label>
                <Input
                  id="client_service_fee_percentage"
                  name="client_service_fee_percentage"
                  type="number"
                  step="0.01"
                  defaultValue={Number(rule.clientServiceFeePercentage)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="upgrade_revenue_threshold">Upgrade revenue threshold ($)</Label>
                <Input
                  id="upgrade_revenue_threshold"
                  name="upgrade_revenue_threshold"
                  type="number"
                  step="1"
                  defaultValue={Number(rule.upgradeRevenueThreshold)}
                  className="mt-1.5"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="upgrade_modal_enabled" defaultChecked={rule.upgradeModalEnabled} />
                Upgrade modal enabled
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="client_service_fee_enabled" defaultChecked={rule.clientServiceFeeEnabled} />
                Client service fee enabled
              </label>
              <div className="sm:col-span-2">
                <Button type="submit">{t.save}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-8 shadow-none">
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Crown className="h-5 w-5" /> {t.plans}
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {config.plans.map((plan) => (
              <div key={plan.id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{plan.name}</p>
                  <Badge variant={plan.planType === "VERIFIED" ? "success" : "outline"}>{plan.planType}</Badge>
                </div>
                <p className="mt-2 text-sm text-zinc-500">
                  {t.fee}: {formatCurrency(Number(plan.annualFee))}
                </p>
                <p className="text-sm text-zinc-500">
                  {t.commission}: {Number(plan.creatorCommissionPercentage)}%
                </p>
                <p className="text-sm text-zinc-500">
                  {t.duration}: {plan.membershipDurationDays}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
