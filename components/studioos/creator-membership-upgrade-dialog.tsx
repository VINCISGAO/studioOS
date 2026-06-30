"use client";

import { useState } from "react";
import { BadgeCheck, Sparkles } from "lucide-react";
import {
  declineMembershipUpgradeAction,
  demoMembershipUpgradeAction
} from "@/app/membership-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import type { MembershipPlanView } from "@/features/membership/membership.types";
import type { Locale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

const copy = {
  en: {
    title: "Upgrade to Verified Creator",
    subtitle: "Lower commission and priority matching — configured by platform admin.",
    fee: "Annual membership",
    benefits: "Verified benefits",
    upgrade: "Upgrade now",
    decline: "Not now",
    demoNote: "Demo mode: no Stripe charge"
  },
  zh: {
    title: "升级至 Verified Creator",
    subtitle: "更低佣金与优先匹配 — 费率由平台管理员配置。",
    fee: "年度会员费",
    benefits: "Verified 权益",
    upgrade: "立即升级",
    decline: "暂不升级",
    demoNote: "演示模式：不会发起 Stripe 扣款"
  }
};

export function CreatorMembershipUpgradeDialog({
  locale,
  open,
  verifiedPlan,
  stripeConfigured
}: {
  locale: Locale;
  open: boolean;
  verifiedPlan: MembershipPlanView;
  stripeConfigured: boolean;
}) {
  const [pending, setPending] = useState(false);
  const t = copy[locale];

  async function handleUpgrade() {
    setPending(true);
    try {
      if (!stripeConfigured) {
        const fd = new FormData();
        fd.set("lang", locale);
        await demoMembershipUpgradeAction(fd);
        window.location.reload();
        return;
      }

      const origin = window.location.origin;
      const res = await fetch("/api/v1/me/membership/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          successUrl: `${origin}/studio?lang=${locale}&upgraded=1`,
          cancelUrl: `${origin}/studio?lang=${locale}`
        })
      });
      const json = (await res.json()) as { success?: boolean; data?: { url?: string } };
      if (json.data?.url) {
        window.location.href = json.data.url;
      }
    } finally {
      setPending(false);
    }
  }

  async function handleDecline() {
    const fd = new FormData();
    fd.set("lang", locale);
    await declineMembershipUpgradeAction(fd);
    window.location.reload();
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-indigo-600" />
            {t.title}
          </DialogTitle>
          <DialogDescription>{t.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-indigo-50/50 p-4">
          <p className="text-sm text-zinc-600">{t.fee}</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(verifiedPlan.annualFee)}</p>
          <p className="mt-2 text-sm text-zinc-500">
            {verifiedPlan.creatorCommissionPercentage}% platform commission
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-zinc-900">{t.benefits}</p>
          <ul className="mt-2 space-y-1.5 text-sm text-zinc-600">
            {verifiedPlan.benefits.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {!stripeConfigured ? (
          <p className="text-xs text-amber-700">{t.demoNote}</p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleDecline} disabled={pending}>
            {t.decline}
          </Button>
          <Button type="button" onClick={handleUpgrade} disabled={pending}>
            {t.upgrade}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
