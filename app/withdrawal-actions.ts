"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCreatorId } from "@/lib/creator-session";
import type { Locale } from "@/lib/i18n";
import type { CryptoAsset, CryptoNetwork, PayoutMethod, PayoutMethodType } from "@/lib/studioos/withdrawal-types";
import {
  validateAlipayAccount,
  validateWalletAddress,
  validateWechatAccount
} from "@/lib/studioos/withdrawal-utils";

type WithdrawalServiceModule = typeof import("@/lib/studioos/withdrawal-service");

let withdrawalServicePromise: Promise<WithdrawalServiceModule> | null = null;

function getWithdrawalService() {
  withdrawalServicePromise ??= import("@/lib/studioos/withdrawal-service");
  return withdrawalServicePromise;
}

async function requireCreatorId(locale: Locale) {
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return {
      ok: false as const,
      error: locale === "zh" ? "请先以 Studio 身份登录" : "Sign in as a studio account"
    };
  }
  return { ok: true as const, creatorId };
}

function normalizeLocale(raw: FormDataEntryValue | null): Locale {
  return raw === "zh" ? "zh" : "en";
}

function revalidateIncome() {
  revalidatePath("/studio/income", "page");
  revalidatePath("/studio", "page");
}

function qrUploadErrorMessage(error: string, locale: Locale) {
  if (locale === "zh") {
    if (error.includes("5MB")) return "收款码图片不能超过 5MB";
    if (error.includes("JPEG")) return "仅支持 JPEG、PNG、WebP 格式";
    if (error.includes("Empty")) return "请选择收款码图片";
    return "收款码上传失败";
  }
  return error;
}

async function resolveQrCodeUrl(
  creatorId: string,
  formData: FormData,
  locale: Locale
): Promise<{ ok: true; url?: string } | { ok: false; error: string }> {
  const file = formData.get("qr_code_file");
  if (file instanceof File && file.size > 0) {
    const { savePayoutQrUpload } = await import("@/lib/studioos/payout-qr-upload");
    const saved = await savePayoutQrUpload(creatorId, file);
    if (!saved.ok) {
      return { ok: false, error: qrUploadErrorMessage(saved.error, locale) };
    }
    return { ok: true, url: saved.url };
  }

  const existing = String(formData.get("existing_qr_code_url") ?? "").trim();
  if (existing.startsWith("/api/payout-qr/")) {
    return { ok: true, url: existing };
  }

  return { ok: true, url: undefined };
}

