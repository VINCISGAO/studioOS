"use client";

import { useState, useTransition, type RefObject, type ReactNode } from "react";
import { AlertTriangle, Check, ChevronRight, Clock, Download, FileWarning, Play, RotateCcw, Send, Upload, UploadCloud } from "lucide-react";
import {
  confirmReviewApproveAndSettleAction,
  getReviewSettlementPreviewAction,
  markReviewReadyForCompletionAction,
  resumeReviewFromReadyAction
} from "@/app/review-actions";
import { ReviewerApproveSettlementDialog } from "@/components/studioos/reviewer-skeleton/reviewer-approve-settlement-dialog";
import {
  ReviewerVersionUploadZone,
  type ReviewerVersionUploadUI
} from "@/components/studioos/reviewer-skeleton/reviewer-version-upload-zone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { MAX_CAMPAIGN_VERSIONS } from "@/features/delivery/version.repository";
import {
  assertRevisionRequestAllowed,
  resolveReviewVersionSlotLockReason,
  reviewDraftLabel,
  reviewSlotSecondaryLabel
} from "@/features/review/review-round-policy";
import type { Locale } from "@/lib/i18n";
import type { OrderStatus, StoredDeliverable } from "@/lib/order-types";
import {
  isAwaitingCreatorFirstDraft,
  isUnsubmittedDeliverable,
  latestSubmittedDeliverableVersion,
  latestUploadedDeliverableVersion,
  resolveCreatorUploadContext,
  resolveMaxOpenReviewWorkflowSlot
} from "@/lib/studioos/review-upload-version-shared";
import type { ReviewSettlementPreview } from "@/lib/studioos/reviewer-settlement-ui";
import { creatorRevertUploadPolicyNotice } from "@/lib/studioos/creator-revert-upload-policy";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    versionFlow: "版本流程",
    draftNames: ["第一稿", "第二稿", "第三稿"],
    currentReview: "当前审核中",
    revisionInProgress: "修改中",
    pendingUpload: "待上传",
    locked: "未解锁",
    paidLocked: "付费加购",
    paidPackIncluded: "含于加购",
    paidLockedHint: "需品牌完成一次加购后解锁",
    unlockPaidRevision: "加购第4–5轮修订",
    unlockPaidRevisionHint: "前三轮已含在费用内。第4轮起需一次性加购（项目金额 20%），可再修改两轮（V4、V5），第五轮无需再付费。",
    paidRevisionChoiceTitle: "本轮免费修改已用完",
    paidRevisionChoiceHint: "可确认收货进入结算，或继续支付该笔订单金额的20%额外修改服务费加购4–5轮修订。",
    confirmReceipt: "确认收货",
    confirmReceiptHint: "当前稿无需继续修改，进入最终确认",
    continueEditing: "我还想继续修改",
    continueEditingHint: "查看第4–5轮修订加购说明",
    waitingPaidUnlock: "等待品牌完成一次加购（解锁第4–5轮修订）",
    confirmRevisionHint: "已完成本轮批注，通知创作者修改并上传第二稿",
    approve: "无需修改，直接通过",
    approveHint: "确认本稿无需修改，进入结算流程",
    uploadNext: "上传",
    formats: "支持 MP4 / MOV",
    maxSize: "最大 500MB",
    waitingStudio: "等待创作者上传",
    waitingBrandReview: "当前稿已上传，请申请项目方批阅",
    processCommentsBeforeUpload: "请先处理完本轮所有品牌批注，再上传下一稿。",
    revertUpload: "退回上传",
    viewReviewRecords: "申请项目方批阅",
    uploadPanelHint: "点击或拖拽上传视频",
    uploadFirstDraft: "上传第一稿",
    reuploadFirstDraft: "重新上传第一稿",
    reuploadDraft: "重新上传",
    reuploadHint: "视频未能加载，请重新上传 MP4 / MOV",
    approvedFinal: "终审通过",
    done: "已完成",
    reviewCompletedTitle: "交付成功",
    brandReviewCompletedHint: "本 Campaign 已完成交付，可直接下载原片。",
    creatorReviewCompletedHint: "本 Campaign 已完成交付，款项已结算到收入账户。",
    downloadOriginal: "下载原片",
    downloadOriginalHint: "下载最终交付视频"
  },
  en: {
    versionFlow: "Version flow",
    draftNames: ["Draft 1", "Draft 2", "Draft 3"],
    currentReview: "In review",
    revisionInProgress: "In revision",
    pendingUpload: "Pending upload",
    locked: "Locked",
    paidLocked: "Paid add-on",
    paidPackIncluded: "In add-on pack",
    paidLockedHint: "Brand must complete the one-time add-on",
    unlockPaidRevision: "Purchase rounds 4–5 add-on",
    unlockPaidRevisionHint:
      "Rounds 1–3 are included. One add-on (20% of project amount) unlocks two more rounds (V4 & V5); no second payment for round 5.",
    paidRevisionChoiceTitle: "Included revision rounds are used",
    paidRevisionChoiceHint: "Confirm receipt to settle, or pay an extra 20% of this order amount for the rounds 4–5 revision add-on.",
    confirmReceipt: "Confirm receipt",
    confirmReceiptHint: "No more changes needed. Move to final confirmation.",
    continueEditing: "I want more changes",
    continueEditingHint: "View the rounds 4–5 add-on details",
    waitingPaidUnlock: "Waiting for brand to purchase the rounds 4–5 add-on",
    confirmRevisionHint: "Notes for this round are complete. Notify Studio to revise and upload the next draft.",
    approve: "No changes needed, pass directly",
    approveHint: "Confirm no changes are needed for this draft to enter settlement.",
    uploadNext: "Upload",
    formats: "MP4 / MOV supported",
    maxSize: "Up to 500 MB",
    waitingStudio: "Waiting for Studio upload",
    waitingBrandReview: "Current draft uploaded. Request brand review when ready.",
    processCommentsBeforeUpload: "Handle all Brand notes for this round before uploading the next draft.",
    revertUpload: "Revert upload",
    viewReviewRecords: "Request brand review",
    uploadPanelHint: "Click or drag to upload",
    uploadFirstDraft: "Upload draft 1",
    reuploadFirstDraft: "Re-upload draft 1",
    reuploadDraft: "Re-upload",
    reuploadHint: "Video failed to load — upload MP4 / MOV again",
    approvedFinal: "Approved",
    done: "Done",
    reviewCompletedTitle: "Delivery complete",
    brandReviewCompletedHint: "This campaign has been delivered. You can download the original master.",
    creatorReviewCompletedHint: "This campaign has been delivered and the payout has been settled to your income account.",
    downloadOriginal: "Download original",
    downloadOriginalHint: "Download the final delivery video"
  }
};

