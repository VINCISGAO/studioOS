"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { publishBrandCampaignAction } from "@/app/brand-campaign-actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  Lightbulb,
  ListChecks,
  Loader2,
  Lock,
  Send,
  Shield
} from "lucide-react";

const copy = {
  en: {
    readyTitle: "Your brief is ready to publish 🎉",
    readyBody:
      "Publish when ready, then complete escrow payment. Creator invitations go out only after payment is confirmed.",
    escrowTitle: "Secure escrow",
    escrowBody: "Funds are held in escrow so both sides are protected.",
    matchTitle: "Smart matching",
    matchBody: "We quickly invite the right creators for your brief.",
    privacyTitle: "Privacy",
    privacyBody: "Only matched creators can see your requirements.",
    publish: "Publish and pay",
    publishing: "Creating invoice…",
    billingTitle: "Creating your escrow invoice",
    billingBody: "You will be sent to payment before creator matching starts.",
    nextTitle: "What happens next?",
    next1Title: "Invoice created",
    next1Body: "Confirm the order and complete escrow payment.",
    next2Title: "Matching starts",
    next2Body: "Creator invitations go out only after payment is confirmed.",
    next3Title: "Choose a partner",
    next3Body: "Pick the best fit from respondents.",
    back: "Back to previous step"
  },
  zh: {
    readyTitle: "需求已准备发布 🎉",
    readyBody: "确认无误后发布并进入托管付款。付款完成后，系统才会向匹配的创作者发出意向发单。",
    escrowTitle: "安全托管",
    escrowBody: "资金由平台托管，双方权益有保障",
    matchTitle: "精准匹配",
    matchBody: "快速向合适的创作者发出意向",
    privacyTitle: "隐私保护",
    privacyBody: "仅匹配创作者可见你的需求",
    publish: "发布并去付款",
    publishing: "正在创建账单…",
    billingTitle: "正在创建托管账单",
    billingBody: "系统会先带你完成付款，付款确认后才会开始匹配创作者。",
    nextTitle: "接下来会发生什么？",
    next1Title: "账单创建成功",
    next1Body: "先确认订单并完成托管付款",
    next2Title: "付款后开始匹配",
    next2Body: "付款确认后，系统才会向创作者发出意向",
    next3Title: "选择合作方",
    next3Body: "从响应列表中选择最合适的创作者",
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
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-white/96 p-4 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-busy="true"
          aria-label={t.billingTitle}
        >
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-3xl border border-zinc-200/80 bg-white p-8 text-center shadow-lg duration-300">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-zinc-950">{t.billingTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{t.billingBody}</p>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-2xl space-y-6 pb-10">
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="relative mx-auto mb-6 flex h-36 w-full max-w-sm items-center justify-center">
            <div className="absolute h-28 w-28 rounded-full bg-emerald-100/70 blur-sm" />
            <div className="absolute h-24 w-24 rounded-full bg-sky-100/80" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <Check className="h-8 w-8" strokeWidth={2.5} />
            </div>
            <Send className="absolute left-8 top-6 h-5 w-5 -rotate-12 text-violet-400" />
            <span className="absolute right-10 top-8 h-2 w-2 rounded-full bg-violet-400" />
            <span className="absolute right-16 top-14 h-1.5 w-1.5 rounded-full bg-indigo-400" />
            <span className="absolute bottom-8 left-16 h-2 w-2 rotate-45 rounded-sm bg-sky-300" />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-semibold text-zinc-950 sm:text-2xl">{t.readyTitle}</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-zinc-500">{t.readyBody}</p>
          </div>

          <div className="mt-8 border-t border-dashed border-zinc-200 pt-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:gap-0">
              <FeaturePillar
                icon={Shield}
                iconClass="bg-violet-100 text-violet-700"
                title={t.escrowTitle}
                body={t.escrowBody}
              />
              <FeaturePillar
                icon={Send}
                iconClass="bg-blue-100 text-blue-700"
                title={t.matchTitle}
                body={t.matchBody}
              />
              <FeaturePillar
                icon={Lock}
                iconClass="bg-emerald-100 text-emerald-700"
                title={t.privacyTitle}
                body={t.privacyBody}
              />
            </div>
          </div>

          {publishError ? <p className="mt-6 text-sm text-red-600">{publishError}</p> : null}

          <div className="mt-8">
            <Button
              type="button"
              size="lg"
              className="h-12 w-full rounded-xl bg-zinc-950 text-base font-medium text-white shadow-[0_12px_40px_rgba(124,58,237,0.25)] hover:bg-zinc-900"
              disabled={isPublishing}
              onClick={() => void handlePublish()}
            >
              {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isPublishing ? t.publishing : t.publish}
              {!isPublishing ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-center gap-2">
            <Lightbulb className="h-4 w-4 text-violet-600" />
            <h3 className="text-sm font-semibold text-zinc-950">{t.nextTitle}</h3>
          </div>
          <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:items-start sm:gap-4">
            <NextStep icon={Send} title={t.next1Title} body={t.next1Body} />
            <div className="hidden self-center text-zinc-300 sm:block">→</div>
            <NextStep icon={Bell} title={t.next2Title} body={t.next2Body} />
            <div className="hidden self-center text-zinc-300 sm:block">→</div>
            <NextStep icon={ListChecks} title={t.next3Title} body={t.next3Body} />
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-zinc-200 bg-white px-6"
            onClick={onBack}
            disabled={isPublishing}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.back}
          </Button>
        </div>
      </div>
    </>
  );
}
