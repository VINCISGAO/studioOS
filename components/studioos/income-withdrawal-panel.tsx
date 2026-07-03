"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Loader2
} from "lucide-react";
import {
  addPayoutMethodAction,
  cancelWithdrawalAction,
  deletePayoutMethodAction,
  setDefaultPayoutMethodAction,
  submitWithdrawalAction,
  updatePayoutMethodAction
} from "@/app/withdrawal-actions";
import { IncomeFinancialHero } from "@/components/studioos/income-financial-hero";
import { IncomePayoutMethodsSection } from "@/components/studioos/income-payout-methods-section";
import { IncomeWithdrawalHistorySection } from "@/components/studioos/income-withdrawal-history-section";
import { PayoutQrUploadField } from "@/components/studioos/payout-qr-upload-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { Locale } from "@/lib/i18n";
import {
  computeWithdrawalFee,
  estimateCryptoAmount,
  payoutMethodSummary
} from "@/lib/studioos/withdrawal-utils";
import type {
  CreatorIncomeSnapshot,
  CryptoAsset,
  CryptoNetwork,
  PayoutMethod,
  PayoutMethodType,
  WithdrawalRequest,
  WithdrawalStatus
} from "@/lib/studioos/withdrawal-types";
import { cn, formatCurrency } from "@/lib/utils";

const PAYOUT_METHOD_TYPES: PayoutMethodType[] = ["alipay", "wechat", "paypal", "bank_wire", "crypto"];