export async function addPayoutMethodAction(formData: FormData) {
  const { addPayoutMethod } = await getWithdrawalService();
  const locale = normalizeLocale(formData.get("lang"));
  const auth = await requireCreatorId(locale);
  if (!auth.ok) {
    return auth;
  }
  const creatorId = auth.creatorId;
  const type = String(formData.get("type") ?? "") as PayoutMethodType;
  const label = String(formData.get("label") ?? "").trim();
  const isDefault = formData.get("is_default") === "1";

  if (!label) {
    return { ok: false as const, error: locale === "zh" ? "请填写账户名称" : "Enter an account label" };
  }

  let method: PayoutMethod;

  if (type === "bank_wire") {
    const accountHolder = String(formData.get("account_holder") ?? "").trim();
    const bankName = String(formData.get("bank_name") ?? "").trim();
    const accountNumber = String(formData.get("account_number") ?? "").trim();
    const routingNumber = String(formData.get("routing_number") ?? "").trim();

    if (!accountHolder || !bankName || accountNumber.length < 4 || routingNumber.length < 4) {
      return {
        ok: false as const,
        error: locale === "zh" ? "请完整填写银行账户信息" : "Complete all bank account fields"
      };
    }

    method = await addPayoutMethod(creatorId, {
      type,
      label,
      is_default: isDefault,
      account_holder: accountHolder,
      bank_name: bankName,
      account_last4: accountNumber.slice(-4),
      routing_last4: routingNumber.slice(-4),
      swift_code: String(formData.get("swift_code") ?? "").trim() || undefined
    });
  } else if (type === "paypal") {
    const paypalEmail = String(formData.get("paypal_email") ?? "").trim();
    if (!paypalEmail.includes("@")) {
      return { ok: false as const, error: locale === "zh" ? "请输入有效 PayPal 邮箱" : "Enter a valid PayPal email" };
    }

    method = await addPayoutMethod(creatorId, {
      type,
      label,
      is_default: isDefault,
      paypal_email: paypalEmail
    });
  } else if (type === "alipay") {
    const alipayAccount = String(formData.get("alipay_account") ?? "").trim();
    const qr = await resolveQrCodeUrl(creatorId, formData, locale);
    if (!qr.ok) {
      return qr;
    }

    if (alipayAccount && !validateAlipayAccount(alipayAccount)) {
      return {
        ok: false as const,
        error: locale === "zh" ? "请输入有效支付宝账号（手机号或邮箱）" : "Enter a valid Alipay account (phone or email)"
      };
    }

    if (!alipayAccount && !qr.url) {
      return {
        ok: false as const,
        error: locale === "zh" ? "请填写支付宝账号或上传收款码" : "Enter an Alipay account or upload a QR code"
      };
    }

    method = await addPayoutMethod(creatorId, {
      type,
      label,
      is_default: isDefault,
      alipay_account: alipayAccount || undefined,
      qr_code_url: qr.url
    });
  } else if (type === "wechat") {
    const wechatAccount = String(formData.get("wechat_account") ?? "").trim();
    const qr = await resolveQrCodeUrl(creatorId, formData, locale);
    if (!qr.ok) {
      return qr;
    }

    if (wechatAccount && !validateWechatAccount(wechatAccount)) {
      return {
        ok: false as const,
        error: locale === "zh" ? "请输入有效微信账号（手机号或微信号）" : "Enter a valid WeChat account (phone or WeChat ID)"
      };
    }

    if (!wechatAccount && !qr.url) {
      return {
        ok: false as const,
        error: locale === "zh" ? "请填写微信账号或上传收款码" : "Enter a WeChat account or upload a QR code"
      };
    }

    method = await addPayoutMethod(creatorId, {
      type,
      label,
      is_default: isDefault,
      wechat_account: wechatAccount || undefined,
      qr_code_url: qr.url
    });
  } else if (type === "crypto") {
    const cryptoAsset = String(formData.get("crypto_asset") ?? "USDT") as CryptoAsset;
    const cryptoNetwork = String(formData.get("crypto_network") ?? "TRC20") as CryptoNetwork;
    const walletAddress = String(formData.get("wallet_address") ?? "").trim();

    if (!validateWalletAddress(cryptoAsset, cryptoNetwork, walletAddress)) {
      return {
        ok: false as const,
        error:
          locale === "zh"
            ? "钱包地址格式无效。TRC20 需以 T 开头，ERC20 需 0x 开头 42 位地址。"
            : "Invalid wallet address. TRC20 must start with T; ERC20 must be a 42-char 0x address."
      };
    }

    method = await addPayoutMethod(creatorId, {
      type,
      label,
      is_default: isDefault,
      crypto_asset: cryptoAsset,
      crypto_network: cryptoNetwork,
      wallet_address: walletAddress
    });
  } else {
    return { ok: false as const, error: locale === "zh" ? "请选择收款方式" : "Select a payout method type" };
  }

  revalidateIncome();
  return { ok: true as const, method };
}

export async function deletePayoutMethodAction(formData: FormData) {
  const { deletePayoutMethod } = await getWithdrawalService();
  const locale = normalizeLocale(formData.get("lang"));
  const auth = await requireCreatorId(locale);
  if (!auth.ok) {
    return auth;
  }

  const methodId = String(formData.get("payout_method_id") ?? "");
  const result = await deletePayoutMethod(auth.creatorId, methodId);

  if (!result.ok) {
    return {
      ok: false as const,
      error:
        result.code === "IN_USE"
          ? locale === "zh"
            ? "该收款方式有进行中的提现，无法删除"
            : "This payout method has an active withdrawal"
          : locale === "zh"
            ? "收款方式不存在"
            : "Payout method not found"
    };
  }

  revalidateIncome();
  return { ok: true as const };
}

