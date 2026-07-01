import "server-only";

import { revalidatePath } from "next/cache";
import type { Locale } from "@/lib/i18n";
import { getCreatorDepositSnapshot } from "@/lib/studioos/deposit-service";
import { createCreatorNotification, findNotificationByProject } from "@/lib/notification-service";
import {
  clearCertificationMessageDismissal,
  findCertificationFormByCreator,
  issueCertificationFormPackage,
  linkCertificationFormNotification
} from "@/lib/studioos/certification-form-service";

const CERTIFICATION_FORM_PROJECT_KEY = "certification_onboarding";

function certificationMessageCopy(locale: Locale) {
  if (locale === "zh") {
    return {
      title: "认证保证金付款成功",
      body: "你的认证保证金已支付成功。请查看下方付款明细，系统正在同步你的认证服务商身份。",
      company_name: "StudioOS 系统",
      client_name: "StudioOS"
    };
  }
  return {
    title: "Certification deposit paid",
    body: "Your certification deposit was received. Review the payment summary below while we sync your verified studio status.",
    company_name: "StudioOS System",
    client_name: "StudioOS"
  };
}

function revalidateCertificationPaths() {
  revalidatePath("/studio");
  revalidatePath("/studio/messages");
  revalidatePath("/studio/deposit");
  revalidatePath("/admin/certification");
}

export async function ensureCertificationFormAndMessage(input: {
  creatorId: string;
  locale?: Locale;
  depositPaymentId?: string | null;
}) {
  const locale = input.locale ?? "zh";
  const snapshot = await getCreatorDepositSnapshot(input.creatorId);
  if (snapshot.deposit_status !== "paid") {
    return { ok: false as const, reason: "not-certified" as const };
  }

  const existingNotification = await findNotificationByProject(
    input.creatorId,
    CERTIFICATION_FORM_PROJECT_KEY,
    "certification_approved"
  );
  let form = await findCertificationFormByCreator(input.creatorId);

  if (form?.message_dismissed_at && !input.depositPaymentId) {
    return {
      ok: true as const,
      form,
      notification: null,
      created: false as const
    };
  }

  if (input.depositPaymentId) {
    await clearCertificationMessageDismissal(input.creatorId).catch(() => undefined);
    form = await findCertificationFormByCreator(input.creatorId);
  }

  if (form && existingNotification) {
    if (!form.notification_id) {
      form = await linkCertificationFormNotification(form.id, existingNotification.id);
    }
    return {
      ok: true as const,
      form,
      notification: existingNotification,
      created: false as const
    };
  }

  if (form && !existingNotification && !input.depositPaymentId) {
    return {
      ok: true as const,
      form,
      notification: null,
      created: false as const
    };
  }

  if (!form) {
    form = await issueCertificationFormPackage({
      creatorId: input.creatorId,
      locale,
      depositPaymentId: input.depositPaymentId ?? null
    });
  }

  if (!form) {
    return { ok: false as const, reason: "form-not-created" as const };
  }

  let notification = existingNotification;
  let created = false;

  if (!notification) {
    const copy = certificationMessageCopy(locale);
    notification = await createCreatorNotification({
      creator_id: input.creatorId,
      type: "certification_approved",
      title: copy.title,
      body: copy.body,
      project_id: CERTIFICATION_FORM_PROJECT_KEY,
      order_id: null,
      client_name: copy.client_name,
      company_name: copy.company_name,
      requirements_text: form.full_text
    });
    form = (await linkCertificationFormNotification(form.id, notification.id)) ?? form;
    created = true;
  } else if (!form.notification_id) {
    form = (await linkCertificationFormNotification(form.id, notification.id)) ?? form;
  }

  revalidateCertificationPaths();
  return {
    ok: true as const,
    form,
    notification,
    created
  };
}
