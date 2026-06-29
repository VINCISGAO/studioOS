"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n";
import {
  CREATOR_MIN_BUDGET_OPTIONS,
  creatorMinBudgetCustomOptionLabel,
  isPresetCreatorMinBudget,
  normalizeCreatorMinBudget,
  resolveCreatorMinBudgetMode
} from "@/lib/studioos/creator-price-preference";
import { cn } from "@/lib/utils";

const CUSTOM_SELECT_VALUE = "custom";

type CreatorMinBudgetFieldProps = {
  locale: Locale;
  label: string;
  hint: string;
  value: number;
  onChange?: (value: number) => void;
  /** When set, renders a hidden input for native form submit. */
  name?: string;
  id?: string;
};

export function CreatorMinBudgetField({
  locale,
  label,
  hint,
  value,
  onChange,
  name,
  id = "min_project_budget_usd"
}: CreatorMinBudgetFieldProps) {
  const normalized = normalizeCreatorMinBudget(value);
  const initialMode = resolveCreatorMinBudgetMode(normalized);

  const [mode, setMode] = useState<"preset" | "custom">(initialMode);
  const [preset, setPreset] = useState(isPresetCreatorMinBudget(normalized) ? normalized : 0);
  const [customAmount, setCustomAmount] = useState(
    initialMode === "custom" && normalized > 0 ? String(normalized) : ""
  );

  const effectiveValue = useMemo(() => {
    if (mode === "custom") {
      return normalizeCreatorMinBudget(customAmount);
    }
    return normalizeCreatorMinBudget(preset);
  }, [customAmount, mode, preset]);

  const selectValue = mode === "custom" ? CUSTOM_SELECT_VALUE : String(preset);

  function emit(next: number) {
    onChange?.(normalizeCreatorMinBudget(next));
  }

  function handlePresetChange(nextRaw: string) {
    if (nextRaw === CUSTOM_SELECT_VALUE) {
      setMode("custom");
      if (!customAmount && preset > 0 && isPresetCreatorMinBudget(preset)) {
        setCustomAmount(String(preset));
      }
      emit(customAmount ? normalizeCreatorMinBudget(customAmount) : 0);
      return;
    }

    const next = normalizeCreatorMinBudget(nextRaw);
    setMode("preset");
    setPreset(next);
    emit(next);
  }

  function handleCustomChange(nextRaw: string) {
    const digits = nextRaw.replace(/[^\d]/g, "");
    setCustomAmount(digits);
    emit(digits ? normalizeCreatorMinBudget(digits) : 0);
  }

  const copy =
    locale === "zh"
      ? { customPlaceholder: "输入最低预算，如 800", usd: "USD" }
      : { customPlaceholder: "Enter minimum, e.g. 800", usd: "USD" };

  return (
    <div className="grid gap-2">
      {name ? <input type="hidden" name={name} value={String(effectiveValue)} /> : null}

      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={selectValue}
        onChange={(e) => handlePresetChange(e.target.value)}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        {CREATOR_MIN_BUDGET_OPTIONS[locale].map((option) => (
          <option key={option.value} value={String(option.value)}>
            {option.label}
          </option>
        ))}
        <option value={CUSTOM_SELECT_VALUE}>{creatorMinBudgetCustomOptionLabel(locale)}</option>
      </select>

      {mode === "custom" ? (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
            $
          </span>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={customAmount}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder={copy.customPlaceholder}
            className="h-10 pl-7"
            aria-label={creatorMinBudgetCustomOptionLabel(locale)}
          />
        </div>
      ) : null}

      <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
    </div>
  );
}
