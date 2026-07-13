"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BriefFieldLabel } from "@/components/studioos/brand-creative-brief/brand-creative-brief-ui";
import {
  isBriefScheduleDayAfter,
  isBriefScheduleDayBefore,
  parseBriefScheduleDate
} from "@/lib/studioos/brand-creative-brief-form";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDateValue(value: string, locale: "zh" | "en") {
  const date = parseBriefScheduleDate(value);
  if (!date) return locale === "zh" ? "选择日期" : "Select date";
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return locale === "zh" ? `${date.getFullYear()}/${month}/${day}` : `${date.getFullYear()}-${month}-${day}`;
}

export function BrandCreativeBriefDateField({
  locale,
  label,
  value,
  onChange,
  required = false,
  fieldId,
  minDate = null,
  maxDate = null,
  error = null
}: {
  locale: "zh" | "en";
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  fieldId?: string;
  minDate?: Date | null;
  maxDate?: Date | null;
  error?: string | null;
}) {
  const selected = parseBriefScheduleDate(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const [viewMonth, setViewMonth] = useState(() => {
    const date = selected ?? new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const monthLabel = useMemo(
    () =>
      locale === "zh"
        ? `${viewMonth.getFullYear()} 年 ${viewMonth.getMonth() + 1} 月`
        : viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [locale, viewMonth]
  );
  const days = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: firstDay + daysInMonth }, (_, index) =>
      index < firstDay ? null : new Date(year, month, index - firstDay + 1)
    );
  }, [viewMonth]);
  const selectedKey = selected ? formatDateValue(selected) : "";
  const weekdayLabels = locale === "zh" ? ["日", "一", "二", "三", "四", "五", "六"] : ["S", "M", "T", "W", "T", "F", "S"];

  function moveMonth(delta: number) {
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function openCalendar() {
    if (selected) {
      setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
    setOpen((current) => !current);
  }

  function isDayDisabled(day: Date) {
    if (minDate && isBriefScheduleDayBefore(day, minDate)) return true;
    if (maxDate && isBriefScheduleDayAfter(day, maxDate)) return true;
    return false;
  }

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;

    function updatePopupPosition() {
      const anchor = rootRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const popupWidth = Math.min(352, window.innerWidth - 32);
      const popupHeight = popupRef.current?.offsetHeight ?? 340;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openBelow = spaceBelow >= popupHeight || spaceBelow >= spaceAbove;

      let top = openBelow ? rect.bottom + 8 : rect.top - popupHeight - 8;
      let left = rect.left;

      top = Math.max(16, Math.min(top, window.innerHeight - popupHeight - 16));
      left = Math.max(16, Math.min(left, window.innerWidth - popupWidth - 16));

      setPopupStyle({
        position: "fixed",
        top,
        left,
        width: popupWidth,
        zIndex: 80
      });
    }

    updatePopupPosition();
    const frame = requestAnimationFrame(updatePopupPosition);
    window.addEventListener("resize", updatePopupPosition);
    window.addEventListener("scroll", updatePopupPosition, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePopupPosition);
      window.removeEventListener("scroll", updatePopupPosition, true);
    };
  }, [open, viewMonth, value]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const root = rootRef.current;
      const popup = popupRef.current;
      const target = event.target as Node;
      if (root?.contains(target) || popup?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} id={fieldId} className="scroll-mt-32 relative space-y-2 rounded-xl">
      <BriefFieldLabel label={label} required={required} />
      <button
        type="button"
        onClick={openCalendar}
        className={cn(
          "flex h-[3.25rem] w-full items-center justify-between rounded-xl border bg-white px-4 text-left text-base shadow-sm transition hover:bg-violet-50/20",
          error
            ? "border-red-300 text-red-700 hover:border-red-400"
            : "border-zinc-200 text-zinc-700 hover:border-violet-200"
        )}
      >
        <span>{displayDateValue(value, locale)}</span>
        <CalendarDays className="h-5 w-5 text-zinc-400" />
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <BriefDatePickerPopup
              popupRef={popupRef}
              popupStyle={popupStyle}
              locale={locale}
              monthLabel={monthLabel}
              weekdayLabels={weekdayLabels}
              days={days}
              selectedKey={selectedKey}
              moveMonth={moveMonth}
              isDayDisabled={isDayDisabled}
              onSelectDay={(nextValue) => {
                onChange(nextValue);
                setOpen(false);
              }}
            />,
            document.body
          )
        : null}
    </div>
  );
}

function BriefDatePickerPopup({
  popupRef,
  popupStyle,
  locale,
  monthLabel,
  weekdayLabels,
  days,
  selectedKey,
  moveMonth,
  isDayDisabled,
  onSelectDay
}: {
  popupRef: React.RefObject<HTMLDivElement | null>;
  popupStyle: React.CSSProperties;
  locale: "zh" | "en";
  monthLabel: string;
  weekdayLabels: string[];
  days: Array<Date | null>;
  selectedKey: string;
  moveMonth: (delta: number) => void;
  isDayDisabled: (day: Date) => boolean;
  onSelectDay: (value: string) => void;
}) {
  return (
    <div
      ref={popupRef}
      style={popupStyle}
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl shadow-zinc-900/15"
    >
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => moveMonth(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100"
          aria-label={locale === "zh" ? "上个月" : "Previous month"}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-base font-semibold text-zinc-900">{monthLabel}</p>
        <button
          type="button"
          onClick={() => moveMonth(1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100"
          aria-label={locale === "zh" ? "下个月" : "Next month"}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-sm font-semibold text-zinc-500">
        {weekdayLabels.map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {days.map((day, index) => {
          if (!day) {
            return <span key={`blank-${index}`} className="h-10" />;
          }
          const key = formatDateValue(day);
          const isSelected = key === selectedKey;
          const disabled = isDayDisabled(day);
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                onSelectDay(key);
              }}
              className={
                disabled
                  ? "flex h-10 cursor-not-allowed items-center justify-center rounded-xl text-base font-medium text-zinc-300"
                  : isSelected
                    ? "flex h-10 items-center justify-center rounded-xl bg-violet-600 text-base font-semibold text-white shadow-lg shadow-violet-600/25"
                    : "flex h-10 items-center justify-center rounded-xl text-base font-medium text-zinc-700 hover:bg-violet-50 hover:text-violet-700"
              }
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
