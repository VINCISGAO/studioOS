"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addSystemMessage, consolidateInquiryThreads, getInquiry, resolveCanonicalInquiry, updateInquiryStatus } from "@/lib/chat-service";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getCurrentCreator, getCurrentCreatorId } from "@/lib/creator-session";
import { canAcceptCreatorOrders, countCompletedCreatorOrders } from "@/lib/studioos/deposit-guard";
import { withLocale, type Locale } from "@/lib/i18n";
import {
  acceptQuote,
  addDeliverable,
  approveOrderDelivery,
  createQuote,
  getActiveQuote,
  getActiveQuoteForPair,
  getOrder,
  listOrdersForCreator,
  markOrderPaid,
  requestOrderRevision
} from "@/lib/order-service";
import { getClientPreferredLocale } from "@/lib/studioos/client-locale";
import { translateForClient } from "@/lib/studioos/translate";
import { getStripe } from "@/lib/stripe";
import { syncBrandOrderPaid } from "@/lib/studioos/brand-checkout-service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { reviewPortalService } from "@/features/review/review-portal.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { getAppBaseUrl } from "@/lib/app-url";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return String(raw ?? "en") === "zh" ? "zh" : "en";
}

function brandPayReturnPath(order: { id: string; project_id?: string | null }, lang: Locale, query: string) {
  if (order.project_id) {
    return withLocale(`/brand/projects/${order.project_id}/checkout${query}`, lang);
  }
  return withLocale(`/dashboard/orders/${order.id}${query}`, lang);
}

function brandPaySuccessPath(order: { id: string; project_id?: string | null }, lang: Locale) {
  if (order.project_id) {
    return withLocale(`/brand/projects/${order.project_id}?tab=match`, lang);
  }
  return withLocale(`/dashboard/orders/${order.id}?paid=1`, lang);
}

export async function submitQuoteAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const inquiryId = String(formData.get("inquiry_id") ?? "");
  const amount = Number(formData.get("amount"));
  const summary = String(formData.get("summary") ?? "").trim();
  const deliveryDays = Number(formData.get("delivery_days"));

  const [creatorId, creator] = await Promise.all([getCurrentCreatorId(), getCurrentCreator()]);
  const inquiry = await getInquiry(inquiryId);

  if (!creatorId || !inquiry || inquiry.creator_id !== creatorId || !summary || !Number.isFinite(amount) || amount <= 0) {
    redirect(withLocale(`/proposal/${inquiryId}?error=quote`, lang));
  }

  if (!canAcceptCreatorOrders(creator, countCompletedCreatorOrders(await listOrdersForCreator(creatorId)))) {
    redirect(withLocale("/studio/deposit?error=deposit-required", lang));
  }

  const targetInquiry =
    (await consolidateInquiryThreads(inquiry.client_email, inquiry.creator_id)) ??
    (await resolveCanonicalInquiry(inquiry.client_email, inquiry.creator_id)) ??
    inquiry;

  const quote = await createQuote({
    inquiry_id: targetInquiry.id,
    creator_id: creatorId,
    client_email: targetInquiry.client_email,
    amount,
    summary,
    delivery_days: Number.isFinite(deliveryDays) && deliveryDays > 0 ? deliveryDays : 7
  });

  await updateInquiryStatus(targetInquiry.id, "quoted");
  await addSystemMessage(
    targetInquiry.id,
    lang === "zh"
      ? `Studio 已发送方案：$${quote.amount.toFixed(2)}，交付 ${quote.delivery_days} 天。${quote.summary}`
      : `Studio sent a proposal: $${quote.amount.toFixed(2)}, ${quote.delivery_days}-day delivery. ${quote.summary}`
  );

  redirect(withLocale(`/proposal/${targetInquiry.id}?quoted=1`, lang));
}

export async function acceptQuoteAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const inquiryId = String(formData.get("inquiry_id") ?? "");
  const quoteId = String(formData.get("quote_id") ?? "");
  const inquiry = await getInquiry(inquiryId);
  const quote =
    (inquiry ? await getActiveQuoteForPair(inquiry.client_email, inquiry.creator_id) : null) ??
    (await getActiveQuote(inquiryId));

  if (!inquiry || !quote) {
    redirect(withLocale(`/proposal/${inquiryId}?error=accept`, lang));
  }

  const quoteInquiry = await getInquiry(quote.inquiry_id);
  if (!quoteInquiry || quote.id !== quoteId) {
    redirect(withLocale(`/proposal/${inquiryId}?error=accept`, lang));
  }

  const clientEmail = await getCurrentClientEmail();
  if (clientEmail && quoteInquiry.client_email.toLowerCase() !== clientEmail.toLowerCase()) {
    redirect(withLocale(`/proposal/${inquiryId}?error=accept`, lang));
  }

  const order = await acceptQuote(quoteId, quoteInquiry);
  if (!order) {
    redirect(withLocale(`/proposal/${inquiryId}?error=accept`, lang));
  }

  await updateInquiryStatus(quoteInquiry.id, "escrow_pending");
  await addSystemMessage(
    quoteInquiry.id,
    lang === "zh"
      ? `Brand 已接受方案。订单 ${order.id} 已创建 — Project Contract 已生效。请付款进入制作。`
      : `Proposal accepted. Order ${order.id} created — Project Contract is active. Pay to start production.`
  );

  redirect(
    order.project_id
      ? withLocale(`/brand/projects/${order.project_id}/checkout`, lang)
      : withLocale(`/dashboard/orders/${order.id}?pay=1`, lang)
  );
}

