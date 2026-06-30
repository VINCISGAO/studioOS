import Link from "next/link";
import { BadgeCheck, CheckCircle2, Clock3, CreditCard, FileText, ShieldCheck } from "lucide-react";
import { submitOnboardingAction } from "@/app/onboarding-actions";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApplication } from "@/lib/onboarding-service";
import { getLocale, type Locale, type SearchParams, withLocale } from "@/lib/i18n";
import { getCountryOptions } from "@/lib/localized-options";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    eyebrow: "Creator onboarding",
    title: "Apply to become a vetted StudioOS production partner.",
    subtitle:
      "Submit your studio profile for admin review. After approval, pay the guarantee deposit and start receiving quote requests.",
    submit: "Submit application",
    deposit: "Guarantee deposit",
    depositBody:
      "Approved creators pay a refundable platform deposit before accepting orders. Deposits can be frozen during disputes and refunded after all orders are settled.",
    fields: {
      studio_name: "Studio / creator name",
      email: "Email",
      country: "Country",
      portfolio_url: "Portfolio URL",
      specialties: "Specialties",
      tools: "AI tools",
      base_price: "Base price (USD)",
      delivery_speed: "Delivery speed",
      notes: "Notes"
    },
    placeholders: {
      specialties: "Beauty, DTC, SaaS, TikTok, YouTube...",
      tools: "Runway, Kling, Midjourney, After Effects...",
      note: "Tell StudioOS what kind of advertising work you are strongest at.",
      delivery_speed: "48-72 hours"
    },
    rules: ["No unfinished orders", "No active dispute", "Admin review required"],
    footerNote: "Submission enters admin review",
    successTitle: "Application submitted",
    successBody: "Your onboarding request is saved. Here is what happens next:",
    steps: [
      "Admin reviews your studio profile",
      "After approval, sign in as a creator and pay the guarantee deposit",
      "Publish portfolio work and reply to brand inquiries"
    ],
    applicationId: "Application ID",
    pending: "Pending review",
    approved: "Approved",
    rejected: "Rejected",
    loginCreator: "Sign in as creator",
    backForm: "Submit another application",
    demoNote: "In demo mode, an admin can approve this application from the admin dashboard.",
    errorMissing: "Please fill in all required fields."
  },
  zh: {
    eyebrow: "承接人入驻",
    title: "申请成为 StudioOS 严选广告制作承接方。",
    subtitle: "提交工作室资料后进入平台审核。通过审核、缴纳保证金，即可开始接收品牌询价。",
    submit: "提交入驻申请",
    deposit: "保证金",
    depositBody:
      "通过审核的承接人需要缴纳可退还的平台保证金后才能承接订单。发生争议时保证金可冻结，所有订单结清后可申请退还。",
    fields: {
      studio_name: "工作室 / 承接人名称",
      email: "邮箱",
      country: "国家 / 地区",
      portfolio_url: "作品集链接",
      specialties: "擅长方向",
      tools: "AI 工具",
      base_price: "基础报价（USD）",
      delivery_speed: "交付速度",
      notes: "补充说明"
    },
    placeholders: {
      specialties: "美妆、DTC、SaaS、TikTok、YouTube...",
      tools: "Runway、Kling、Midjourney、After Effects...",
      note: "告诉 StudioOS 你最擅长哪类广告制作。",
      delivery_speed: "48–72 小时"
    },
    rules: ["没有未完成订单", "没有进行中争议", "需要管理员审核"],
    footerNote: "提交后进入管理员审核",
    successTitle: "入驻申请已提交",
    successBody: "你的申请已保存，接下来会这样进行：",
    steps: ["管理员审核你的工作室资料", "审核通过后，登录创作者账号并缴纳保证金", "发布作品，开始接收品牌询价"],
    applicationId: "申请编号",
    pending: "待审核",
    approved: "已通过",
    rejected: "未通过",
    loginCreator: "登录创作者账号",
    backForm: "重新填写申请",
    demoNote: "演示模式下，管理员可在管理后台批准此申请。",
    errorMissing: "请填写所有必填项。"
  }
};