const copy = {
  en: {
    available: "Available to withdraw",
    held: "Held in escrow",
    pending: "Pending withdrawal",
    lifetime: "Lifetime withdrawn",
    withdraw: "Withdraw funds",
    payoutMethods: "Payout methods",
    payoutMethodsBody: "Add a bank account, PayPal, Alipay, WeChat Pay, or crypto wallet before withdrawing.",
    addMethod: "Add payout method",
    bank: "Bank transfer",
    paypal: "PayPal",
    alipay: "Alipay",
    wechat: "WeChat Pay",
    crypto: "Cryptocurrency",
    default: "Default",
    history: "Withdrawal history",
    historyEmpty: "No withdrawals yet.",
    stepAmount: "Amount & method",
    stepReview: "Review",
    stepConfirm: "Confirm",
    stepDone: "Submitted",
    amountLabel: "Withdrawal amount (USD)",
    methodLabel: "Payout method",
    minHint: "Minimum",
    maxHint: "Available",
    continue: "Continue",
    back: "Back",
    submit: "Submit withdrawal",
    confirmCheck: "I confirm the payout details and understand this request cannot be changed once processing starts.",
    fee: "Platform / network fee",
    net: "You receive",
    estimated: "Estimated arrival",
    cryptoReceive: "Crypto payout",
    successTitle: "Withdrawal submitted",
    successBody: "Your request is under review. Track status below — demo requests auto-advance in ~20 seconds.",
    close: "Close",
    cancel: "Cancel withdrawal",
    accountLabel: "Account label",
    accountHolder: "Account holder name",
    bankName: "Bank name",
    accountNumber: "Account number",
    routingNumber: "Routing / SWIFT",
    swift: "SWIFT / BIC (optional)",
    paypalEmail: "PayPal email",
    alipayAccount: "Alipay account",
    alipayAccountHint: "Phone number, email, or upload a QR code — at least one required",
    wechatAccount: "WeChat account",
    wechatAccountHint: "Phone number, WeChat ID, or upload a QR code — at least one required",
    cryptoAsset: "Asset",
    cryptoNetwork: "Network",
    walletAddress: "Wallet address",
    setDefault: "Set as default",
    saveMethod: "Save payout method",
    noMethods: "Add a payout method to withdraw.",
    eyebrow: "Studio treasury",
    balanceLabel: "Available balance",
    readyToWithdraw: "Ready to withdraw",
    escrowNote: "Escrow releases after brand approval",
    secured: "Secured by platform escrow",
    methodsCount: "Payout methods",
    recentActivity: "Recent activity",
    emptyMethodsTitle: "Connect a payout method",
    emptyMethodsBody: "Add bank, PayPal, Alipay, WeChat Pay, or crypto to receive your earnings.",
    emptyHistoryTitle: "No withdrawals yet",
    emptyHistoryBody: "When you withdraw, transactions will appear here with live status.",
    methodAdded: "Payout method saved",
    methodUpdated: "Payout method updated",
    editMethod: "Edit payout method",
    edit: "Edit",
    setDefaultAction: "Set as default",
    removeMethod: "Remove",
    walletHint: "Example TRC20: TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
    bankAccountHint: "Leave blank to keep current ending digits",
    typeLocked: "Payout type cannot be changed after creation",
    status: {
      pending: "Pending review",
      under_review: "Under review",
      processing: "Processing",
      completed: "Completed",
      failed: "Failed",
      cancelled: "Cancelled"
    } as Record<WithdrawalStatus, string>
  },
  zh: {
    available: "可提现余额",
    held: "托管中",
    pending: "提现处理中",
    lifetime: "累计已提现",
    withdraw: "申请提现",
    payoutMethods: "收款方式",
    payoutMethodsBody: "提现前需添加银行账户、PayPal、支付宝、微信或加密货币钱包。",
    addMethod: "添加收款方式",
    bank: "银行转账",
    paypal: "PayPal",
    alipay: "支付宝",
    wechat: "微信",
    crypto: "加密货币",
    default: "默认",
    history: "提现记录",
    historyEmpty: "暂无提现记录。",
    stepAmount: "金额与方式",
    stepReview: "核对信息",
    stepConfirm: "确认提交",
    stepDone: "已提交",
    amountLabel: "提现金额（USD）",
    methodLabel: "收款方式",
    minHint: "最低",
    maxHint: "可用",
    continue: "下一步",
    back: "上一步",
    submit: "提交提现",
    confirmCheck: "我已核对收款信息，并了解进入处理阶段后将无法修改。",
    fee: "平台 / 网络手续费",
    net: "实际到账",
    estimated: "预计到账",
    cryptoReceive: "加密货币到账",
    successTitle: "提现申请已提交",
    successBody: "你的申请正在审核中。可在下方查看状态 — Demo 环境约 20 秒内自动推进。",
    close: "关闭",
    cancel: "取消提现",
    accountLabel: "账户备注名",
    accountHolder: "开户名",
    bankName: "银行名称",
    accountNumber: "银行账号",
    routingNumber: "Routing / SWIFT",
    swift: "SWIFT / BIC（可选）",
    paypalEmail: "PayPal 邮箱",
    alipayAccount: "支付宝账号",
    alipayAccountHint: "手机号、邮箱或上传收款码，至少填一项",
    wechatAccount: "微信账号",
    wechatAccountHint: "手机号、微信号或上传收款码，至少填一项",
    cryptoAsset: "币种",
    cryptoNetwork: "网络",
    walletAddress: "钱包地址",
    setDefault: "设为默认",
    saveMethod: "保存收款方式",
    noMethods: "请先添加收款方式。",
    eyebrow: "Studio 财务中心",
    balanceLabel: "可提现余额",
    readyToWithdraw: "可立即提现",
    escrowNote: "托管资金在 Brand 验收通过后释放",
    secured: "平台托管保障",
    methodsCount: "收款方式",
    recentActivity: "最近动态",
    emptyMethodsTitle: "连接收款方式",
    emptyMethodsBody: "添加银行、PayPal、支付宝、微信或加密货币钱包以接收收入。",
    emptyHistoryTitle: "暂无提现记录",
    emptyHistoryBody: "发起提现后，交易状态会在这里实时更新。",
    methodAdded: "收款方式已保存",
    methodUpdated: "收款方式已更新",
    editMethod: "编辑收款方式",
    edit: "编辑",
    setDefaultAction: "设为默认",
    removeMethod: "删除",
    walletHint: "TRC20 示例：TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
    bankAccountHint: "留空则保留当前账号末四位",
    typeLocked: "创建后不可更改收款类型",
    status: {
      pending: "待审核",
      under_review: "审核中",
      processing: "打款中",
      completed: "已完成",
      failed: "失败",
      cancelled: "已取消"
    } as Record<WithdrawalStatus, string>
  }
};

type WithdrawStep = "amount" | "review" | "confirm" | "done";

