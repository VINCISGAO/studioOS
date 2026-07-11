"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { publishBrandCampaignAction } from "@/app/brand-campaign-actions";
import { WizardStepper } from "@/components/studioos/ui/wizard-stepper";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CreditCard,
  FileText,
  Info,
  Lightbulb,
  Loader2,
  Lock,
  Send,
  Shield,
  Users,
  Wallet
} from "lucide-react";

const copy = {
  en: {
    title: "Publish ad",
    subtitle:
      "After publishing, the system will invite matched creators. Once they accept or reject, you can choose a partner from the list.",
    readyBadge: "Ready to publish",
    readyTitle: "Your brief is ready to publish",
    readyBody:
      "Confirm everything, publish, and enter escrow payment. After payment is confirmed, the system invites matched creators.",
    escrowTitle: "Secure escrow",
    escrowBody: "Funds are held by the platform so both sides are protected.",
    matchTitle: "Precise matching",
    matchBody: "Quickly invite creators who fit your brief.",
    privacyTitle: "Privacy",
    privacyBody: "Only matched creators can see your requirements.",
    publish: "Publish and enter escrow payment",
    publishing: "Creating invoice…",
    billingTitle: "Creating your escrow invoice",
    billingBody: "You will be sent to payment before creator matching starts.",
    nextTitle: "What happens next?",
    next1Title: "Send invitations",
    next1Body: "The system invites matched creators.",
    next2Title: "Creator responds",
    next2Body: "You will be notified when creators accept or reject.",
    next3Title: "Choose a partner",
    next3Body: "Select the best collaborator from respondents.",
    tipTitle: "Tip",
    tipBody: "Creators usually respond within 24-72 hours. Timely notifications can speed up startup.",
    back: "Back to previous step"
  },
  zh: {
    title: "发布广告",
    subtitle: "发布后系统将向匹配的 Creator 发出合作邀请，对方接受或拒绝后，你再从名单中选择合作对象。",
    readyBadge: "准备就绪",
    readyTitle: "需求已准备发布",
    readyBody: "确认无误后发布并进入托管付款，付款完成后，系统将向匹配的创作者发出合作邀请。",
    escrowTitle: "安全托管",
    escrowBody: "资金由平台托管，双方权益有保障",
    matchTitle: "精准匹配",
    matchBody: "快速向合适的创作者发出合作邀请",
    privacyTitle: "隐私保护",
    privacyBody: "仅匹配创作者可见你的需求",
    publish: "发布并进入托管付款",
    publishing: "正在创建账单…",
    billingTitle: "正在创建托管账单",
    billingBody: "系统会先带你完成付款，付款确认后才会开始匹配创作者。",
    nextTitle: "接下来会发生什么？",
    next1Title: "发出合作邀请",
    next1Body: "系统将向匹配的 Creator 发出合作邀请",
    next2Title: "创作者回应",
    next2Body: "Creator 接受或拒绝邀请，你将收到通知",
    next3Title: "选择合作方",
    next3Body: "从回应的 Creator 中选择最合适的合作对象",
    tipTitle: "小贴士",
    tipBody: "发出后 Creator 通常在 24–72 小时内回应，及时查看通知可加快项目启动速度。",
    back: "返回上一步"
  }
} as const;

function FeaturePillar({
  icon: Icon,
  iconClass,
  title,
  body
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center px-3 text-center">
      <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">{body}</p>
    </div>
  );
}

function NextStep({
  icon: Icon,
  title,
  body
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">{body}</p>
    </div>
  );
}

