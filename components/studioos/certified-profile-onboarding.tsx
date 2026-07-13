"use client";

import { useMemo, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { completeCreatorProfileAction } from "@/app/profile-actions";
import { CreatorMinBudgetField } from "@/components/creator/creator-min-budget-field";
import { OrderRatingPolicyCard } from "@/components/studioos/order-rating-policy-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Creator } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import {
  getCountryOptions,
  getWorkCategoryOptions,
  publishPlaceholder
} from "@/lib/localized-options";
import { generateCreatorAiTags } from "@/lib/studioos/creator-ai-tags";
import { normalizeCreatorMinBudget } from "@/lib/studioos/creator-price-preference";
import type { CreatorWork } from "@/lib/types";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Set up your studio profile",
    subtitle:
      "After certification, complete your public homepage, expertise, and tools. AI will generate matching tags to power recommendations.",
    basics: "Studio identity",
    expertise: "Expertise & domains",
    expertiseHint: "Select the industries you specialize in. AI uses this for brand matching.",
    specialties: "Specialties (comma separated)",
    tools: "Tools (comma separated)",
    delivery: "Typical delivery speed",
    minBudget: "Minimum project budget",
    minBudgetHint: "Pick a preset or choose custom to enter your own minimum. Briefs below it won't be recommended.",
    aiTags: "AI matching tags",
    aiTagsHint: "Preview updates as you edit. These tags power AI dispatch and brand recommendations.",
    submit: "Complete setup & unlock studio",
    required: "Required"
  },
  zh: {
    title: "完善认证创作者主页",
    subtitle: "成为认证服务商后，请填写公开主页、擅长领域与制作工具。系统将用智能助手生成匹配标签，并开启订单评分体系。",
    basics: "创作者基本信息",
    expertise: "擅长领域",
    expertiseHint: "选择您专注的行业方向，AI 将据此进行 Brand 匹配推荐。",
    specialties: "擅长方向（逗号分隔）",
    tools: "制作工具（逗号分隔）",
    delivery: "常规交付周期",
    minBudget: "商单价格意愿",
    minBudgetHint: "可选预设档位，或选「自定义金额」手动填写最低预算；低于此金额的项目不会推荐给你。",
    aiTags: "AI 匹配标签",
    aiTagsHint: "随资料编辑实时预览。标签用于 AI 自动派单与推荐排序。",
    submit: "完成入驻并解锁创作者功能",
    required: "必填"
  }
};

export function CertifiedProfileOnboarding({
  locale,
  creator,
  works,
  error
}: {
  locale: Locale;
  creator: Creator;
  works: CreatorWork[];
  error?: string;
}) {
  const t = copy[locale];
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: creator.name ?? "",
    headline: creator.headline ?? "",
    bio: creator.bio ?? "",
    country: creator.country ?? "",
    portfolio_url: creator.portfolio_url ?? "",
    specialties: (creator.specialties ?? []).join(", "),
    tools: (creator.tools ?? []).join(", "),
    delivery_speed: creator.delivery_speed ?? "",
    min_project_budget_usd: normalizeCreatorMinBudget(creator.min_project_budget_usd ?? 0),
    expertise_domains: creator.expertise_domains ?? []
  });
  const countryOptions = useMemo(() => getCountryOptions(locale, form.country), [locale, form.country]);
  const domainOptions = useMemo(() => getWorkCategoryOptions(locale), [locale]);

  const previewTags = useMemo(
    () =>
      generateCreatorAiTags({
        bio: form.bio,
        headline: form.headline,
        specialties: form.specialties.split(",").map((item) => item.trim()).filter(Boolean),
        expertise_domains: form.expertise_domains,
        tools: form.tools.split(",").map((item) => item.trim()).filter(Boolean),
        works
      }),
    [form, works]
  );

  function toggleDomain(domain: string) {
    setForm((current) => ({
      ...current,
      expertise_domains: current.expertise_domains.includes(domain)
        ? current.expertise_domains.filter((item) => item !== domain)
        : [...current.expertise_domains, domain]
    }));
  }

  function handleSubmit() {
    const formData = new FormData();
    formData.set("lang", locale);
    formData.set("name", form.name);
    formData.set("headline", form.headline);
    formData.set("bio", form.bio);
    formData.set("country", form.country);
    formData.set("portfolio_url", form.portfolio_url);
    formData.set("specialties", form.specialties);
    formData.set("tools", form.tools);
    formData.set("delivery_speed", form.delivery_speed);
    formData.set("min_project_budget_usd", String(form.min_project_budget_usd));
    for (const domain of form.expertise_domains) {
      formData.append("expertise_domains", domain);
    }
    startTransition(async () => {
      await completeCreatorProfileAction(formData);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {locale === "zh" ? "认证后入驻" : "Post-certification setup"}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">{t.subtitle}</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          <Card className="shadow-none ring-1 ring-zinc-200">
            <CardContent className="space-y-4 p-6">
              <h2 className="font-semibold">{t.basics}</h2>
              <Field label={locale === "zh" ? "展示名称" : "Display name"} required>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label={locale === "zh" ? "一句话介绍" : "Headline"} required>
                <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
              </Field>
              <Field label={locale === "zh" ? "个人简介" : "Bio"} required>
                <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={locale === "zh" ? "国家 / 地区" : "Country"}>
                  <select
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    <option value="" disabled>
                      {locale === "zh" ? "选择国家 / 地区" : "Select country"}
                    </option>
                    {countryOptions.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={locale === "zh" ? "作品集链接" : "Portfolio URL"}>
                  <Input
                    value={form.portfolio_url}
                    onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none ring-1 ring-zinc-200">
            <CardContent className="space-y-4 p-6">
              <div>
                <h2 className="font-semibold">{t.expertise}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t.expertiseHint}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {domainOptions.map(({ value, label }) => {
                  const active = form.expertise_domains.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleDomain(value)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition",
                        active
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <Field label={t.specialties} required>
                <Input
                  value={form.specialties}
                  onChange={(e) => setForm({ ...form, specialties: e.target.value })}
                  placeholder={publishPlaceholder("specialties", locale)}
                />
              </Field>
              <Field label={t.tools}>
                <Input
                  value={form.tools}
                  onChange={(e) => setForm({ ...form, tools: e.target.value })}
                  placeholder={publishPlaceholder("tools", locale)}
                />
              </Field>
              <Field label={t.delivery}>
                <Input
                  value={form.delivery_speed}
                  onChange={(e) => setForm({ ...form, delivery_speed: e.target.value })}
                  placeholder={publishPlaceholder("deliverySpeed", locale)}
                />
              </Field>
              <CreatorMinBudgetField
                locale={locale}
                label={t.minBudget}
                hint={t.minBudgetHint}
                value={form.min_project_budget_usd}
                onChange={(min_project_budget_usd) => setForm({ ...form, min_project_budget_usd })}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-violet-200 bg-violet-50/50 shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-700" />
                <h2 className="font-semibold text-violet-950">{t.aiTags}</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-violet-900/90">{t.aiTagsHint}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {previewTags.length ? (
                  previewTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-white/80">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {locale === "zh" ? "填写资料后自动生成标签" : "Tags appear as you fill in your profile"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <OrderRatingPolicyCard
            locale={locale}
            rating={creator.rating}
            orderReviewCount={creator.order_rating_count ?? 0}
          />

          <Button
            size="lg"
            className="w-full rounded-full"
            disabled={isPending}
            onClick={handleSubmit}
          >
            {t.submit}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}
