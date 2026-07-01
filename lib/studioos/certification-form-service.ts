import "server-only";

import { getCreatorById } from "@/lib/creator-service";
import { getCreatorDepositSnapshot } from "@/lib/studioos/deposit-service";
import type { ConfirmedBriefField } from "@/lib/studioos/confirmed-brief";
import type {
  CertificationFormStore,
  StoredCertificationForm
} from "@/lib/studioos/certification-form-types";
import {
  buildCertificationPaymentSummaryFields,
  buildCertificationPaymentSummaryText
} from "@/lib/studioos/certification-payment-summary";
import { dataStorePath, readDataJson, writeDataJson } from "@/lib/serverless-store-core";
import type { Locale } from "@/lib/i18n";
import type { DepositPayment } from "@/lib/studioos/deposit-types";
import type { PayoutMethodType } from "@/lib/studioos/withdrawal-types";

const STORE_PATH = dataStorePath("certification-form-store.json");

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyStore(): CertificationFormStore {
  return { forms: [] };
}

async function readStore(): Promise<CertificationFormStore> {
  const parsed = await readDataJson<CertificationFormStore>(STORE_PATH, emptyStore);
  parsed.forms ??= [];
  return parsed;
}

async function writeStore(store: CertificationFormStore) {
  await writeDataJson(STORE_PATH, store);
}

function resolveConfirmedPayment(
  snapshot: Awaited<ReturnType<typeof getCreatorDepositSnapshot>>,
  depositPaymentId: string | null | undefined
): DepositPayment | null {
  if (depositPaymentId) {
    return snapshot.payments.find((item) => item.id === depositPaymentId) ?? null;
  }
  return snapshot.payments.find((item) => item.status === "confirmed") ?? null;
}

export function buildCertificationFormId(creatorId: string, issuedAt = new Date()) {
  const suffix = creatorId.replace(/\D/g, "").slice(-4).padStart(4, "0");
  const year = issuedAt.getFullYear();
  return `CERT-${year}-${suffix || "0001"}`;
}

export function buildCertificationFormFields(
  locale: Locale,
  input: {
    formId: string;
    paidAt: string | null;
    depositAmount: number;
    paymentMethod: PayoutMethodType;
    paymentReference?: string;
  }
): ConfirmedBriefField[] {
  return buildCertificationPaymentSummaryFields(locale, {
    formId: input.formId,
    paidAt: input.paidAt,
    amountUsd: input.depositAmount,
    paymentMethod: input.paymentMethod,
    paymentReference: input.paymentReference
  });
}

export function buildCertificationFormFullText(fields: ConfirmedBriefField[]) {
  return buildCertificationPaymentSummaryText(fields);
}

async function resolveFormDisplayFields(form: StoredCertificationForm, locale: Locale) {
  const snapshot = await getCreatorDepositSnapshot(form.creator_id);
  const payment = resolveConfirmedPayment(snapshot, form.deposit_payment_id);
  return buildCertificationFormFields(locale, {
    formId: form.form_id,
    paidAt: snapshot.paid_at,
    depositAmount: snapshot.amount_usd,
    paymentMethod: form.payment_method ?? payment?.payment_method ?? "alipay",
    paymentReference: form.payment_reference ?? payment?.payment_reference
  });
}

export async function findCertificationFormByCreator(creatorId: string) {
  const store = await readStore();
  return store.forms.find((item) => item.creator_id === creatorId) ?? null;
}

export async function findCertificationFormByNotification(notificationId: string) {
  const store = await readStore();
  return store.forms.find((item) => item.notification_id === notificationId) ?? null;
}

export async function getCertificationFormForMessage(
  notificationId: string,
  creatorId: string,
  locale: Locale = "zh"
) {
  const form =
    (await findCertificationFormByNotification(notificationId)) ??
    (await findCertificationFormByCreator(creatorId));
  if (!form) {
    return null;
  }

  const fields = await resolveFormDisplayFields(form, locale);
  return {
    ...form,
    fields,
    full_text: buildCertificationFormFullText(fields)
  };
}

export async function listCertificationFormsForAdmin() {
  const store = await readStore();
  return [...store.forms].sort(
    (a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
  );
}

export async function markCertificationFormProfileCompleted(creatorId: string) {
  const store = await readStore();
  const form = store.forms.find((item) => item.creator_id === creatorId);
  if (!form || form.status === "profile_completed") {
    return form;
  }

  form.status = "profile_completed";
  form.submitted_at = new Date().toISOString();
  await writeStore(store);
  return form;
}

export async function linkCertificationFormNotification(formId: string, notificationId: string) {
  const store = await readStore();
  const form = store.forms.find((item) => item.id === formId);
  if (!form) return null;
  form.notification_id = notificationId;
  form.message_dismissed_at = null;
  await writeStore(store);
  return form;
}

export async function dismissCertificationMessage(creatorId: string, notificationId?: string) {
  const store = await readStore();
  const form = store.forms.find((item) => item.creator_id === creatorId);
  if (!form) {
    return null;
  }
  if (notificationId && form.notification_id && form.notification_id !== notificationId) {
    return form;
  }
  form.notification_id = null;
  form.message_dismissed_at = new Date().toISOString();
  await writeStore(store);
  return form;
}

export async function clearCertificationMessageDismissal(creatorId: string) {
  const store = await readStore();
  const form = store.forms.find((item) => item.creator_id === creatorId);
  if (!form) {
    return null;
  }
  form.message_dismissed_at = null;
  await writeStore(store);
  return form;
}

export async function issueCertificationFormPackage(input: {
  creatorId: string;
  locale?: Locale;
  depositPaymentId?: string | null;
  notificationId?: string | null;
}): Promise<StoredCertificationForm | null> {
  const existing = await findCertificationFormByCreator(input.creatorId);
  if (existing) {
    if (input.notificationId && !existing.notification_id) {
      return linkCertificationFormNotification(existing.id, input.notificationId);
    }
    return existing;
  }

  const creator = await getCreatorById(input.creatorId);
  if (!creator || creator.deposit_status !== "paid") {
    return null;
  }

  const locale = input.locale ?? "zh";
  const snapshot = await getCreatorDepositSnapshot(input.creatorId);
  const payment = resolveConfirmedPayment(snapshot, input.depositPaymentId);
  const issuedAt = new Date();
  const formId = buildCertificationFormId(input.creatorId, issuedAt);
  const fields = buildCertificationFormFields(locale, {
    formId,
    paidAt: snapshot.paid_at,
    depositAmount: snapshot.amount_usd,
    paymentMethod: payment?.payment_method ?? "alipay",
    paymentReference: payment?.payment_reference
  });
  const form: StoredCertificationForm = {
    id: createId("cert_form"),
    form_id: formId,
    creator_id: input.creatorId,
    notification_id: input.notificationId ?? null,
    deposit_payment_id: input.depositPaymentId ?? payment?.id ?? null,
    payment_method: payment?.payment_method ?? "alipay",
    payment_reference: payment?.payment_reference ?? null,
    status: creator.profile_completed_at ? "profile_completed" : "issued",
    fields,
    full_text: buildCertificationFormFullText(fields),
    issued_at: issuedAt.toISOString(),
    submitted_at: creator.profile_completed_at ? issuedAt.toISOString() : null
  };

  const store = await readStore();
  store.forms.unshift(form);
  await writeStore(store);
  return form;
}