export async function setDefaultPayoutMethodAction(formData: FormData) {
  const { setDefaultPayoutMethod } = await getWithdrawalService();
  const locale = normalizeLocale(formData.get("lang"));
  const auth = await requireCreatorId(locale);
  if (!auth.ok) {
    return auth;
  }

  const methodId = String(formData.get("payout_method_id") ?? "");
  const result = await setDefaultPayoutMethod(auth.creatorId, methodId);

  if (!result.ok) {
    return { ok: false as const, error: locale === "zh" ? "收款方式不存在" : "Payout method not found" };
  }

  revalidateIncome();
  return { ok: true as const, method: result.method };
}

export async function updatePayoutMethodAction(formData: FormData) {
  const { updatePayoutMethod } = await getWithdrawalService();
  const locale = normalizeLocale(formData.get("lang"));
  const auth = await requireCreatorId(locale);
  if (!auth.ok) {
    return auth;
  }

  const methodId = String(formData.get("payout_method_id") ?? "");
  if (!methodId) {
    return { ok: false as const, error: locale === "zh" ? "收款方式不存在" : "Payout method not found" };
  }

  const label = String(formData.get("label") ?? "").trim();
  const isDefault = formData.get("is_default") === "1";
  const type = String(formData.get("type") ?? "") as PayoutMethodType;

  if (!label) {
    return { ok: false as const, error: locale === "zh" ? "请填写账户名称" : "Enter an account label" };
  }

  if (type === "bank_wire") {
    const accountHolder = String(formData.get("account_holder") ?? "").trim();
    const bankName = String(formData.get("bank_name") ?? "").trim();
    const accountNumber = String(formData.get("account_number") ?? "").trim();
    const routingNumber = String(formData.get("routing_number") ?? "").trim();

    if (!accountHolder || !bankName) {
      return {
        ok: false as const,
        error: locale === "zh" ? "请填写开户名和银行名称" : "Enter account holder and bank name"
      };
    }

    if (accountNumber && accountNumber.length < 4) {
      return {
        ok: false as const,
        error: locale === "zh" ? "银行账号至少 4 位" : "Account number must be at least 4 digits"
      };
    }

    if (routingNumber && routingNumber.length < 4) {
      return {
        ok: false as const,
        error: locale === "zh" ? "Routing 至少 4 位" : "Routing number must be at least 4 characters"
      };
    }

    const result = await updatePayoutMethod(auth.creatorId, methodId, {
      label,
      is_default: isDefault,
      account_holder: accountHolder,
      bank_name: bankName,
      account_number: accountNumber || undefined,
      routing_number: routingNumber || undefined,
      swift_code: String(formData.get("swift_code") ?? "").trim()
    });

    if (!result.ok) {
      return { ok: false as const, error: locale === "zh" ? "收款方式不存在" : "Payout method not found" };
    }

    revalidateIncome();
    return { ok: true as const, method: result.method };
  }

  if (type === "paypal") {
    const paypalEmail = String(formData.get("paypal_email") ?? "").trim();
    if (!paypalEmail.includes("@")) {
      return { ok: false as const, error: locale === "zh" ? "请输入有效 PayPal 邮箱" : "Enter a valid PayPal email" };
    }

    const result = await updatePayoutMethod(auth.creatorId, methodId, {
      label,
      is_default: isDefault,
      paypal_email: paypalEmail
    });

    if (!result.ok) {
      return { ok: false as const, error: locale === "zh" ? "收款方式不存在" : "Payout method not found" };
    }

    revalidateIncome();
    return { ok: true as const, method: result.method };
  }

  if (type === "alipay") {
    const alipayAccount = String(formData.get("alipay_account") ?? "").trim();
    const qr = await resolveQrCodeUrl(auth.creatorId, formData, locale);
    if (!qr.ok) {
      return qr;
    }

    if (alipayAccount && !validateAlipayAccount(alipayAccount)) {
      return {
        ok: false as const,
        error: locale === "zh" ? "请输入有效支付宝账号（手机号或邮箱）" : "Enter a valid Alipay account (phone or email)"
      };
    }

    if (!alipayAccount && !qr.url) {
      return {
        ok: false as const,
        error: locale === "zh" ? "请填写支付宝账号或上传收款码" : "Enter an Alipay account or upload a QR code"
      };
    }

    const result = await updatePayoutMethod(auth.creatorId, methodId, {
      label,
      is_default: isDefault,
      alipay_account: alipayAccount,
      qr_code_url: qr.url
    });

    if (!result.ok) {
      return { ok: false as const, error: locale === "zh" ? "收款方式不存在" : "Payout method not found" };
    }

    revalidateIncome();
    return { ok: true as const, method: result.method };
  }

  if (type === "wechat") {
    const wechatAccount = String(formData.get("wechat_account") ?? "").trim();
    const qr = await resolveQrCodeUrl(auth.creatorId, formData, locale);
    if (!qr.ok) {
      return qr;
    }

    if (wechatAccount && !validateWechatAccount(wechatAccount)) {
      return {
        ok: false as const,
        error: locale === "zh" ? "请输入有效微信账号（手机号或微信号）" : "Enter a valid WeChat account (phone or WeChat ID)"
      };
    }

    if (!wechatAccount && !qr.url) {
      return {
        ok: false as const,
        error: locale === "zh" ? "请填写微信账号或上传收款码" : "Enter a WeChat account or upload a QR code"
      };
    }

    const result = await updatePayoutMethod(auth.creatorId, methodId, {
      label,
      is_default: isDefault,
      wechat_account: wechatAccount,
      qr_code_url: qr.url
    });

    if (!result.ok) {
      return { ok: false as const, error: locale === "zh" ? "收款方式不存在" : "Payout method not found" };
    }

    revalidateIncome();
    return { ok: true as const, method: result.method };
  }

  if (type === "crypto") {
    const cryptoAsset = String(formData.get("crypto_asset") ?? "USDT") as CryptoAsset;
    const cryptoNetwork = String(formData.get("crypto_network") ?? "TRC20") as CryptoNetwork;
    const walletAddress = String(formData.get("wallet_address") ?? "").trim();

    if (!validateWalletAddress(cryptoAsset, cryptoNetwork, walletAddress)) {
      return {
        ok: false as const,
        error:
          locale === "zh"
            ? "钱包地址格式无效。TRC20 需以 T 开头，ERC20 需 0x 开头 42 位地址。"
            : "Invalid wallet address. TRC20 must start with T; ERC20 must be a 42-char 0x address."
      };
    }

    const result = await updatePayoutMethod(auth.creatorId, methodId, {
      label,
      is_default: isDefault,
      crypto_asset: cryptoAsset,
      crypto_network: cryptoNetwork,
      wallet_address: walletAddress
    });

    if (!result.ok) {
      return { ok: false as const, error: locale === "zh" ? "收款方式不存在" : "Payout method not found" };
    }

    revalidateIncome();
    return { ok: true as const, method: result.method };
  }

  return { ok: false as const, error: locale === "zh" ? "无效的收款方式" : "Invalid payout method" };
}

