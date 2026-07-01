"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { StoredOrder } from "@/lib/order-types";
import {
  brandPaymentDeadlinePolicyCopy,
  formatBrandPaymentDeadlineRemaining,
  isBrandPaymentDeadlineExpired
} from "@/lib/studioos/brand-payment-deadline";
import { cn } from "@/lib/utils";

export function BrandPaymentDeadlineNotice({
  locale,
  order,
  className
}: {
  locale: Locale;
  order: Pick<StoredOrder, "created_at">;
  className?: string;
}) {
  const copy = brandPaymentDeadlinePolicyCopy(locale);
  const [remaining, setRemaining] = useState(() => formatBrandPaymentDeadlineRemaining(order, locale));
  const expired = isBrandPaymentDeadlineExpired(order);

  useEffect(() => {
    setRemaining(formatBrandPaymentDeadlineRemaining(order, locale));
    const timer = window.setInterval(() => {
      setRemaining(formatBrandPaymentDeadlineRemaining(order, locale));
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [locale, order.created_at]);

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-4 sm:px-5",
        expired ? "border-red-200 bg-red-50/80" : "border-amber-200 bg-amber-50/80",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Clock3 className={cn("mt-0.5 h-5 w-5 shrink-0", expired ? "text-red-700" : "text-amber-700")} />
        <div>
          <p className={cn("text-sm font-semibold", expired ? "text-red-900" : "text-amber-950")}>{copy.title}</p>
          <p className={cn("mt-1 text-sm leading-relaxed", expired ? "text-red-800/90" : "text-amber-900/90")}>
            {copy.body}
          </p>
          <p className={cn("mt-2 text-sm font-medium", expired ? "text-red-700" : "text-amber-800")}>
            {copy.countdown(remaining)}
          </p>
        </div>
      </div>
    </div>
  );
}
