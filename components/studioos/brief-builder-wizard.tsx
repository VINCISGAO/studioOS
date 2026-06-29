"use client";

import { useState } from "react";
import { submitProjectAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Sparkles, Wand2 } from "lucide-react";

const campaignGoals = ["Sales", "Traffic", "Awareness", "App Install"] as const;
const styles = ["Apple", "Nike", "Tesla", "Luxury", "Minimal", "UGC", "Documentary"] as const;

const copy = {
  en: {
    steps: ["Product", "Goal", "Audience", "Style", "References"],
    productUrl: "Product URL",
    productHint: "AI analyzes your product page for category, visuals, and positioning.",
    analyzing: "Analyzing product…",
    analyzed: "Detected: consumer product · premium positioning",
    goal: "Campaign goal",
    audience: "Target audience",
    audiencePh: "e.g. US women 25–40, fitness-curious, TikTok native",
    style: "Creative style reference",
    references: "Reference videos",
    referencesPh: "Paste TikTok, YouTube, or ad library links (one per line)",
    generate: "Generate Creative Brief",
    back: "Back",
    next: "Continue",
    briefPreview: "Creative Brief (preview)",
    briefBody:
      "Launch a performance-focused short-form campaign aligned to brand DNA. Open with product hero, maintain premium pacing, end with clear CTA."
  },
  zh: {
    steps: ["产品", "目标", "受众", "风格", "参考"],
    productUrl: "产品链接",
    productHint: "AI 会自动分析产品页：品类、视觉与定位。",
    analyzing: "正在分析产品…",
    analyzed: "识别结果：消费品 · 高端定位",
    goal: "Campaign 目标",
    audience: "目标受众",
    audiencePh: "例如：美国 25–40 岁女性，健身兴趣，TikTok 原生用户",
    style: "创意风格参考",
    references: "参考视频",
    referencesPh: "粘贴 TikTok、YouTube 或广告库链接（每行一条）",
    generate: "生成 Creative Brief",
    back: "上一步",
    next: "继续",
    briefPreview: "Creative Brief（预览）",
    briefBody:
      "启动以转化为导向的短视频 Campaign，对齐品牌 DNA：产品特写开场、保持高级节奏、明确 CTA 收尾。"
  }
};

export function BriefBuilderWizard({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [step, setStep] = useState(0);
  const [productUrl, setProductUrl] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [goal, setGoal] = useState<(typeof campaignGoals)[number]>("Sales");
  const [audience, setAudience] = useState("");
  const [style, setStyle] = useState<(typeof styles)[number]>("Apple");
  const [references, setReferences] = useState("");

  function runAnalysis() {
    if (!productUrl.trim()) return;
    setAnalyzed(false);
    window.setTimeout(() => setAnalyzed(true), 700);
  }

  return (
    <div className="space-y-8">
      <ol className="flex flex-wrap gap-2">
        {t.steps.map((label, index) => (
          <li
            key={label}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              index === step ? "bg-zinc-900 text-white" : index < step ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-500"
            )}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="space-y-4">
          <Label htmlFor="product_url">{t.productUrl}</Label>
          <Input
            id="product_url"
            name="product_url"
            type="url"
            placeholder="https://"
            value={productUrl}
            onChange={(e) => {
              setProductUrl(e.target.value);
              setAnalyzed(false);
            }}
            onBlur={runAnalysis}
          />
          <p className="text-sm text-zinc-500">{t.productHint}</p>
          {productUrl && !analyzed ? (
            <p className="flex items-center gap-2 text-sm text-zinc-600">
              <Sparkles className="h-4 w-4 animate-pulse" /> {t.analyzing}
            </p>
          ) : null}
          {analyzed ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {t.analyzed}
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {campaignGoals.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setGoal(item)}
              className={cn(
                "rounded-xl border px-4 py-4 text-left text-sm font-medium transition",
                goal === item ? "border-zinc-900 bg-zinc-900 text-white" : "hover:border-zinc-400"
              )}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <Label htmlFor="audience">{t.audience}</Label>
          <Textarea
            id="audience"
            rows={4}
            placeholder={t.audiencePh}
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-wrap gap-2">
          {styles.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStyle(item)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                style === item ? "border-zinc-900 bg-zinc-900 text-white" : "hover:border-zinc-400"
              )}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="references">{t.references}</Label>
            <Textarea
              id="references"
              rows={4}
              placeholder={t.referencesPh}
              value={references}
              onChange={(e) => setReferences(e.target.value)}
            />
          </div>
          <div className="rounded-xl border bg-zinc-50 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Wand2 className="h-4 w-4" /> {t.briefPreview}
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{t.briefBody}</p>
            <ul className="mt-4 space-y-1 text-sm text-zinc-700">
              <li>Goal: {goal}</li>
              <li>Style: {style}</li>
              <li>Audience: {audience || "—"}</li>
            </ul>
          </div>
          <form action={submitProjectAction} className="space-y-3">
            <input type="hidden" name="lang" value={locale} />
            <input type="hidden" name="product_url" value={productUrl} />
            <input type="hidden" name="campaign_goal" value={goal} />
            <input type="hidden" name="brand_style" value={style} />
            <input type="hidden" name="reference_links" value={references} />
            <input type="hidden" name="category" value="Consumer" />
            <input type="hidden" name="target_platform" value="TikTok" />
            <input type="hidden" name="video_format" value="9:16" />
            <input type="hidden" name="video_count" value="1" />
            <input type="hidden" name="budget_range" value="$1,000-$2,500" />
            <input type="hidden" name="company_name" value="Brand Campaign" />
            <input type="hidden" name="email" value="brand@studioos.local" />
            <input
              type="hidden"
              name="notes"
              value={`Target audience: ${audience}\nBrief generated via StudioOS wizard.`}
            />
            <Button type="submit" size="lg" className="w-full rounded-full">
              {t.generate} <Sparkles className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : null}

      {step < 4 ? (
        <div className="flex justify-between gap-3">
          <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </Button>
          <Button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 0 && !productUrl.trim()}
          >
            {t.next} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