export async function submitWithdrawalAction(formData: FormData) {
  const { createWithdrawal } = await getWithdrawalService();
  const locale = normalizeLocale(formData.get("lang"));
  const auth = await requireCreatorId(locale);
  if (!auth.ok) {
    return auth;
  }

  const payoutMethodId = String(formData.get("payout_method_id") ?? "");
  const amount = Number(formData.get("amount_usd"));

  if (!payoutMethodId || !Number.isFinite(amount)) {
    return { ok: false as const, error: locale === "zh" ? "请填写完整提现信息" : "Complete withdrawal details" };
  }

  const confirmed = formData.get("confirmed") === "1";
  if (!confirmed) {
    return { ok: false as const, error: locale === "zh" ? "请确认提现信息" : "Confirm withdrawal details" };
  }

  const result = await createWithdrawal(auth.creatorId, {
    payout_method_id: payoutMethodId,
    amount_usd: amount,
    locale
  });

  if (!result.ok) {
    return result;
  }

  revalidateIncome();
  return { ok: true as const, withdrawalId: result.withdrawal.id };
}

export async function cancelWithdrawalAction(formData: FormData) {
  const { cancelWithdrawal } = await getWithdrawalService();
  const locale = normalizeLocale(formData.get("lang"));
  const auth = await requireCreatorId(locale);
  if (!auth.ok) {
    return auth;
  }

  const withdrawalId = String(formData.get("withdrawal_id") ?? "");
  const result = await cancelWithdrawal(auth.creatorId, withdrawalId, locale);
  if (!result.ok) {
    return result;
  }

  revalidateIncome();
  return { ok: true as const };
}
