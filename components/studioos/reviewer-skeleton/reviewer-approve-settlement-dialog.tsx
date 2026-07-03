"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CheckCircle2 } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import type { Locale } from "@/lib/i18n";
import {
  formatReviewMoney,
  reviewSettlementStatusLabel,
  type ReviewSettlementPreview
} from "@/lib/studioos/reviewer-settlement-ui";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    title: "确认最终交付？",
    body: "确认后，订单将进入结算流程；项目将结束；原片下载权限将开放。",
    settlementInfo: "结算信息",
    version: "当前版本",
    projectAmount: "项目金额",
    paidRevisionAddOn: "第4–5轮修订加购",
    platformFee: "平台手续费",
    creatorPayout: "创作者预计到账",
    settlementStatus: "结算状态",
    risk: "如果仍有修改意见，请返回继续审批并选择「要求修改」。",
    continue: "返回继续审批",
    confirm: "确认最终交付"
  },
  en: {
    title: "Confirm final delivery?",
    body: "After confirmation, the order enters settlement, the project ends, and original download permissions open.",
    settlementInfo: "Settlement details",
    version: "Current version",
    projectAmount: "Project amount",
    paidRevisionAddOn: "Rounds 4-5 revision add-on",
    platformFee: "Platform fee",
    creatorPayout: "Creator estimated payout",
    settlementStatus: "Settlement status",
    risk: "If changes are still needed, return to review and choose Request changes.",
    continue: "Return to review",
    confirm: "Confirm final delivery"
  }
};

export function ReviewerApproveSettlementDialog({
  locale,
  open,
  pending = false,
  preview,
  onOpenChange,
  onConfirm,
  onResumeReview
}: {
  locale: Locale;
  open: boolean;
  pending?: boolean;
  preview: ReviewSettlementPreview | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onResumeReview?: () => void;
}) {
  const t = copy[locale];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          <div className="px-8 pb-5 pt-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-violet-50">
              <CheckCircle2 className="h-6 w-6 text-violet-600" strokeWidth={1.75} />
            </div>
            <DialogPrimitive.Title className="text-xl font-semibold tracking-tight text-zinc-900">
              {t.title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-3 text-sm leading-relaxed text-zinc-500">
              {t.body}
            </DialogPrimitive.Description>
          </div>

          {preview ? (
            <div className="mx-6 mb-5 rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3 text-left">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {t.settlementInfo}
              </p>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-zinc-500">{t.version}</dt>
                  <dd className="font-medium text-zinc-900">V{preview.version}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-zinc-500">{t.projectAmount}</dt>
                  <dd className="font-medium text-zinc-900">
                    {formatReviewMoney(preview.orderAmount, preview.currency)}
                  </dd>
                </div>
                {preview.paidRevisionAddOnAmount ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-zinc-500">{t.paidRevisionAddOn}</dt>
                    <dd className="font-medium text-zinc-900">
                      {formatReviewMoney(preview.paidRevisionAddOnAmount, preview.currency)}
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-zinc-500">{t.platformFee}</dt>
                  <dd className="font-medium text-zinc-900">
                    {formatReviewMoney(preview.platformFee, preview.currency)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-zinc-500">{t.creatorPayout}</dt>
                  <dd className="font-semibold text-violet-700">
                    {formatReviewMoney(preview.creatorPayout, preview.currency)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-zinc-500">{t.settlementStatus}</dt>
                  <dd className="font-medium text-amber-700">
                    {reviewSettlementStatusLabel(locale, preview.settlementStatus)}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          <p className="px-8 pb-5 text-center text-xs leading-relaxed text-zinc-400">{t.risk}</p>

          <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 px-4 py-4">
            <button
              type="button"
              disabled={pending}
              className="h-11 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
              onClick={() => {
                onOpenChange(false);
                onResumeReview?.();
              }}
            >
              {t.continue}
            </button>
            <button
              type="button"
              disabled={pending || !preview}
              className="h-11 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-sm font-semibold text-white shadow-sm transition hover:from-violet-600 hover:to-violet-700 disabled:opacity-50"
              onClick={onConfirm}
            >
              {t.confirm}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