type OnboardingPageProps = {
  searchParams: Promise<SearchParams & { submitted?: string; error?: string }>;
};

export const dynamic = "force-dynamic";

export default async function CreatorOnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;
  const locale = getLocale(params);
  const t = copy[locale];
  const submittedId = typeof params.submitted === "string" ? params.submitted : null;
  const application = submittedId ? await getApplication(submittedId) : null;
  const error = params.error === "missing" ? t.errorMissing : undefined;

  return (
    <PageShell locale={locale}>
      <main className="bg-[#f6f6f3]">
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.68fr_0.32fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t.eyebrow}</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">{t.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">{t.subtitle}</p>

            {application ? (
              <Card className="mt-8 border-emerald-200 bg-white shadow-none">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-700" />
                    <div>
                      <h2 className="text-2xl font-semibold">{t.successTitle}</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.successBody}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {t.applicationId}: {application.id}
                    </Badge>
                    <Badge
                      variant={
                        application.status === "approved"
                          ? "success"
                          : application.status === "rejected"
                            ? "secondary"
                            : "warning"
                      }
                    >
                      {application.status === "approved"
                        ? t.approved
                        : application.status === "rejected"
                          ? t.rejected
                          : t.pending}
                    </Badge>
                  </div>
                  <ol className="mt-6 space-y-4">
                    {t.steps.map((step, index) => (
                      <li key={step} className="flex gap-3 text-sm leading-6">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-6 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">{t.demoNote}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild>
                      <Link href={withLocale("/login?role=creator", locale)}>{t.loginCreator}</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={withLocale("/creator/onboarding", locale)}>{t.backForm}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="mt-8 bg-white shadow-none">
                <CardContent className="p-6 sm:p-8">
                  <form action={submitOnboardingAction} className="grid gap-6">
                    <input type="hidden" name="lang" value={locale} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={t.fields.studio_name} name="studio_name" required />
                      <Field label={t.fields.email} name="email" type="email" required />
                      <CountrySelectField label={t.fields.country} name="country" locale={locale} required />
                      <Field label={t.fields.portfolio_url} name="portfolio_url" type="url" required />
                      <Field label={t.fields.specialties} name="specialties" placeholder={t.placeholders.specialties} required />
                      <Field label={t.fields.tools} name="tools" placeholder={t.placeholders.tools} required />
                      <Field label={t.fields.base_price} name="base_price" type="number" min="1" required />
                      <Field label={t.fields.delivery_speed} name="delivery_speed" placeholder={t.placeholders.delivery_speed} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="notes">{t.fields.notes}</Label>
                      <Textarea id="notes" name="notes" placeholder={t.placeholders.note} rows={4} />
                    </div>
                    {error ? (
                      <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                        {error}
                      </p>
                    ) : null}
                    <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        {t.footerNote}
                      </div>
                      <Button type="submit" size="lg">
                        {t.submit}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="lg:pt-28">
            <Card className="sticky top-24 bg-white shadow-luxe">
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold">{t.deposit}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{t.depositBody}</p>
                <div className="mt-6 rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-3xl font-semibold">{locale === "zh" ? "审核后确认" : "Set after review"}</div>
                    <Badge variant="warning">
                      <CreditCard className="mr-1 h-3.5 w-3.5" />
                      Stripe
                    </Badge>
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  {t.rules.map((rule) => (
                    <div key={rule} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BadgeCheck className="h-4 w-4 text-foreground" />
                      {rule}
                    </div>
                  ))}
                </div>
                {application?.status === "pending" ? (
                  <div className="mt-5 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                    <Clock3 className="h-4 w-4 shrink-0" />
                    {t.pending}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>
    </PageShell>
  );
}

function CountrySelectField({
  label,
  name,
  locale,
  required
}: {
  label: string;
  name: string;
  locale: Locale;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue=""
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <option value="" disabled>
          {locale === "zh" ? "选择国家 / 地区" : "Select country"}
        </option>
        {getCountryOptions(locale).map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Field({
  label,
  name,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}
