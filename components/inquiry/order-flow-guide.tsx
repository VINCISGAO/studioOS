import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import type { StoredOrder, StoredQuote } from "@/lib/order-types";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type StepState = "done" | "current" | "upcoming";

type FlowStep = {
  id: string;
  label: string;
  hint: string;
  state: StepState;
};

function resolveBrandSteps(quote: StoredQuote | null, order: StoredOrder | null): FlowStep[] {
  const copy = {
    inquiry: { label: "发起询价", hint: "已从创作者主页提交预算和需求。" },
    chat: { label: "沟通细节", hint: "在下方聊天里确认数量、风格、交付时间。" },
    quote: { label: "收到报价", hint: "等创作者发送正式报价（金额 + 范围）。" },
    order: { label: "接受报价下单", hint: "满意后点「接受报价并下单」。" },
    pay: { label: "付款托管", hint: "付款后创作者开始制作，款项由平台托管。" },
    done: { label: "确认交付", hint: "收到成片后确认，托管款释放给创作者。" }
  };

  if (order?.status === "completed") {
    return [
      { id: "inquiry", ...copy.inquiry, state: "done" },
      { id: "chat", ...copy.chat, state: "done" },
      { id: "quote", ...copy.quote, state: "done" },
      { id: "order", ...copy.order, state: "done" },
      { id: "pay", ...copy.pay, state: "done" },
      { id: "done", ...copy.done, state: "done" }
    ];
  }

  if (order) {
    const payState: StepState = order.payment_status === "paid" ? "done" : "current";
    return [
      { id: "inquiry", ...copy.inquiry, state: "done" },
      { id: "chat", ...copy.chat, state: "done" },
      { id: "quote", ...copy.quote, state: "done" },
      { id: "order", ...copy.order, state: "done" },
      { id: "pay", ...copy.pay, state: payState },
      {
        id: "done",
        ...copy.done,
        state: order.payment_status === "paid" ? "current" : "upcoming"
      }
    ];
  }

  if (quote) {
    return [
      { id: "inquiry", ...copy.inquiry, state: "done" },
      { id: "chat", ...copy.chat, state: "done" },
      { id: "quote", ...copy.quote, state: "done" },
      { id: "order", ...copy.order, state: "current" },
      { id: "pay", ...copy.pay, state: "upcoming" },
      { id: "done", ...copy.done, state: "upcoming" }
    ];
  }

  return [
    { id: "inquiry", ...copy.inquiry, state: "done" },
    { id: "chat", ...copy.chat, state: "current" },
    { id: "quote", ...copy.quote, state: "upcoming" },
    { id: "order", ...copy.order, state: "upcoming" },
    { id: "pay", ...copy.pay, state: "upcoming" },
    { id: "done", ...copy.done, state: "upcoming" }
  ];
}

function resolveCreatorSteps(quote: StoredQuote | null, order: StoredOrder | null): FlowStep[] {
  const copy = {
    inquiry: { label: "收到询价", hint: "品牌方已发起需求。" },
    chat: { label: "沟通细节", hint: "在下方聊天确认范围和预期。" },
    quote: { label: "发送报价", hint: "谈好后填写金额、范围，点「发送报价」。" },
    order: { label: "品牌下单", hint: "等品牌方接受报价，系统自动创建订单。" },
    pay: { label: "品牌付款", hint: "付款后你才开始制作。" },
    done: { label: "提交交付", hint: "完成后在订单页上传交付文件。" }
  };

  if (order?.status === "completed") {
    return [
      { id: "inquiry", ...copy.inquiry, state: "done" },
      { id: "chat", ...copy.chat, state: "done" },
      { id: "quote", ...copy.quote, state: "done" },
      { id: "order", ...copy.order, state: "done" },
      { id: "pay", ...copy.pay, state: "done" },
      { id: "done", ...copy.done, state: "done" }
    ];
  }

  if (order) {
    return [
      { id: "inquiry", ...copy.inquiry, state: "done" },
      { id: "chat", ...copy.chat, state: "done" },
      { id: "quote", ...copy.quote, state: "done" },
      { id: "order", ...copy.order, state: "done" },
      { id: "pay", ...copy.pay, state: order.payment_status === "paid" ? "done" : "current" },
      { id: "done", ...copy.done, state: order.payment_status === "paid" ? "current" : "upcoming" }
    ];
  }

  if (quote) {
    return [
      { id: "inquiry", ...copy.inquiry, state: "done" },
      { id: "chat", ...copy.chat, state: "done" },
      { id: "quote", ...copy.quote, state: "done" },
      { id: "order", ...copy.order, state: "current" },
      { id: "pay", ...copy.pay, state: "upcoming" },
      { id: "done", ...copy.done, state: "upcoming" }
    ];
  }

  return [
    { id: "inquiry", ...copy.inquiry, state: "done" },
    { id: "chat", ...copy.chat, state: "done" },
    { id: "quote", ...copy.quote, state: "current" },
    { id: "order", ...copy.order, state: "upcoming" },
    { id: "pay", ...copy.pay, state: "upcoming" },
    { id: "done", ...copy.done, state: "upcoming" }
  ];
}

export function OrderFlowGuide({
  locale,
  viewerRole,
  quote,
  order
}: {
  locale: Locale;
  viewerRole: "brand" | "creator";
  quote: StoredQuote | null;
  order: StoredOrder | null;
}) {
  const title = locale === "zh" ? "下单流程" : "Order flow";
  const steps =
    viewerRole === "brand" ? resolveBrandSteps(quote, order) : resolveCreatorSteps(quote, order);
  const current = steps.find((step) => step.state === "current");

  return (
    <section className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">{title}</h2>
      {current ? (
        <p className="mt-2 text-base font-medium text-zinc-900">
          {locale === "zh" ? "当前步骤：" : "Current step: "}
          {current.label}
        </p>
      ) : null}
      {current ? <p className="mt-1 text-sm leading-6 text-zinc-600">{current.hint}</p> : null}

      <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={cn(
              "flex gap-3 rounded-xl border px-3 py-3 text-sm",
              step.state === "current" && "border-zinc-900 bg-white shadow-sm",
              step.state === "done" && "border-emerald-200 bg-emerald-50/60",
              step.state === "upcoming" && "border-zinc-200/80 bg-white/60 text-zinc-500"
            )}
          >
            <span className="mt-0.5 shrink-0">
              {step.state === "done" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : step.state === "current" ? (
                <CircleDot className="h-4 w-4 text-zinc-900" />
              ) : (
                <Circle className="h-4 w-4 text-zinc-300" />
              )}
            </span>
            <span>
              <span className="font-medium">
                {index + 1}. {step.label}
              </span>
              <span className="mt-0.5 block text-xs leading-5 opacity-80">{step.hint}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
