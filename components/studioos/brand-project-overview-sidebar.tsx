"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Clapperboard, MessageSquare, CircleDollarSign, Users } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import {
  isBrandAwaitingPayment,
  type BrandCommercialContext,
  type BrandCommercialStep
} from "@/lib/studioos/commercial-lifecycle";
import type { StoredOrder } from "@/lib/order-types";

const copy = {
  en: {
    quickActions: "Quick actions",
    viewResponses: "View creator responses",
    viewResponsesHint: "Review accepted invitations and pick a creator",
    completePayment: "Complete escrow payment",
    completePaymentHint: "Fund the campaign before production starts",
    reviewCenter: "Open review center",
    reviewCenterHint: "Review deliverables, annotate, and approve",
    reviewCenterWaitingHint: "Creator is producing — review opens when V1 is submitted",
    contactCreator: "Message creator",
    contactCreatorHint: "Chat with your selected creator"
  },
  zh: {
    quickActions: "快速操作",
    viewResponses: "查看创作者回复",
    viewResponsesHint: "查看已接受邀约并选定合作创作者",
    completePayment: "完成托管付款",
    completePaymentHint: "付款成功后创作者才会开始制作",
    reviewCenter: "前往审片中心",
    reviewCenterHint: "审片、批注与验收，无需品牌上传成片",
    reviewCenterWaitingHint: "创作者制作中，提交 V1 后可在此审片",
    contactCreator: "联系合作创作者",
    contactCreatorHint: "与已选定的创作者沟通项目细节"
  }
} as const;

type QuickAction = {
  href: string;
  icon: LucideIcon;
  title: string;
  hint: string;
};

function buildBrandQuickActions(input: {
  locale: Locale;
  projectId: string;
  brandCommercialStep: BrandCommercialStep;
  commercialContext: BrandCommercialContext;
  hasDeliverables: boolean;
  acceptedCount: number;
  selectedCreatorId: string | null;
  linkedOrder: StoredOrder | null;
}): QuickAction[] {
  const t = copy[input.locale];
  const actions: QuickAction[] = [];
  const awaitingPayment = isBrandAwaitingPayment(input.commercialContext);
  const recruitingSteps: BrandCommercialStep[] = [
    "matching",
    "invitations_sent",
    "collecting_candidates",
    "select_creator"
  ];

  if (recruitingSteps.includes(input.brandCommercialStep) && input.acceptedCount > 0) {
    actions.push({
      href: "#creator-responses",
      icon: Users,
      title: t.viewResponses,
      hint: t.viewResponsesHint
    });
  }

  if (input.brandCommercialStep === "creator_selected" && awaitingPayment) {
    actions.push({
      href: withLocale(brandPortalRoutes.projectCheckout(input.projectId), input.locale),
      icon: CircleDollarSign,
      title: t.completePayment,
      hint: t.completePaymentHint
    });
  }

  if (
    input.selectedCreatorId &&
    !awaitingPayment &&
    (input.hasDeliverables ||
      ["in_production", "under_review", "approved", "pending_delivery"].includes(
        input.brandCommercialStep
      ))
  ) {
    actions.push({
      href: withLocale(brandPortalRoutes.projectReview(input.projectId), input.locale),
      icon: Clapperboard,
      title: t.reviewCenter,
      hint: input.hasDeliverables ? t.reviewCenterHint : t.reviewCenterWaitingHint
    });
  }

  if (input.selectedCreatorId && !awaitingPayment && input.linkedOrder) {
    actions.push({
      href: withLocale(`${brandPortalRoutes.messages}?tab=project`, input.locale),
      icon: MessageSquare,
      title: t.contactCreator,
      hint: t.contactCreatorHint
    });
  }

  return actions;
}

export function BrandProjectOverviewSidebar({
  locale,
  projectId,
  brandCommercialStep,
  commercialContext,
  hasDeliverables,
  acceptedCount,
  selectedCreatorId,
  linkedOrder
}: {
  locale: Locale;
  projectId: string;
  brandCommercialStep: BrandCommercialStep;
  commercialContext: BrandCommercialContext;
  hasDeliverables: boolean;
  acceptedCount: number;
  selectedCreatorId: string | null;
  linkedOrder: StoredOrder | null;
}) {
  const t = copy[locale];
  const actions = buildBrandQuickActions({
    locale,
    projectId,
    brandCommercialStep,
    commercialContext,
    hasDeliverables,
    acceptedCount,
    selectedCreatorId,
    linkedOrder
  });

  if (actions.length === 0) {
    return null;
  }

  return (
    <aside className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-3.5">
          <h3 className="text-sm font-semibold text-zinc-950">{t.quickActions}</h3>
        </div>
        <ul className="divide-y divide-zinc-100">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.title}>
                <Link
                  href={action.href}
                  className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-zinc-50"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{action.title}</p>
                    <p className="text-xs text-zinc-500">{action.hint}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}
