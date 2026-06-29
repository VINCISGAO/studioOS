import type {
  CreativePerformanceRecord,
  HookType,
  StoredCreativeInsight
} from "@/lib/studioos/creative-performance-types";

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function hookLabel(type: HookType, locale: "en" | "zh") {
  const map: Record<HookType, { en: string; zh: string }> = {
    first_person: { en: "first-person opener", zh: "第一人称开场" },
    product_macro: { en: "product macro opener", zh: "产品特写开场" },
    question: { en: "question hook", zh: "提问式开场" },
    ugc_handheld: { en: "handheld UGC", zh: "手持 UGC" },
    voiceover: { en: "voiceover-led", zh: "旁白主导" }
  };
  return map[type][locale];
}

export function generateInsightsForOrg(
  orgId: string,
  records: CreativePerformanceRecord[]
): StoredCreativeInsight[] {
  if (!records.length) {
    return [];
  }

  const insights: StoredCreativeInsight[] = [];
  const baselineCtr = median(records.map((item) => item.metrics.ctr));
  const now = new Date().toISOString();

  const byHook = new Map<HookType, CreativePerformanceRecord[]>();
  for (const record of records) {
    const list = byHook.get(record.tags.hook_type) ?? [];
    list.push(record);
    byHook.set(record.tags.hook_type, list);
  }

  for (const [hookType, group] of byHook.entries()) {
    if (!group.length) continue;
    const avgCtr = group.reduce((sum, item) => sum + item.metrics.ctr, 0) / group.length;
    const lift = baselineCtr > 0 ? ((avgCtr - baselineCtr) / baselineCtr) * 100 : 0;
    if (lift < 10 && group.length < 2) continue;

    insights.push({
      id: `ins_${orgId}_hook_${hookType}`,
      org_id: orgId,
      category: "hook",
      pattern: hookType,
      title: {
        en: `${hookLabel(hookType, "en")} outperforms baseline`,
        zh: `${hookLabel(hookType, "zh")} 优于基线`
      },
      body: {
        en: `Across ${group.length} attributed ad(s), ${hookLabel(hookType, "en")} drove ${lift.toFixed(0)}% higher CTR vs your org baseline (${baselineCtr.toFixed(1)}%).`,
        zh: `在 ${group.length} 条已归因广告中，${hookLabel(hookType, "zh")} 的 CTR 比品牌基线（${baselineCtr.toFixed(1)}%）高 ${lift.toFixed(0)}%。`
      },
      lift_pct: Math.round(lift),
      sample_size: group.length,
      confidence: Math.min(0.95, 0.5 + group.length * 0.15),
      applies_to: { category: group[0]?.tags.category },
      generated_at: now
    });
  }

  const shortForm = records.filter((item) => item.tags.length_sec <= 15);
  const longForm = records.filter((item) => item.tags.length_sec > 15);
  if (shortForm.length && longForm.length) {
    const shortCompletion =
      shortForm.reduce((sum, item) => sum + item.metrics.completion_rate, 0) / shortForm.length;
    const longCompletion =
      longForm.reduce((sum, item) => sum + item.metrics.completion_rate, 0) / longForm.length;
    const lift =
      longCompletion > 0 ? ((shortCompletion - longCompletion) / longCompletion) * 100 : 0;

    if (Math.abs(lift) >= 10) {
      insights.push({
        id: `ins_${orgId}_length_short`,
        org_id: orgId,
        category: "length",
        pattern: "15s_or_less",
        title: {
          en: lift > 0 ? "15s cuts beat longer formats" : "Longer cuts retain better",
          zh: lift > 0 ? "15 秒短片完播更优" : "长版本留存更好"
        },
        body: {
          en: `15s-or-shorter variants show ${Math.abs(lift).toFixed(0)}% ${lift > 0 ? "higher" : "lower"} completion vs longer cuts in your attributed library.`,
          zh: `15 秒及更短版本比长版本完播率${lift > 0 ? "高" : "低"} ${Math.abs(lift).toFixed(0)}%。`
        },
        lift_pct: Math.round(Math.abs(lift)),
        sample_size: shortForm.length + longForm.length,
        confidence: 0.72,
        applies_to: {},
        generated_at: now
      });
    }
  }

  const byStudio = new Map<string, CreativePerformanceRecord[]>();
  for (const record of records) {
    const list = byStudio.get(record.tags.studio_id) ?? [];
    list.push(record);
    byStudio.set(record.tags.studio_id, list);
  }

  for (const [studioId, group] of byStudio.entries()) {
    const avgCtr = group.reduce((sum, item) => sum + item.metrics.ctr, 0) / group.length;
    const lift = baselineCtr > 0 ? ((avgCtr - baselineCtr) / baselineCtr) * 100 : 0;
    if (lift < 15) continue;

    insights.push({
      id: `ins_${orgId}_studio_${studioId}`,
      org_id: orgId,
      category: "studio",
      pattern: studioId,
      title: {
        en: "Studio performance signal for matching",
        zh: "Studio 匹配表现信号"
      },
      body: {
        en: `Studio ${studioId} averaged ${avgCtr.toFixed(1)}% CTR — ${lift.toFixed(0)}% above your baseline. Consider for similar briefs.`,
        zh: `Studio ${studioId} 平均 CTR ${avgCtr.toFixed(1)}%，高于基线 ${lift.toFixed(0)}%，建议在类似 Brief 中优先匹配。`
      },
      lift_pct: Math.round(lift),
      sample_size: group.length,
      confidence: Math.min(0.9, 0.55 + group.length * 0.12),
      applies_to: { category: group[0]?.tags.category },
      generated_at: now
    });
  }

  if (!insights.length) {
    const top = [...records].sort((a, b) => b.metrics.ctr - a.metrics.ctr)[0];
    insights.push({
      id: `ins_${orgId}_top`,
      org_id: orgId,
      category: "style",
      pattern: top.tags.style_presets.join("+"),
      title: {
        en: "Top attributed creative identified",
        zh: "已识别表现最佳归因创意"
      },
      body: {
        en: `"${top.name}" leads your library at ${top.metrics.ctr.toFixed(1)}% CTR. Reuse its hook and pacing in the next brief.`,
        zh: `"${top.name}" 以 ${top.metrics.ctr.toFixed(1)}% CTR 领先。建议在下个 Brief 复用其 Hook 与节奏。`
      },
      lift_pct: Math.round(
        baselineCtr > 0 ? ((top.metrics.ctr - baselineCtr) / baselineCtr) * 100 : 0
      ),
      sample_size: 1,
      confidence: 0.65,
      applies_to: { category: top.tags.category },
      generated_at: now
    });
  }

  return insights.sort((a, b) => b.lift_pct - a.lift_pct);
}

export function insightToQueryParams(insight: StoredCreativeInsight): Record<string, string> {
  const params: Record<string, string> = {};
  if (insight.category === "hook") {
    params.prefill_hook = insight.pattern;
  }
  if (insight.category === "length" && insight.pattern === "15s_or_less") {
    params.prefill_length = "15s";
  }
  if (insight.category === "style") {
    params.prefill_style = insight.pattern.split("+")[0] ?? "ugc";
  }
  return params;
}