export function BrandCampaignStep3Publish({
  locale,
  projectId,
  error,
  onBack
}: {
  locale: Locale;
  projectId: string;
  error?: string | null;
  onBack: () => void;
}) {
  const t = copy[locale];
  const router = useRouter();
  const [publishError, setPublishError] = useState<string | null>(error ?? null);
  const [isPublishing, setIsPublishing] = useState(false);

  async function handlePublish() {
    if (isPublishing) return;

    setIsPublishing(true);
    setPublishError(null);

    const formData = new FormData();
    formData.set("lang", locale);
    formData.set("project_id", projectId);
    formData.set("confirmed", "1");

    try {
      const result = await publishBrandCampaignAction(formData);

      if (!result.ok) {
        setPublishError(result.error);
        setIsPublishing(false);
        return;
      }

      router.push(result.checkoutPath);
      router.refresh();
    } catch (caught) {
      setPublishError(
        caught instanceof Error
          ? caught.message
          : locale === "zh"
            ? "发布失败，请重试"
            : "Publish failed — try again"
      );
      setIsPublishing(false);
    }
  }

  return (
    <>
      {isPublishing ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-[#f8f9fb]/96 p-4 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-busy="true"
          aria-label={t.billingTitle}
        >
          <div className="relative w-full max-w-3xl animate-in fade-in zoom-in-95 overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-white px-8 py-10 text-center shadow-[0_28px_90px_rgba(124,58,237,0.18)] duration-300 sm:px-12 sm:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(139,92,246,0.13),transparent_34%),radial-gradient(circle_at_20%_30%,rgba(139,92,246,0.08),transparent_16%),radial-gradient(circle_at_82%_36%,rgba(45,212,191,0.08),transparent_16%)]" />
            <span className="absolute left-[18%] top-[25%] h-2.5 w-2.5 rounded-full bg-violet-500/75" />
            <span className="absolute left-[22%] top-[37%] text-lg text-violet-300">✦</span>
            <span className="absolute right-[19%] top-[33%] h-2 w-2 rounded-full bg-teal-300/80" />
            <span className="absolute right-[23%] top-[27%] text-lg text-violet-300">✦</span>

            <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-violet-100" />
              <span className="absolute inset-3 rounded-full border border-violet-100" />
              <span className="absolute inset-5 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin" />
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-violet-700 shadow-[0_16px_40px_rgba(124,58,237,0.18)]">
                <FileText className="h-9 w-9" />
              </span>
            </div>

            <h2 className="relative mt-7 text-3xl font-semibold tracking-tight text-zinc-950">{t.billingTitle}</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-sm leading-7 text-zinc-500">{t.billingBody}</p>

            <div className="relative mx-auto mt-9 grid max-w-2xl grid-cols-4 items-start gap-2">
              {(locale === "zh"
                ? [
                    { label: "创建托管账单", icon: CreditCard },
                    { label: "完成付款", icon: Wallet },
                    { label: "匹配创作者", icon: Users },
                    { label: "开始合作", icon: Send }
                  ]
                : [
                    { label: "Create escrow", icon: CreditCard },
                    { label: "Complete payment", icon: Wallet },
                    { label: "Match creators", icon: Users },
                    { label: "Start work", icon: Send }
                  ]).map(({ label, icon: Icon }, index) => (
                <div key={label} className="relative flex flex-col items-center gap-2">
                  {index < 3 ? (
                    <span className="absolute left-[calc(50%+22px)] top-5 h-px w-[calc(100%-44px)] border-t border-dashed border-violet-200" />
                  ) : null}
                  <span
                    className={
                      index === 0
                        ? "relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_12px_30px_rgba(124,58,237,0.28)]"
                        : "relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-400"
                    }
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={index === 0 ? "text-xs font-semibold text-violet-700" : "text-xs font-medium text-zinc-500"}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative mt-8 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm">
              <div className="h-2.5 overflow-hidden rounded-full bg-violet-50">
                <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" />
              </div>
              <div className="mt-2 text-right text-sm font-semibold text-violet-700">60%</div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="min-h-[calc(100dvh-3.5rem)] bg-[#f8f9fb] px-3 pb-8 pt-4 sm:px-4 sm:pt-5 lg:px-5 lg:pt-6">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <WizardStepper locale={locale} currentStep={3} variant="brand" />

          <header className="pt-2">
            <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight text-zinc-950">
              {t.title}
              <Send className="h-9 w-9 -rotate-12 text-violet-500" />
            </h1>
            <p className="mt-4 max-w-4xl text-base leading-7 text-zinc-500">{t.subtitle}</p>
          </header>

          <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
              <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden">
                <span className="absolute h-44 w-44 rounded-full bg-violet-100" />
                <span className="absolute h-32 w-32 rounded-full bg-violet-200/70 blur-sm" />
                <span className="absolute left-16 top-10 h-2 w-2 rounded-full bg-amber-300" />
                <span className="absolute bottom-12 left-10 h-2 w-2 rounded-full bg-blue-400" />
                <span className="absolute right-16 top-16 h-2 w-2 rotate-45 rounded-sm bg-violet-300" />
                <span className="absolute left-12 top-20 text-emerald-400">⌁</span>
                <span className="absolute right-10 bottom-16 text-violet-400">⌁</span>
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_22px_70px_rgba(124,58,237,0.38)]">
                  <Send className="h-14 w-14 -rotate-12" />
                </div>
                <span className="absolute bottom-16 right-[30%] flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shadow-lg ring-4 ring-white">
                  <Check className="h-5 w-5" />
                </span>
              </div>

              <div>
                <span className="inline-flex rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-600">
                  {t.readyBadge}
                </span>
                <h2 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-950">{t.readyTitle}</h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-zinc-500">{t.readyBody}</p>

                <div className="mt-8 border-t border-zinc-100 pt-7">
                  <div className="grid gap-5 sm:grid-cols-3">
                    <FeaturePillar icon={Shield} iconClass="bg-violet-50 text-violet-600" title={t.escrowTitle} body={t.escrowBody} />
                    <FeaturePillar icon={Send} iconClass="bg-blue-50 text-blue-600" title={t.matchTitle} body={t.matchBody} />
                    <FeaturePillar icon={Lock} iconClass="bg-emerald-50 text-emerald-600" title={t.privacyTitle} body={t.privacyBody} />
                  </div>
                </div>
              </div>
            </div>

            {publishError ? <p className="mt-5 text-sm text-red-600">{publishError}</p> : null}

            <Button
              type="button"
              size="lg"
              className="mt-8 h-14 w-full rounded-2xl bg-[#070817] text-base font-semibold text-white shadow-[0_16px_44px_rgba(7,8,23,0.24)] hover:bg-black"
              disabled={isPublishing}
              onClick={() => void handlePublish()}
            >
              {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isPublishing ? t.publishing : t.publish}
              {!isPublishing ? <ArrowRight className="ml-3 h-4 w-4" /> : null}
            </Button>
          </section>

          <section className="rounded-[1.5rem] border border-violet-100 bg-violet-50/50 p-6">
            <div className="mb-7 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-violet-600" />
              <h3 className="text-lg font-semibold text-zinc-950">{t.nextTitle}</h3>
            </div>
            <div className="grid gap-5 text-center sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-start">
              <NextStep icon={Send} title={t.next1Title} body={t.next1Body} />
              <span className="hidden pt-5 text-3xl text-violet-300 sm:block">→</span>
              <NextStep icon={Bell} title={t.next2Title} body={t.next2Body} />
              <span className="hidden pt-5 text-3xl text-violet-300 sm:block">→</span>
              <NextStep icon={Users} title={t.next3Title} body={t.next3Body} />
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
            <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-500">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
              <div>
                <p className="font-semibold text-zinc-700">{t.tipTitle}</p>
                <p className="mt-1 leading-6">{t.tipBody}</p>
              </div>
            </div>
            <Button type="button" variant="outline" className="h-full min-h-[4.5rem] rounded-2xl border-zinc-200 bg-white text-base" onClick={onBack} disabled={isPublishing}>
              <ArrowLeft className="mr-2 h-5 w-5" />
              {t.back}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