export async function payOrderAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const order = await getOrder(orderId);

  if (!order || order.payment_status !== "unpaid" || order.status === "cancelled") {
    redirect(brandPayReturnPath({ id: orderId, project_id: order?.project_id }, lang, "?error=pay"));
  }

  const clientEmail = await getCurrentClientEmail();
  if (clientEmail && order.client_email !== clientEmail) {
    redirect(withLocale("/brand", lang));
  }

  if (process.env.STRIPE_SECRET_KEY) {
    const stripe = getStripe();
    const appUrl = getAppBaseUrl();
    const successPath = order.project_id
      ? `/brand/projects/${order.project_id}?tab=match&lang=${lang}`
      : `/dashboard/orders/${order.id}?paid=1&lang=${lang}`;
    const cancelPath = order.project_id
      ? `/brand/projects/${order.project_id}/checkout?pay=cancelled&lang=${lang}`
      : `/dashboard/orders/${order.id}?pay=cancelled&lang=${lang}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(order.amount * 100),
            product_data: {
              name: `VINCIS order ${order.id}`,
              description: order.title
            }
          }
        }
      ],
      metadata: { order_id: order.id },
      success_url: `${appUrl}${successPath}`,
      cancel_url: `${appUrl}${cancelPath}`
    });

    if (session.url) {
      redirect(session.url);
    }
  }

  const paid = await markOrderPaid(orderId);
  if (paid) {
    await syncBrandOrderPaid(paid);
  }
  await addSystemMessage(
    order.inquiry_id,
    lang === "zh"
      ? `Brand 已完成托管付款。Studio 可以开始制作 — 完成后在审片室查看视频。`
      : `Escrow payment complete. The studio can start production — review deliverables in the review room when ready.`
  );

  revalidatePath("/brand");
  if (order.project_id) {
    revalidatePath(`/brand/projects/${order.project_id}`);
    revalidatePath(`/brand/projects/${order.project_id}/checkout`);
  }

  redirect(brandPaySuccessPath(order, lang));
}

export async function submitDeliverableAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const fileUrl = String(formData.get("file_url") ?? "").trim();
  const thumbnailUrl = String(formData.get("thumbnail_url") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const creatorId = await getCurrentCreatorId();
  const order = await getOrder(orderId);

  if (!creatorId || !order || order.creator_id !== creatorId || !fileUrl) {
    redirect(withLocale(`/creator/orders/${orderId}?error=deliver`, lang));
  }

  const clientLocale = getClientPreferredLocale(order.client_email, order.client_locale);
  const translation = await translateForClient(notes, lang, clientLocale);

  const deliverable = await addDeliverable(orderId, {
    file_url: fileUrl,
    thumbnail_url: thumbnailUrl,
    notes,
    notes_for_client: translation.text,
    notes_client_locale: clientLocale
  });

  if (!deliverable) {
    redirect(withLocale(`/creator/orders/${orderId}?error=deliver`, lang));
  }

  await addSystemMessage(
    order.inquiry_id,
    lang === "zh"
      ? `创作者已提交交付 v${deliverable.version}，等待品牌方审核。`
      : `Creator submitted deliverable v${deliverable.version}. Waiting for brand review.`
  );

  redirect(withLocale(`/creator/orders/${orderId}?delivered=1`, lang));
}

function brandReviewPath(projectId: string | null | undefined, lang: Locale, query: string) {
  if (projectId) {
    return withLocale(`/brand/projects/${projectId}/review${query}`, lang);
  }
  return null;
}

function clientOwnsOrder(clientEmail: string | null, orderEmail: string) {
  if (!clientEmail) {
    return true;
  }
  return orderEmail.toLowerCase() === clientEmail.toLowerCase();
}

export async function approveDeliveryAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "").trim();
  const order = await getOrder(orderId);
  const targetProjectId = projectId || order?.project_id || null;

  if (!order) {
    redirect(withLocale("/dashboard", lang));
  }

  const clientEmail = await getCurrentClientEmail();
  if (!clientOwnsOrder(clientEmail, order.client_email)) {
    redirect(withLocale("/dashboard", lang));
  }

  if (hasDatabaseUrl() && targetProjectId) {
    const campaign = await campaignRepository.findByLegacyProjectId(targetProjectId);
    if (campaign && clientEmail) {
      const result = await reviewPortalService.approveForLegacyOrder({
        orderId,
        legacyProjectId: targetProjectId,
        brandEmail: clientEmail.toLowerCase(),
        locale: lang
      });

      if (result.ok) {
        revalidatePath("/studio");
        revalidatePath("/studio/messages");
        revalidatePath(`/brand/projects/${targetProjectId}`);
        revalidatePath(`/brand/projects/${targetProjectId}/review`);

        const completedPath = brandReviewPath(targetProjectId, lang, "?completed=1");
        redirect(completedPath ?? withLocale(`/orders/${orderId}?completed=1`, lang));
      }

      const reviewPath = brandReviewPath(targetProjectId, lang, "?error=approve");
      redirect(reviewPath ?? withLocale(`/orders/${orderId}?error=approve`, lang));
    }
  }

  const updated = await approveOrderDelivery(orderId);
  if (!updated) {
    const reviewPath = brandReviewPath(targetProjectId, lang, "?error=approve");
    redirect(reviewPath ?? withLocale(`/orders/${orderId}?error=approve`, lang));
  }

  revalidatePath("/studio");
  revalidatePath("/studio/messages");
  if (targetProjectId) {
    revalidatePath(`/brand/projects/${targetProjectId}`);
    revalidatePath(`/brand/projects/${targetProjectId}/review`);
  }

  await updateInquiryStatus(order.inquiry_id, "converted");
  await addSystemMessage(
    order.inquiry_id,
    lang === "zh"
      ? `品牌方已确认交付，托管款项已释放，订单 ${order.id} 完成。`
      : `Delivery approved. Escrow released. Order ${order.id} completed.`
  );

  const completedPath = brandReviewPath(targetProjectId, lang, "?completed=1");
  redirect(completedPath ?? withLocale(`/orders/${orderId}?completed=1`, lang));
}

export async function requestRevisionAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "").trim();
  const revisionNotes = String(formData.get("revision_notes") ?? "").trim();
  const order = await getOrder(orderId);
  const targetProjectId = projectId || order?.project_id || null;

  if (!order) {
    redirect(withLocale("/dashboard", lang));
  }

  const clientEmail = await getCurrentClientEmail();
  if (!clientOwnsOrder(clientEmail, order.client_email)) {
    redirect(withLocale("/dashboard", lang));
  }

  if (hasDatabaseUrl() && targetProjectId) {
    const campaign = await campaignRepository.findByLegacyProjectId(targetProjectId);
    if (campaign && clientEmail) {
      const result = await reviewPortalService.requestRevisionForLegacyOrder({
        orderId,
        legacyProjectId: targetProjectId,
        brandEmail: clientEmail.toLowerCase(),
        revisionNotes,
        locale: lang
      });

      if (result.ok) {
        revalidatePath("/studio");
        revalidatePath("/studio/messages");
        revalidatePath(`/brand/projects/${targetProjectId}`);
        revalidatePath(`/brand/projects/${targetProjectId}/review`);

        const revisionPath = brandReviewPath(targetProjectId, lang, "?revision=requested");
        redirect(revisionPath ?? withLocale(`/orders/${orderId}?revision=requested`, lang));
      }

      const reviewPath = brandReviewPath(targetProjectId, lang, "?error=revision");
      redirect(reviewPath ?? withLocale(`/orders/${orderId}?error=revision`, lang));
    }
  }

  const updated = await requestOrderRevision(orderId, revisionNotes);
  if (!updated) {
    const reviewPath = brandReviewPath(targetProjectId, lang, "?error=revision");
    redirect(reviewPath ?? withLocale(`/orders/${orderId}?error=revision`, lang));
  }

  revalidatePath("/studio");
  revalidatePath("/studio/messages");
  if (targetProjectId) {
    revalidatePath(`/brand/projects/${targetProjectId}`);
    revalidatePath(`/brand/projects/${targetProjectId}/review`);
  }

  if (revisionNotes) {
    await addSystemMessage(
      order.inquiry_id,
      lang === "zh" ? `品牌方申请修改：${revisionNotes}` : `Revision requested: ${revisionNotes}`
    );
  }

  const revisionPath = brandReviewPath(targetProjectId, lang, "?revision=requested");
  redirect(revisionPath ?? withLocale(`/orders/${orderId}?revision=requested`, lang));
}

export async function submitOrderRatingAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim();
  const order = await getOrder(orderId);

  if (!order || order.status !== "completed") {
    redirect(withLocale(`/orders/${orderId}?error=rating`, lang));
  }

  const clientEmail = await getCurrentClientEmail();
  if (clientEmail && order.client_email !== clientEmail) {
    redirect(withLocale("/dashboard", lang));
  }

  const { createOrderReview } = await import("@/lib/order-rating-service");
  const result = await createOrderReview({
    order_id: order.id,
    creator_id: order.creator_id,
    client_email: order.client_email,
    rating,
    comment
  });

  if (!result.ok) {
    redirect(withLocale(`/orders/${orderId}?completed=1&error=rating`, lang));
  }

  revalidatePath("/match");
  revalidatePath("/studio/profile");
  redirect(withLocale(`/orders/${orderId}?completed=1&rated=1`, lang));
}