export function IncomeWithdrawalPanel({
  locale,
  snapshot,
  payoutMethods,
  withdrawals
}: {
  locale: Locale;
  snapshot: CreatorIncomeSnapshot;
  payoutMethods: PayoutMethod[];
  withdrawals: WithdrawalRequest[];
}) {
  const t = copy[locale];
  const router = useRouter();
  const [methods, setMethods] = useState(payoutMethods);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [methodDialogError, setMethodDialogError] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PayoutMethod | null>(null);
  const [step, setStep] = useState<WithdrawStep>("amount");
  const [amount, setAmount] = useState("");
  const [methodId, setMethodId] = useState(payoutMethods.find((m) => m.is_default)?.id ?? payoutMethods[0]?.id ?? "");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [methodType, setMethodType] = useState<PayoutMethodType>(locale === "zh" ? "alipay" : "paypal");
  const [cryptoAsset, setCryptoAsset] = useState<CryptoAsset>("USDT");
  const [cryptoNetwork, setCryptoNetwork] = useState<CryptoNetwork>("TRC20");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMethods(payoutMethods);
    const defaultMethod = payoutMethods.find((m) => m.is_default) ?? payoutMethods[0];
    if (defaultMethod) {
      setMethodId(defaultMethod.id);
    }
  }, [payoutMethods]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }
    const timer = window.setTimeout(() => setSuccessMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const selectedMethod = methods.find((item) => item.id === methodId) ?? null;
  const parsedAmount = Number(amount);
  const fee = selectedMethod && Number.isFinite(parsedAmount) ? computeWithdrawalFee(selectedMethod.type, parsedAmount) : 0;
  const net = Number.isFinite(parsedAmount) ? Math.max(0, Math.round((parsedAmount - fee) * 100) / 100) : 0;

  const cryptoPreview = useMemo(() => {
    if (!selectedMethod?.crypto_asset || !net) {
      return null;
    }
    return {
      asset: selectedMethod.crypto_asset,
      network: selectedMethod.crypto_network,
      amount: estimateCryptoAmount(selectedMethod.crypto_asset, net),
      address: selectedMethod.wallet_address ?? ""
    };
  }, [selectedMethod, net]);

  function resetWithdrawFlow() {
    setStep("amount");
    setAmount(
      snapshot.available_usd >= snapshot.min_withdrawal_usd ? String(snapshot.available_usd) : ""
    );
    setConfirmed(false);
    setError(null);
  }

  function openWithdraw() {
    resetWithdrawFlow();
    setMethodId(methods.find((m) => m.is_default)?.id ?? methods[0]?.id ?? "");
    setWithdrawOpen(true);
  }

  function validateAmountStep() {
    if (!selectedMethod) {
      setError(t.noMethods);
      return false;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount < snapshot.min_withdrawal_usd) {
      setError(`${t.minHint} $${snapshot.min_withdrawal_usd}`);
      return false;
    }
    if (parsedAmount > snapshot.available_usd) {
      setError(locale === "zh" ? "超过可提现余额" : "Exceeds available balance");
      return false;
    }
    setError(null);
    return true;
  }

  function handleSubmitWithdrawal() {
    startTransition(async () => {
      const result = await submitWithdrawalAction(
        objectToFormData({
          lang: locale,
          payout_method_id: methodId,
          amount_usd: String(parsedAmount),
          confirmed: confirmed ? "1" : "0"
        })
      );

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setStep("done");
      router.refresh();
    });
  }

  function mergeSavedMethod(saved: PayoutMethod) {
    setMethods((prev) => {
      const clearedDefaults = saved.is_default
        ? prev.map((item) => ({ ...item, is_default: false }))
        : prev;
      return [saved, ...clearedDefaults.filter((item) => item.id !== saved.id)];
    });
    if (saved.is_default || !methodId) {
      setMethodId(saved.id);
    }
  }

  function updateSavedMethod(saved: PayoutMethod) {
    setMethods((prev) => {
      const clearedDefaults = saved.is_default
        ? prev.map((item) => ({ ...item, is_default: false }))
        : prev;
      return clearedDefaults.map((item) => (item.id === saved.id ? saved : item));
    });
    if (saved.is_default) {
      setMethodId(saved.id);
    }
  }

  function handleAddMethod(formData: FormData) {
    formData.set("lang", locale);
    formData.set("type", methodType);
    setMethodDialogError(null);
    startTransition(async () => {
      const result = await addPayoutMethodAction(formData);
      if (!result.ok) {
        setMethodDialogError(result.error);
        return;
      }
      mergeSavedMethod(result.method);
      setSuccessMessage(t.methodAdded);
      setMethodDialogError(null);
      setMethodOpen(false);
      router.refresh();
    });
  }

  function handleUpdateMethod(formData: FormData) {
    formData.set("lang", locale);
    if (!editingMethod) return;
    formData.set("type", editingMethod.type);
    formData.set("payout_method_id", editingMethod.id);
    setMethodDialogError(null);
    startTransition(async () => {
      const result = await updatePayoutMethodAction(formData);
      if (!result.ok) {
        setMethodDialogError(result.error);
        return;
      }
      updateSavedMethod(result.method);
      setSuccessMessage(t.methodUpdated);
      setMethodDialogError(null);
      setMethodOpen(false);
      setEditingMethod(null);
      router.refresh();
    });
  }

  function handleSaveMethod(formData: FormData) {
    if (editingMethod) {
      handleUpdateMethod(formData);
    } else {
      handleAddMethod(formData);
    }
  }

  function handleSetDefault(method: PayoutMethod) {
    startTransition(async () => {
      const result = await setDefaultPayoutMethodAction(
        objectToFormData({ lang: locale, payout_method_id: method.id })
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMethods((prev) =>
        prev.map((item) => ({ ...item, is_default: item.id === method.id }))
      );
      setMethodId(method.id);
      router.refresh();
    });
  }

  function handleRemoveMethod(method: PayoutMethod) {
    startTransition(async () => {
      const result = await deletePayoutMethodAction(
        objectToFormData({ lang: locale, payout_method_id: method.id })
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMethods((prev) => {
        const next = prev.filter((item) => item.id !== method.id);
        if (methodId === method.id) {
          setMethodId(next.find((item) => item.is_default)?.id ?? next[0]?.id ?? "");
        }
        return next;
      });
      router.refresh();
    });
  }

  function openAddMethodDialog() {
    setEditingMethod(null);
    setMethodType(locale === "zh" ? "alipay" : "paypal");
    setCryptoAsset("USDT");
    setCryptoNetwork("TRC20");
    setMethodDialogError(null);
    setMethodOpen(true);
  }

  function openEditMethodDialog(method: PayoutMethod) {
    setEditingMethod(method);
    setMethodType(method.type);
    setCryptoAsset(method.crypto_asset ?? "USDT");
    setCryptoNetwork(method.crypto_network ?? "TRC20");
    setMethodDialogError(null);
    setMethodOpen(true);
  }

  function closeMethodDialog() {
    setMethodOpen(false);
    setEditingMethod(null);
    setMethodDialogError(null);
  }

  function handleCancel(withdrawalId: string) {
    startTransition(async () => {
      await cancelWithdrawalAction(objectToFormData({ lang: locale, withdrawal_id: withdrawalId }));
      router.refresh();
    });
  }

  const steps: WithdrawStep[] = ["amount", "review", "confirm", "done"];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="space-y-6">
      <IncomeFinancialHero
        locale={locale}
        snapshot={snapshot}
        canWithdraw={snapshot.available_usd >= snapshot.min_withdrawal_usd}
        onWithdraw={openWithdraw}
        onAddMethod={openAddMethodDialog}
      />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <IncomePayoutMethodsSection
          locale={locale}
          methods={methods}
          successMessage={successMessage}
          onAddMethod={openAddMethodDialog}
          onEditMethod={openEditMethodDialog}
        />
        <IncomeWithdrawalHistorySection
          locale={locale}
          withdrawals={withdrawals}
          isPending={isPending}
          onCancel={handleCancel}
        />
      </div>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.withdraw}</DialogTitle>
            <DialogDescription>
              {step === "done" ? t.successBody : `${t.stepAmount} → ${t.stepReview} → ${t.stepConfirm}`}
            </DialogDescription>
          </DialogHeader>

          <div className="mb-2 flex gap-2">
            {steps.slice(0, 3).map((item, index) => (
              <div
                key={item}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  index <= stepIndex ? "bg-zinc-900" : "bg-zinc-200"
                )}
              />
            ))}
          </div>

          {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          {step === "amount" ? (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="withdraw-amount">{t.amountLabel}</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  min={snapshot.min_withdrawal_usd}
                  max={snapshot.available_usd}
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder={`${snapshot.min_withdrawal_usd} - ${snapshot.available_usd}`}
                />
                <p className="text-xs text-zinc-500">
                  {t.minHint} {formatCurrency(snapshot.min_withdrawal_usd)} · {t.maxHint}{" "}
                  {formatCurrency(snapshot.available_usd)}
                </p>
              </div>
              <div className="grid gap-2">
                <Label>{t.methodLabel}</Label>
                <Select value={methodId} onValueChange={setMethodId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.methodLabel} />
                  </SelectTrigger>
                  <SelectContent>
                    {methods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.label} · {payoutMethodSummary(method, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => validateAmountStep() && setStep("review")}
                disabled={!methods.length}
              >
                {t.continue} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : null}

          {step === "review" && selectedMethod ? (
            <div className="space-y-4">
              <ReviewRow label={t.amountLabel} value={formatCurrency(parsedAmount)} />
              <ReviewRow label={t.methodLabel} value={payoutMethodSummary(selectedMethod, locale)} />
              <ReviewRow label={t.fee} value={formatCurrency(fee)} />
              <ReviewRow label={t.net} value={formatCurrency(net)} highlight />
              {cryptoPreview ? (
                <ReviewRow
                  label={t.cryptoReceive}
                  value={`${cryptoPreview.amount} ${cryptoPreview.asset} (${cryptoPreview.network})`}
                />
              ) : null}
              <ReviewRow label={t.estimated} value={estimateArrivalLabel(selectedMethod.type, locale)} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep("amount")}>
                  {t.back}
                </Button>
                <Button className="flex-1" onClick={() => setStep("confirm")}>
                  {t.continue}
                </Button>
              </div>
            </div>
          ) : null}

          {step === "confirm" ? (
            <div className="space-y-4">
              <label className="flex items-start gap-3 rounded-lg border bg-zinc-50 p-4 text-sm leading-6">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                <span>{t.confirmCheck}</span>
              </label>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep("review")}>
                  {t.back}
                </Button>
                <Button className="flex-1" disabled={!confirmed || isPending} onClick={handleSubmitWithdrawal}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t.submit}
                </Button>
              </div>
            </div>
          ) : null}

          {step === "done" ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
              <p className="font-medium">{t.successTitle}</p>
              <Button className="w-full" onClick={() => setWithdrawOpen(false)}>
                {t.close}
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={methodOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeMethodDialog();
          } else {
            setMethodOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMethod ? t.editMethod : t.addMethod}</DialogTitle>
            <DialogDescription>
              {editingMethod ? t.typeLocked : t.payoutMethodsBody}
            </DialogDescription>
          </DialogHeader>

          {methodDialogError ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{methodDialogError}</p>
          ) : null}

          {editingMethod ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              {methodTypeLabel(editingMethod.type, locale)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PAYOUT_METHOD_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMethodType(type)}
                  className={cn(
                    "rounded-lg border px-3 py-3 text-center text-xs font-medium transition",
                    methodType === type
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-600"
                  )}
                >
                  {methodTypeLabel(type, locale)}
                </button>
              ))}
            </div>
          )}

          <form
            key={editingMethod?.id ?? "new-method"}
            encType="multipart/form-data"
            onSubmit={(event) => {
              event.preventDefault();
              handleSaveMethod(new FormData(event.currentTarget));
            }}
            className="space-y-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="label">{t.accountLabel}</Label>
              <Input
                id="label"
                name="label"
                required
                defaultValue={editingMethod?.label ?? ""}
                placeholder={locale === "zh" ? "例如：主钱包 USDT" : "e.g. Primary USDT wallet"}
              />
            </div>

            {(editingMethod?.type ?? methodType) === "bank_wire" ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="account_holder">{t.accountHolder}</Label>
                  <Input
                    id="account_holder"
                    name="account_holder"
                    required
                    defaultValue={editingMethod?.account_holder ?? ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bank_name">{t.bankName}</Label>
                  <Input id="bank_name" name="bank_name" required defaultValue={editingMethod?.bank_name ?? ""} />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="account_number">{t.accountNumber}</Label>
                    <Input
                      id="account_number"
                      name="account_number"
                      required={!editingMethod}
                      placeholder={
                        editingMethod?.account_last4 ? `****${editingMethod.account_last4}` : undefined
                      }
                    />
                    {editingMethod ? (
                      <p className="text-xs text-zinc-500">{t.bankAccountHint}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="routing_number">{t.routingNumber}</Label>
                    <Input
                      id="routing_number"
                      name="routing_number"
                      required={!editingMethod}
                      placeholder={
                        editingMethod?.routing_last4 ? `****${editingMethod.routing_last4}` : undefined
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="swift_code">{t.swift}</Label>
                  <Input
                    id="swift_code"
                    name="swift_code"
                    defaultValue={editingMethod?.swift_code ?? ""}
                  />
                </div>
              </>
            ) : null}

            {(editingMethod?.type ?? methodType) === "paypal" ? (
              <div className="grid gap-2">
                <Label htmlFor="paypal_email">{t.paypalEmail}</Label>
                <Input
                  id="paypal_email"
                  name="paypal_email"
                  type="email"
                  required
                  defaultValue={editingMethod?.paypal_email ?? ""}
                />
              </div>
            ) : null}

            {(editingMethod?.type ?? methodType) === "alipay" ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="alipay_account">{t.alipayAccount}</Label>
                  <Input
                    id="alipay_account"
                    name="alipay_account"
                    defaultValue={editingMethod?.alipay_account ?? ""}
                    placeholder={locale === "zh" ? "13800138000 或 name@email.com（可选）" : "13800138000 or name@email.com (optional)"}
                  />
                  <p className="text-xs text-zinc-500">{t.alipayAccountHint}</p>
                </div>
                <PayoutQrUploadField
                  key={`${editingMethod?.id ?? "new"}-alipay`}
                  locale={locale}
                  existingUrl={editingMethod?.qr_code_url}
                />
              </>
            ) : null}

            {(editingMethod?.type ?? methodType) === "wechat" ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="wechat_account">{t.wechatAccount}</Label>
                  <Input
                    id="wechat_account"
                    name="wechat_account"
                    defaultValue={editingMethod?.wechat_account ?? ""}
                    placeholder={locale === "zh" ? "手机号或微信号（可选）" : "Phone number or WeChat ID (optional)"}
                  />
                  <p className="text-xs text-zinc-500">{t.wechatAccountHint}</p>
                </div>
                <PayoutQrUploadField
                  key={`${editingMethod?.id ?? "new"}-wechat`}
                  locale={locale}
                  existingUrl={editingMethod?.qr_code_url}
                />
              </>
            ) : null}

            {(editingMethod?.type ?? methodType) === "crypto" ? (
              <>
                <input type="hidden" name="crypto_asset" value={cryptoAsset} />
                <input type="hidden" name="crypto_network" value={cryptoNetwork} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="crypto_asset">{t.cryptoAsset}</Label>
                    <Select value={cryptoAsset} onValueChange={(value) => setCryptoAsset(value as CryptoAsset)}>
                      <SelectTrigger id="crypto_asset">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["USDT", "USDC", "BTC", "ETH"] as CryptoAsset[]).map((asset) => (
                          <SelectItem key={asset} value={asset}>
                            {asset}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="crypto_network">{t.cryptoNetwork}</Label>
                    <Select value={cryptoNetwork} onValueChange={(value) => setCryptoNetwork(value as CryptoNetwork)}>
                      <SelectTrigger id="crypto_network">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["TRC20", "ERC20", "POLYGON", "BITCOIN", "ETHEREUM"] as CryptoNetwork[]).map((network) => (
                          <SelectItem key={network} value={network}>
                            {network}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="wallet_address">{t.walletAddress}</Label>
                  <Input
                    id="wallet_address"
                    name="wallet_address"
                    required
                    defaultValue={editingMethod?.wallet_address ?? ""}
                    placeholder={t.walletHint}
                  />
                  <p className="text-xs text-zinc-500">{t.walletHint}</p>
                </div>
              </>
            ) : null}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_default"
                value="1"
                defaultChecked={editingMethod ? editingMethod.is_default : methods.length === 0}
              />
              {t.setDefault}
            </label>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingMethod ? (locale === "zh" ? "保存更改" : "Save changes") : t.saveMethod}
            </Button>

            {editingMethod ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {!editingMethod.is_default ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    disabled={isPending}
                    onClick={() => {
                      handleSetDefault(editingMethod);
                      closeMethodDialog();
                    }}
                  >
                    {t.setDefaultAction}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={isPending}
                  onClick={() => {
                    handleRemoveMethod(editingMethod);
                    closeMethodDialog();
                  }}
                >
                  {t.removeMethod}
                </Button>
              </div>
            ) : null}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 py-2 text-sm last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span className={cn("font-medium", highlight && "text-lg")}>{value}</span>
    </div>
  );
}

function methodTypeLabel(type: PayoutMethodType, locale: Locale) {
  const labels = copy[locale];
  if (type === "crypto") return labels.crypto;
  if (type === "paypal") return labels.paypal;
  if (type === "alipay") return labels.alipay;
  if (type === "wechat") return labels.wechat;
  return labels.bank;
}

function estimateArrivalLabel(type: PayoutMethodType, locale: Locale) {
  if (type === "crypto") return locale === "zh" ? "1–24 小时" : "1–24 hours";
  if (type === "paypal" || type === "alipay" || type === "wechat") {
    return locale === "zh" ? "即时" : "Instant";
  }
  return locale === "zh" ? "3–5 个工作日" : "3–5 business days";
}

function objectToFormData(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}