function draftLabel(locale: Locale, version: number) {
  return reviewDraftLabel(locale, version);
}

function PortalVersionActionCard({
  borderClass,
  icon,
  title,
  titleClass,
  hint,
  pending,
  onClick
}: {
  borderClass: string;
  icon: ReactNode;
  title: string;
  titleClass: string;
  hint: string;
  pending?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border bg-white px-5 py-4 text-left transition hover:shadow-sm disabled:cursor-wait disabled:opacity-70",
        borderClass
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm font-semibold", titleClass)}>{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-zinc-500">{hint}</span>
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400">
        <ChevronRight className="h-4 w-4" />
      </span>
    </button>
  );
}

export function ReviewerPortalVersionSection({
  locale,
  role,
  versions,
  activeVersion,
  activeReviewVersion = activeVersion,
  orderId,
  projectId,
  orderStatus,
  reviewCompleted,
  uploadUI,
  fileRef,
  onSelectVersion,
  onRequestRevision,
  onApproveSuccess,
  onApproveError,
  onOrderStatusChange,
  revisionPending = false,
  onFileInputChange,
  onUploadFile,
  onCancelUpload,
  onOpenPicker,
  replaceUploadVersion = null,
  videoPlaybackFailed = false,
  onRevertUpload,
  revertPending = false,
  onViewReviewRecords,
  brandReviewRequestPending = false,
  canRevertUpload = true,
  paidRevisionSlotsUnlocked = 0,
  openBrandCommentCount = 0,
  onUnlockPaidRevision,
  unlockPending = false
}: {
  locale: Locale;
  role: "brand" | "creator";
  versions: StoredDeliverable[];
  activeVersion: number;
  activeReviewVersion?: number;
  orderId: string;
  projectId: string | null;
  orderStatus: OrderStatus;
  reviewCompleted: boolean;
  uploadUI: ReviewerVersionUploadUI;
  fileRef: RefObject<HTMLInputElement | null>;
  onSelectVersion: (version: number) => void;
  onRequestRevision: () => void;
  onApproveSuccess?: (message: string) => void;
  onApproveError?: (message: string) => void;
  onOrderStatusChange?: (status: OrderStatus) => void;
  revisionPending?: boolean;
  onFileInputChange: () => void;
  onUploadFile: (file: File) => void;
  onCancelUpload: () => void;
  onOpenPicker: () => void;
  replaceUploadVersion?: number | null;
  videoPlaybackFailed?: boolean;
  onRevertUpload?: () => void;
  revertPending?: boolean;
  onViewReviewRecords?: () => void;
  brandReviewRequestPending?: boolean;
  canRevertUpload?: boolean;
  paidRevisionSlotsUnlocked?: number;
  openBrandCommentCount?: number;
  onUnlockPaidRevision?: () => void;
  unlockPending?: boolean;
}) {
  const t = copy[locale];
  const revertPolicy = creatorRevertUploadPolicyNotice(locale);
  const versionByNumber = new Map(versions.map((item) => [item.version, item]));
  const latestUploadedVersion = latestUploadedDeliverableVersion(versions);
  const latestSubmittedVersion = latestSubmittedDeliverableVersion(versions);
  const { uploadContext, maxOpenWorkflowSlot, reviewAnchorVersion } = (() => {
    const ctx = resolveCreatorUploadContext({
      deliverables: versions,
      orderStatus,
      activeVersion,
      maxVersions: MAX_CAMPAIGN_VERSIONS,
      role,
      paidSlotsUnlocked: paidRevisionSlotsUnlocked,
      replaceUploadVersion,
      videoPlaybackFailed
    });
    const openSlot = resolveMaxOpenReviewWorkflowSlot({
      deliverables: versions,
      orderStatus,
      latestSubmittedVersion,
      uploadContext: ctx
    });
    const anchorVersion = (() => {
      if (ctx.isReplace) return ctx.uploadVersion;
      if (reviewCompleted && latestSubmittedVersion > 0) return latestSubmittedVersion;
      if (orderStatus === "review" && latestSubmittedVersion > 0) return latestSubmittedVersion;
      if (orderStatus === "revision") {
        return ctx.canUpload ? ctx.uploadVersion : Math.max(latestSubmittedVersion + 1, 1);
      }
      return activeReviewVersion || latestSubmittedVersion || activeVersion;
    })();
    return { uploadContext: ctx, maxOpenWorkflowSlot: openSlot, reviewAnchorVersion: anchorVersion };
  })();
  const slots = Array.from({ length: MAX_CAMPAIGN_VERSIONS }, (_, index) => index + 1);
  const paidPackUnlocked = paidRevisionSlotsUnlocked >= 1;
  const revisionGate = assertRevisionRequestAllowed({
    currentVersionNumber: latestSubmittedVersion,
    paidSlotsUnlocked: paidRevisionSlotsUnlocked
  });
  const showBrandPaidUnlock =
    role === "brand" &&
    !reviewCompleted &&
    orderStatus === "review" &&
    activeVersion === latestSubmittedVersion &&
    latestSubmittedVersion > 0 &&
    !revisionGate.ok &&
    revisionGate.code === "PAYMENT_REQUIRED";
  const canBrandActOnVersion =
    role === "brand" &&
    !reviewCompleted &&
    orderStatus === "review" &&
    activeVersion === latestUploadedVersion &&
    latestUploadedVersion > 0 &&
    (revisionGate.ok || revisionGate.code === "REVIEW_LOCKED");
  const revisionRequestLocked =
    role === "brand" &&
    orderStatus === "review" &&
    activeVersion === latestSubmittedVersion &&
    !revisionGate.ok &&
    revisionGate.code === "REVIEW_LOCKED";
  const mustProcessBrandComments =
    role === "creator" &&
    orderStatus === "revision" &&
    uploadContext.canUpload &&
    openBrandCommentCount > 0;
  const canCreatorUpload = !reviewCompleted && uploadContext.canUpload && !mustProcessBrandComments;
  const showBrandActionCards = canBrandActOnVersion;
  const showBrandWaitingForStudio =
    role === "brand" &&
    !reviewCompleted &&
    orderStatus === "revision" &&
    activeVersion === latestUploadedVersion &&
    latestUploadedVersion > 0;
  const showCreatorSubmittedReviewPhase =
    role === "creator" &&
    !reviewCompleted &&
    orderStatus === "review" &&
    latestSubmittedVersion > 0 &&
    activeVersion === latestSubmittedVersion;
  const showCreatorReplaceAfterFailure =
    showCreatorSubmittedReviewPhase && uploadContext.canUpload && uploadContext.isReplace;
  const showCreatorWaitingForBrand =
    showCreatorSubmittedReviewPhase && !showCreatorReplaceAfterFailure;
  const showCreatorWaitingForPaidUnlock =
    role === "creator" &&
    !reviewCompleted &&
    orderStatus === "revision" &&
    activeVersion === latestSubmittedVersion &&
    latestSubmittedVersion > 0 &&
    !uploadContext.canUpload &&
    !revisionGate.ok &&
    revisionGate.code === "PAYMENT_REQUIRED";
  const showReadyForCompletion =
    role === "brand" && !reviewCompleted && orderStatus === "ready_for_completion";
  const creatorUploadLabel = uploadContext.isReplace
    ? uploadContext.isFirstDraft
      ? t.reuploadFirstDraft
      : `${t.reuploadDraft} V${uploadContext.uploadVersion}`
    : uploadContext.isFirstDraft
      ? t.uploadFirstDraft
      : `${t.uploadNext} V${uploadContext.uploadVersion}`;
  const creatorUploadSubtitle = uploadContext.isReplace
    ? `${t.reuploadHint} · ${t.formats} · ${t.maxSize}`
    : `${t.formats} · ${t.maxSize}`;
  const confirmLabel =
    locale === "zh" ? `确认${draftLabel(locale, activeVersion)}修改` : `Confirm ${draftLabel(locale, activeVersion)} changes`;
  const finalDownloadVersion = latestSubmittedVersion || activeVersion;
  const finalDownloadHref = `/api/review-video/${orderId}/${finalDownloadVersion}?download=1`;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [directApproveConfirmOpen, setDirectApproveConfirmOpen] = useState(false);
  const [continueRevisionConfirmOpen, setContinueRevisionConfirmOpen] = useState(false);
  const [preview, setPreview] = useState<ReviewSettlementPreview | null>(null);
  const [approvePending, startApproveTransition] = useTransition();

  function markReadyForCompletion() {
    if (!canBrandActOnVersion && !showBrandPaidUnlock) return;
    startApproveTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", orderId);
      const result = await markReviewReadyForCompletionAction(fd);
      if (!result.ok) {
        onApproveError?.(result.error);
        return;
      }
      onOrderStatusChange?.(result.orderStatus);
      onApproveSuccess?.(result.message);
    });
  }

  function openSettlementDialog() {
    startApproveTransition(async () => {
      const result = await getReviewSettlementPreviewAction({
        lang: locale,
        orderId,
        projectId: projectId ?? undefined,
        version: activeVersion
      });
      if (!result.ok) {
        onApproveError?.(result.error);
        return;
      }
      setPreview(result.preview);
      setDialogOpen(true);
    });
  }

  function resumeReview() {
    startApproveTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", orderId);
      const result = await resumeReviewFromReadyAction(fd);
      if (!result.ok) {
        onApproveError?.(result.error);
        return;
      }
      setDialogOpen(false);
      onOrderStatusChange?.(result.orderStatus);
      onApproveSuccess?.(result.message);
    });
  }

  function openSubmitConfirm() {
    if (brandReviewRequestPending || !onViewReviewRecords) return;
    if (!canRevertUpload) {
      onViewReviewRecords();
      return;
    }
    setSubmitConfirmOpen(true);
  }

  function confirmSubmitForBrandReview() {
    setSubmitConfirmOpen(false);
    onViewReviewRecords?.();
  }

  function confirmContinueRevision() {
    setContinueRevisionConfirmOpen(false);
    onUnlockPaidRevision?.();
  }

  function confirmDirectApprove() {
    setDirectApproveConfirmOpen(false);
    markReadyForCompletion();
  }

  function confirmApprove() {
    startApproveTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", orderId);
      if (projectId) fd.set("project_id", projectId);
      fd.set("version", String(activeVersion));

      const result = await confirmReviewApproveAndSettleAction(fd);
      if (!result.ok) {
        onApproveError?.(result.error);
        return;
      }

      setDialogOpen(false);
      onOrderStatusChange?.("completed");
      onApproveSuccess?.(result.message);
    });
  }

  return (
    <section className="shrink-0 space-y-4 overflow-hidden border-t border-zinc-200 bg-white px-4 py-4 md:px-5 lg:pr-8">
      <ReviewerApproveSettlementDialog
        locale={locale}
        open={dialogOpen}
        pending={approvePending}
        preview={preview}
        onOpenChange={setDialogOpen}
        onConfirm={confirmApprove}
        onResumeReview={resumeReview}
      />
      <Dialog open={directApproveConfirmOpen} onOpenChange={setDirectApproveConfirmOpen}>
        <DialogContent className="w-[min(88vw,360px)] overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-[0_16px_44px_rgba(15,23,42,0.20)]">
          <div className="px-6 pb-5 pt-6 text-center">
            <div className="relative mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-emerald-100/70" />
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-[0_8px_18px_rgba(16,185,129,0.22)]">
                <Play className="h-4 w-4 fill-white text-white" strokeWidth={2.2} />
              </span>
            </div>
            <DialogHeader className="items-center space-y-0 text-center">
              <DialogTitle className="max-w-[280px] text-base font-semibold leading-6 tracking-tight text-zinc-900">
                {locale === "zh" ? "确认无需修改，直接通过？" : "Approve without changes?"}
              </DialogTitle>
              <DialogDescription className="mt-3 max-w-[280px] text-xs leading-5 text-zinc-500">
                {locale === "zh"
                  ? "确认后本稿将进入最终确认流程，如仍需修改请取消并添加批注。"
                  : "After confirming, this draft moves to final confirmation. Cancel if you still need changes."}
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="grid grid-cols-2 gap-3 border-t border-zinc-100 px-5 py-3 sm:space-x-0">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-600 shadow-sm transition hover:bg-zinc-50"
              onClick={() => setDirectApproveConfirmOpen(false)}
            >
              {locale === "zh" ? "取消" : "Cancel"}
            </button>
            <button
              type="button"
              disabled={approvePending}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(16,185,129,0.22)] transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={confirmDirectApprove}
            >
              {approvePending
                ? locale === "zh"
                  ? "确认中..."
                  : "Confirming..."
                : locale === "zh"
                  ? "确认通过"
                  : "Approve"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={submitConfirmOpen} onOpenChange={setSubmitConfirmOpen}>
        <DialogContent className="w-[min(88vw,380px)] overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-[0_16px_44px_rgba(15,23,42,0.20)]">
          <div className="px-6 pb-5 pt-6 text-center">
            <div className="relative mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-orange-100/70" />
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-[0_8px_18px_rgba(249,115,22,0.22)]">
                <AlertTriangle className="h-5 w-5" strokeWidth={2.2} />
              </span>
            </div>
            <DialogHeader className="items-center space-y-0 text-center">
              <DialogTitle
                className={cn(
                  "tracking-tight text-zinc-600",
                  locale === "zh"
                    ? "max-w-[300px] text-lg font-medium leading-[1.65]"
                    : "max-w-[300px] text-lg font-semibold leading-tight text-zinc-900"
                )}
              >
                {locale === "zh" ? (
                  <>
                    请确认当前上传版本是正确版本
                    <br />
                    确认提交后将无法返回上传视频
                  </>
                ) : (
                  "Confirm before submitting"
                )}
              </DialogTitle>
              {locale === "en" ? (
                <DialogDescription className="mt-3 max-w-[290px] text-xs leading-5 text-zinc-500">
                  Please make sure this is the correct version. After submitting, you cannot return to upload again.
                </DialogDescription>
              ) : null}
            </DialogHeader>
            <div className="mx-auto mt-4 flex max-w-[300px] items-center gap-2.5 rounded-xl border border-orange-100 bg-orange-50/35 px-3 py-2.5 text-left">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                <FileWarning className="h-4 w-4" strokeWidth={2} />
              </span>
              <p className="text-xs leading-relaxed text-zinc-500">
                {locale === "zh" ? (
                  <>
                    提交后将进入 <span className="font-semibold text-orange-600">项目方批阅流程</span>，请耐心等待反馈。
                  </>
                ) : (
                  <>
                    Enters <span className="font-semibold text-orange-600">brand review</span>. Please wait for feedback.
                  </>
                )}
              </p>
            </div>
          </div>
          <DialogFooter className="grid grid-cols-2 gap-3 border-t border-zinc-100 px-5 py-3 sm:space-x-0">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-600 shadow-sm transition hover:bg-zinc-50"
              onClick={() => setSubmitConfirmOpen(false)}
            >
              <RotateCcw className="h-3.5 w-3.5 text-zinc-400" strokeWidth={2.2} />
              {locale === "zh" ? "再检查一下" : "Review again"}
            </button>
            <button
              type="button"
              disabled={brandReviewRequestPending}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(124,58,237,0.22)] transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-70"
              onClick={confirmSubmitForBrandReview}
            >
              <Send className="h-3.5 w-3.5" strokeWidth={2.3} />
              {locale === "zh" ? "确认提交" : "Submit"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={continueRevisionConfirmOpen} onOpenChange={setContinueRevisionConfirmOpen}>
        <DialogContent className="w-[min(88vw,360px)] overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-[0_16px_44px_rgba(15,23,42,0.20)]">
          <div className="px-6 pb-5 pt-6 text-center">
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <AlertTriangle className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <DialogHeader className="items-center space-y-0 text-center">
              <DialogTitle className="text-base font-semibold tracking-tight text-zinc-900">
                {`${t.unlockPaidRevision} · ${revisionGate.nextRevisionRound ? (locale === "zh" ? `第${revisionGate.nextRevisionRound}轮` : `Round ${revisionGate.nextRevisionRound}`) : ""}`}
              </DialogTitle>
              <DialogDescription className="mt-3 max-w-[280px] text-sm leading-6 text-zinc-500">
                {t.unlockPaidRevisionHint}
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="grid grid-cols-2 gap-3 border-t border-zinc-100 px-5 py-3 sm:space-x-0">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-600 shadow-sm transition hover:bg-zinc-50"
              onClick={() => setContinueRevisionConfirmOpen(false)}
            >
              {locale === "zh" ? "取消" : "Cancel"}
            </button>
            <button
              type="button"
              disabled={unlockPending}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-violet-600 px-3 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(124,58,237,0.22)] transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={confirmContinueRevision}
            >
              {unlockPending
                ? locale === "zh"
                  ? "支付中..."
                  : "Paying..."
                : locale === "zh"
                  ? "确认加购"
                  : "Confirm add-on"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-w-0 overflow-hidden px-1 sm:px-2">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900">{t.versionFlow}</h3>
        <ol className="relative grid min-w-0 grid-cols-5 gap-0 before:absolute before:left-[10%] before:right-[10%] before:top-4 before:h-px before:bg-zinc-200 before:content-[''] sm:before:top-[1.125rem]">
          {slots.map((versionNumber) => {
            const item = versionByNumber.get(versionNumber);
            const isSubmitted = Boolean(item && !isUnsubmittedDeliverable(item));
            const isApprovedFinal =
              reviewCompleted && isSubmitted && versionNumber === latestSubmittedVersion;
            const isCurrentReviewStep =
              isSubmitted &&
              versionNumber === reviewAnchorVersion &&
              !reviewCompleted &&
              orderStatus === "review" &&
              !isAwaitingCreatorFirstDraft({ deliverables: versions, orderStatus });
            const isCurrentRevisionStep =
              versionNumber === reviewAnchorVersion &&
              !reviewCompleted &&
              orderStatus === "revision" &&
              (isSubmitted ||
                (uploadContext.isReplace && uploadContext.uploadVersion === versionNumber));
            const isLockedSlot = versionNumber > maxOpenWorkflowSlot;
            const lockReason = resolveReviewVersionSlotLockReason({
              versionNumber,
              workflowLocked: isLockedSlot,
              paidSlotsUnlocked: paidRevisionSlotsUnlocked
            });
            const statusText = !item
              ? lockReason === "payment"
                ? reviewSlotSecondaryLabel(locale, versionNumber, {
                    lockReason,
                    paidPackUnlocked
                  })
                : lockReason === "exhausted"
                  ? t.locked
                  : isLockedSlot
                    ? t.locked
                    : t.pendingUpload
              : isLockedSlot && !isSubmitted
                ? t.locked
                : !isSubmitted
                  ? t.pendingUpload
                  : isApprovedFinal
                    ? t.approvedFinal
                    : isCurrentReviewStep
                      ? t.currentReview
                      : isCurrentRevisionStep
                        ? t.revisionInProgress
                        : isSubmitted &&
                            versionNumber < latestSubmittedVersion &&
                            !isCurrentReviewStep &&
                            !isCurrentRevisionStep
                          ? t.done
                          : t.done;
            const isSlotInteractive = Boolean(item && isSubmitted && !isLockedSlot);

            return (
              <li key={versionNumber} className="min-w-0 overflow-hidden">
                <button
                  type="button"
                  disabled={!isSlotInteractive}
                  onClick={() => isSlotInteractive && onSelectVersion(versionNumber)}
                  className={cn(
                    "flex w-full flex-col items-center text-center",
                    isSlotInteractive ? "cursor-pointer" : "cursor-default"
                  )}
                >
                  <div className="relative flex w-full min-w-0 items-center justify-center">
                    <span
                      className={cn(
                        "relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold sm:h-9 sm:w-9",
                        isApprovedFinal
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : isCurrentReviewStep
                          ? "border-violet-600 bg-violet-600 text-white"
                          : isCurrentRevisionStep
                            ? "border-amber-500 bg-amber-500 text-white"
                          : isSubmitted
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-zinc-200 bg-white text-zinc-400"
                      )}
                    >
                      {versionNumber}
                    </span>
                  </div>
                  <p className="mt-2 flex items-center justify-center gap-0.5 truncate text-[11px] font-semibold text-zinc-800 sm:text-xs">
                    {draftLabel(locale, versionNumber)}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 truncate text-[10px] sm:text-[11px]",
                      isApprovedFinal
                        ? "font-medium text-emerald-700"
                        : isCurrentReviewStep
                        ? "font-medium text-violet-600"
                        : isCurrentRevisionStep
                          ? "font-medium text-amber-600"
                          : isSubmitted
                            ? "text-emerald-600"
                            : "text-zinc-400"
                    )}
                  >
                    {statusText}
                  </p>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {reviewCompleted ? (
        <div className="space-y-3">
          <div className="flex min-h-[88px] items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm text-emerald-800">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span>
              <span className="block font-semibold">{t.reviewCompletedTitle}</span>
              <span className="mt-1 block text-xs leading-relaxed text-emerald-700/90">
                {role === "brand" ? t.brandReviewCompletedHint : t.creatorReviewCompletedHint}
              </span>
            </span>
          </div>
          {role === "brand" ? (
            <a
              href={finalDownloadHref}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center gap-4 rounded-2xl border border-emerald-200 bg-white px-5 py-4 text-left transition hover:border-emerald-300 hover:shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Download className="h-5 w-5" strokeWidth={2.4} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-emerald-700">{t.downloadOriginal}</span>
                <span className="mt-1 block text-xs leading-relaxed text-zinc-500">{t.downloadOriginalHint}</span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600">
                <ChevronRight className="h-4 w-4" />
              </span>
            </a>
          ) : null}
        </div>
      ) : showReadyForCompletion ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            {locale === "zh"
              ? "已进入等待最终确认。若仍有修改意见，请返回继续审批；否则请确认最终交付。"
              : "Ready for final confirmation. Return to review if changes are needed, or confirm final delivery."}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <PortalVersionActionCard
              borderClass="border-zinc-200"
              title={locale === "zh" ? "返回继续审批" : "Return to review"}
              titleClass="text-zinc-700"
              hint={locale === "zh" ? "继续添加批注或要求修改" : "Add notes or request changes"}
              pending={approvePending}
              onClick={resumeReview}
              icon={
                <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-zinc-300 text-zinc-600">
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </span>
              }
            />
            <PortalVersionActionCard
              borderClass="border-emerald-200"
              title={locale === "zh" ? "确认最终交付" : "Confirm final delivery"}
              titleClass="text-emerald-700"
              hint={locale === "zh" ? "进入结算并开放下载" : "Start settlement and open downloads"}
              pending={approvePending}
              onClick={openSettlementDialog}
              icon={
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                </span>
              }
            />
          </div>
        </div>
      ) : showBrandPaidUnlock ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="font-semibold">{t.paidRevisionChoiceTitle}</span>
            <span className="ml-2 text-xs text-amber-800/80">{t.paidRevisionChoiceHint}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <PortalVersionActionCard
              borderClass="border-emerald-200"
              title={t.confirmReceipt}
              titleClass="text-emerald-700"
              hint={t.confirmReceiptHint}
              pending={approvePending}
              onClick={markReadyForCompletion}
              icon={
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                </span>
              }
            />
            <PortalVersionActionCard
              borderClass="border-violet-200"
              title={t.continueEditing}
              titleClass="text-violet-700"
              hint={t.continueEditingHint}
              pending={unlockPending}
              onClick={() => setContinueRevisionConfirmOpen(true)}
              icon={
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-white">
                  <ChevronRight className="h-5 w-5" />
                </span>
              }
            />
          </div>
        </div>
      ) : showBrandActionCards ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {revisionRequestLocked ? (
            <div className="flex min-h-[88px] items-center rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              <Clock className="mr-2 h-5 w-5 shrink-0 text-amber-600" />
              {locale === "zh"
                ? "已到第 5 稿上限，不能再要求创作者上传下一稿；请确认交付或联系平台介入。"
                : "Draft 5 is the final revision round. You cannot request another upload; approve delivery or contact platform support."}
            </div>
          ) : (
            <PortalVersionActionCard
              borderClass="border-violet-200"
              title={confirmLabel}
              titleClass="text-violet-700"
              hint={t.confirmRevisionHint}
              pending={revisionPending}
              onClick={onRequestRevision}
              icon={
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-white">
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                </span>
              }
            />
          )}
          <PortalVersionActionCard
            borderClass="border-zinc-200"
            title={t.approve}
            titleClass="text-emerald-600"
            hint={t.approveHint}
            pending={approvePending}
            onClick={() => setDirectApproveConfirmOpen(true)}
            icon={
              <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-emerald-500 text-emerald-600">
                <Play className="h-4 w-4 fill-emerald-600 text-emerald-600" />
              </span>
            }
          />
        </div>
      ) : showBrandWaitingForStudio ? (
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-4 text-left">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-violet-600 shadow-sm ring-1 ring-zinc-200">
            <Clock className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-zinc-800">
              {locale === "zh" ? "修改意见已提交" : "Revision notes submitted"}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
              {locale === "zh" ? "创作者正在准备下一稿，上传后会进入下一轮审片。" : "Studio is preparing the next draft. Review will continue after it is uploaded."}
            </span>
          </span>
        </div>
      ) : showCreatorReplaceAfterFailure ? (
        <div className="space-y-4">
          <ReviewerVersionUploadZone
            locale={locale}
            variant="panel"
            uploadLabel={creatorUploadLabel}
            panelTitle={t.reuploadHint}
            panelSubtitle={creatorUploadSubtitle}
            inputId="review-portal-upload"
            fileRef={fileRef}
            uploadUI={uploadUI}
            onFileInputChange={onFileInputChange}
            onUploadFile={onUploadFile}
            onCancelUpload={onCancelUpload}
            onOpenPicker={onOpenPicker}
          />
          {canRevertUpload ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={revertPending}
                  onClick={onRevertUpload}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-wait disabled:opacity-70"
                >
                  <Upload className="h-4 w-4" />
                  {t.revertUpload}
                </button>
                <button
                  type="button"
                  disabled={brandReviewRequestPending}
                  onClick={openSubmitConfirm}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-70"
                >
                  <UploadCloud className="h-4 w-4" />
                  {t.viewReviewRecords}
                </button>
              </div>
              <p className="text-center text-xs leading-relaxed text-zinc-500">{revertPolicy.hint}</p>
            </>
          ) : null}
        </div>
      ) : showCreatorWaitingForBrand ? (
        <div className="space-y-4">
          <div className="flex min-h-[72px] items-center justify-center rounded-2xl border border-dashed border-violet-100 bg-violet-50/40 px-4 py-4 text-sm text-violet-700">
            <Clock className="mr-2 h-5 w-5 shrink-0 text-violet-500" />
            {t.waitingBrandReview}
          </div>
          {canRevertUpload ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={revertPending}
                  onClick={onRevertUpload}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-wait disabled:opacity-70"
                >
                  <Upload className="h-4 w-4" />
                  {t.revertUpload}
                </button>
                <button
                  type="button"
                  disabled={brandReviewRequestPending}
                  onClick={openSubmitConfirm}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-70"
                >
                  <UploadCloud className="h-4 w-4" />
                  {t.viewReviewRecords}
                </button>
              </div>
              <p className="text-center text-xs leading-relaxed text-zinc-500">{revertPolicy.hint}</p>
            </>
          ) : (
            <p className="text-center text-xs leading-relaxed text-violet-600">
              {locale === "zh" ? "已提交给项目方批阅，请等待处理。" : "Submitted to the brand. Please wait for review."}
            </p>
          )}
        </div>
      ) : showCreatorWaitingForPaidUnlock ? (
        <div className="flex min-h-[88px] items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-900">
          <Clock className="mr-2 h-5 w-5 shrink-0 text-amber-600" />
          {t.waitingPaidUnlock}
        </div>
      ) : mustProcessBrandComments ? (
        <div className="flex min-h-[88px] items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 py-5 text-center text-sm text-amber-900">
          <Clock className="mr-2 h-5 w-5 shrink-0 text-amber-600" />
          {t.processCommentsBeforeUpload}
        </div>
      ) : canCreatorUpload ? (
        <ReviewerVersionUploadZone
          locale={locale}
          variant="panel"
          uploadLabel={creatorUploadLabel}
          panelTitle={uploadContext.isReplace ? t.reuploadHint : t.uploadPanelHint}
          panelSubtitle={creatorUploadSubtitle}
          inputId="review-portal-upload"
          fileRef={fileRef}
          uploadUI={uploadUI}
          onFileInputChange={onFileInputChange}
          onUploadFile={onUploadFile}
          onCancelUpload={onCancelUpload}
          onOpenPicker={onOpenPicker}
        />
      ) : (
        <div className="flex min-h-[88px] items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
          <UploadCloud className="mr-2 h-5 w-5 text-zinc-400" />
          {role === "brand"
            ? locale === "zh"
              ? "等待创作者上传下一稿"
              : "Waiting for Studio to upload the next draft"
            : locale === "zh"
              ? "当前无需操作"
              : "No action needed right now"}
        </div>
      )}
    </section>
  );
}
