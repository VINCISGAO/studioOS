import { getAppUiLocale } from "@/lib/app-language";
import { Crown } from "lucide-react";
import { updateCommissionRuleAction } from "@/app/membership-admin-actions";
import { AdminFormCsrf } from "@/components/studioos/admin-form-csrf";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { membershipAdminService } from "@/features/membership/membership-admin.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams } from "@/lib/i18n";
import { adminMembershipPlanTypeLabel } from "@/lib/studioos/admin-enum-labels";
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
    duration: "Duration (days)",
    kicker: "Platform",
    commissionDefault: "Commission (default %)",
    commissionVerified: "Commission (verified %)",
    clientServiceFee: "Client service fee %",
    upgradeThreshold: "Upgrade revenue threshold ($)",
    upgradeModal: "Upgrade modal enabled",
    clientFeeEnabled: "Client service fee enabled"
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
    duration: "有效期（天）",
    kicker: "平台",
    commissionDefault: "佣金（默认 %）",
    commissionVerified: "佣金（认证 %）",
    clientServiceFee: "客户手续费 %",
    upgradeThreshold: "升级收入门槛（美元）",
    upgradeModal: "启用升级弹窗",
    clientFeeEnabled: "启用客户手续费"
  }
};

export default async function AdminMembershipPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const user = await getAdminSessionUser();
  const config = user ? await membershipAdminService.getConfiguration(user) : { rule: null, plans: [] };
  const rule = config.rule;

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      {rule ? (
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">{t.rule}</h2>
            <form action={updateCommissionRuleAction} className="mt-6 grid gap-4 sm:grid-cols-2">
              <AdminFormCsrf />
              <input type="hidden" name="lang" value={locale} />
              <input type="hidden" name="name" value={rule.name} />
              <div>
                <Label htmlFor="default_creator_commission_percentage">{t.commissionDefault}</Label>
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
                <Label htmlFor="verified_creator_commission_percentage">{t.commissionVerified}</Label>
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
                <Label htmlFor="client_service_fee_percentage">{t.clientServiceFee}</Label>
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
                <Label htmlFor="upgrade_revenue_threshold">{t.upgradeThreshold}</Label>
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
                {t.upgradeModal}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="client_service_fee_enabled" defaultChecked={rule.clientServiceFeeEnabled} />
                {t.clientFeeEnabled}
              </label>
              <div className="sm:col-span-2">
                <Button type="submit">{t.save}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-8 border-zinc-200/80 shadow-none">
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Crown className="h-5 w-5" /> {t.plans}
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {config.plans.map((plan) => (
              <div key={plan.id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{plan.name}</p>
                  <Badge variant={plan.planType === "VERIFIED" ? "success" : "outline"}>
                    {adminMembershipPlanTypeLabel(plan.planType, locale)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-zinc-500">
                  {t.fee}: {formatCurrency(Number(plan.annualFee), locale)}
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
    </AdminPageShell>
  );
}
