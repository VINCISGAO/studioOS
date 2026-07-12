export function coerceOptimizerText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value == null) return fallback.trim();

  if (Array.isArray(value)) {
    return value
      .map((item) => coerceOptimizerText(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    const row = value as Record<string, unknown>;
    const labeled = String(row.label ?? row.name ?? row.text ?? row.value ?? "").trim();
    if (labeled) return labeled;
  }

  const coerced = String(value).trim();
  return coerced === "[object Object]" ? fallback.trim() : coerced;
}

export function coerceBriefDocument(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value.trim()) return value.trim();

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const doc = value as Record<string, unknown>;
    const lines: string[] = [];

    for (const [key, entry] of Object.entries(doc)) {
      if (entry == null || entry === "") continue;
      if (Array.isArray(entry)) {
        lines.push(`${key}: ${entry.map((item) => coerceOptimizerText(item)).filter(Boolean).join(" · ")}`);
        continue;
      }
      if (typeof entry === "object") {
        const nested = Object.entries(entry as Record<string, unknown>)
          .map(([nestedKey, nestedValue]) => `${nestedKey}: ${coerceOptimizerText(nestedValue)}`)
          .filter((line) => !line.endsWith(": "));
        if (nested.length) {
          lines.push(`${key}:`);
          lines.push(...nested.map((line) => `  ${line}`));
        }
        continue;
      }
      lines.push(`${key}: ${coerceOptimizerText(entry)}`);
    }

    if (lines.length) return lines.join("\n");
  }

  const fallbackText = coerceOptimizerText(fallback);
  return fallbackText;
}

export function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        return coerceOptimizerText(row.label ?? row.name ?? row.metric ?? row.kpi ?? row.text ?? row.value);
      }
      return coerceOptimizerText(item);
    })
    .filter(Boolean);
}
