"use client";

import { useMemo, useState, useTransition } from "react";
import { generateCopilotAction } from "@/app/studioos-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/i18n";
import { copilotActions, type CopilotAction, type CopilotContext } from "@/lib/studioos/copilot";
import type { CopilotProjectOption } from "@/lib/studioos/copilot-context";
import { cn } from "@/lib/utils";
import { Copy, LoaderCircle, Sparkles, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ProductionCopilotPanelProps = {
  locale: Locale;
  projects?: CopilotProjectOption[];
  initialContext?: CopilotContext;
};

function contextFromForm(form: CopilotContext): CopilotContext {
  return {
    projectTitle: form.projectTitle?.trim() ?? "",
    brandName: form.brandName?.trim() ?? "",
    productUrl: form.productUrl?.trim() ?? "",
    campaignGoal: form.campaignGoal?.trim() ?? "",
    audience: form.audience?.trim() ?? "",
    style: form.style?.trim() ?? "",
    platform: form.platform?.trim() ?? "",
    requirements: form.requirements?.trim() ?? "",
    budgetRange: form.budgetRange?.trim() ?? ""
  };
}

function contextToFormData(ctx: CopilotContext, action: CopilotAction, locale: Locale) {
  const formData = new FormData();
  formData.set("action", action);
  formData.set("lang", locale);
  formData.set("project_title", ctx.projectTitle ?? "");
  formData.set("brand_name", ctx.brandName ?? "");
  formData.set("product_url", ctx.productUrl ?? "");
  formData.set("campaign_goal", ctx.campaignGoal ?? "");
  formData.set("audience", ctx.audience ?? "");
  formData.set("style", ctx.style ?? "");
  formData.set("platform", ctx.platform ?? "");
  formData.set("requirements", ctx.requirements ?? "");
  formData.set("budget_range", ctx.budgetRange ?? "");
  return formData;
}

export function ProductionCopilotPanel({
  locale,
  projects = [],
  initialContext = {}
}: ProductionCopilotPanelProps) {
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? "");
  const [form, setForm] = useState<CopilotContext>(() => ({
    ...initialContext,
    ...(projects[0]?.context ?? {})
  }));
  const [active, setActive] = useState<CopilotAction | null>(null);
  const [output, setOutput] = useState("");
  const [source, setSource] = useState<"openai" | "template" | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const labels = useMemo(
    () =>
      locale === "zh"
        ? {
            project: "选择项目",
            projectPlaceholder: "手动填写或从分配项目导入",
            title: "项目名称",
            brand: "品牌",
            product: "产品链接",
            goal: "Campaign 目标",
            audience: "目标受众",
            platform: "投放平台",
            style: "风格参考",
            requirements: "客户 Brief / 要求",
            hint: "先选项目或填写上方信息，再点下方工具生成。内容会基于这些字段，不是空模板。",
            output: "生成结果",
            copy: "复制",
            template: "演示模板",
            needContext: "请至少填写项目名称或 Campaign 目标。",
            failed: "生成失败，请重试。"
          }
        : {
            project: "Project",
            projectPlaceholder: "Manual entry or import from assigned work",
            title: "Project title",
            brand: "Brand",
            product: "Product URL",
            goal: "Campaign goal",
            audience: "Target audience",
            platform: "Platforms",
            style: "Style reference",
            requirements: "Client brief / requirements",
            hint: "Select a project or fill the fields above, then pick a tool below. Output uses your context—not a blank template.",
            output: "Output",
            copy: "Copy",
            template: "Demo template",
            needContext: "Add a project title or campaign goal first.",
            failed: "Generation failed. Try again."
          },
    [locale]
  );

  function updateField<K extends keyof CopilotContext>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function selectProject(id: string) {
    setSelectedId(id);
    if (!id) return;
    const option = projects.find((item) => item.id === id);
    if (option) {
      setForm(option.context);
    }
  }

  function run(action: CopilotAction) {
    const ctx = contextFromForm(form);
    if (!ctx.projectTitle && !ctx.campaignGoal && !ctx.requirements) {
      setError(labels.needContext);
      return;
    }

    setError("");
    setActive(action);
    startTransition(async () => {
      try {
        const result = await generateCopilotAction(contextToFormData(ctx, action, locale));
        setOutput(result.output);
        setSource(result.source);
      } catch {
        setError(labels.failed);
        setOutput("");
        setSource(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Wand2 className="h-4 w-4 shrink-0" />
        {labels.hint}
      </div>

      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          {projects.length ? (
            <div className="sm:col-span-2">
              <Label htmlFor="copilot-project">{labels.project}</Label>
              <select
                id="copilot-project"
                value={selectedId}
                onChange={(event) => selectProject(event.target.value)}
                className="mt-1.5 flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
              >
                <option value="">{labels.projectPlaceholder}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.label} · {project.brandName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <Label htmlFor="copilot-title">{labels.title}</Label>
            <Input
              id="copilot-title"
              value={form.projectTitle ?? ""}
              onChange={(event) => updateField("projectTitle", event.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="copilot-brand">{labels.brand}</Label>
            <Input
              id="copilot-brand"
              value={form.brandName ?? ""}
              onChange={(event) => updateField("brandName", event.target.value)}
              className="mt-1.5"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="copilot-product">{labels.product}</Label>
            <Input
              id="copilot-product"
              value={form.productUrl ?? ""}
              onChange={(event) => updateField("productUrl", event.target.value)}
              placeholder="https://"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="copilot-goal">{labels.goal}</Label>
            <Input
              id="copilot-goal"
              value={form.campaignGoal ?? ""}
              onChange={(event) => updateField("campaignGoal", event.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="copilot-audience">{labels.audience}</Label>
            <Input
              id="copilot-audience"
              value={form.audience ?? ""}
              onChange={(event) => updateField("audience", event.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="copilot-platform">{labels.platform}</Label>
            <Input
              id="copilot-platform"
              value={form.platform ?? ""}
              onChange={(event) => updateField("platform", event.target.value)}
              placeholder="TikTok, Meta, YouTube"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="copilot-style">{labels.style}</Label>
            <Input
              id="copilot-style"
              value={form.style ?? ""}
              onChange={(event) => updateField("style", event.target.value)}
              className="mt-1.5"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="copilot-requirements">{labels.requirements}</Label>
            <Textarea
              id="copilot-requirements"
              value={form.requirements ?? ""}
              onChange={(event) => updateField("requirements", event.target.value)}
              className="mt-1.5 min-h-[96px]"
            />
          </div>
        </CardContent>
      </Card>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        {copilotActions.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={pending}
            onClick={() => run(item.id)}
            className={cn(
              "rounded-xl border px-4 py-3 text-left transition hover:border-zinc-400 disabled:opacity-60",
              active === item.id && "border-zinc-900 bg-zinc-50"
            )}
          >
            <p className="text-sm font-medium">{item.label[locale]}</p>
            <p className="mt-1 text-xs text-zinc-500">{item.description[locale]}</p>
          </button>
        ))}
      </div>

      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {pending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {labels.output}
            </div>
            <div className="flex items-center gap-2">
              {source ? (
                <Badge variant={source === "openai" ? "success" : "secondary"}>
                  {source === "openai" ? "OpenAI" : labels.template}
                </Badge>
              ) : null}
              {output ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(output)}
                >
                  <Copy className="h-3.5 w-3.5" /> {labels.copy}
                </Button>
              ) : null}
            </div>
          </div>
          <Textarea
            readOnly
            value={output}
            placeholder={
              locale === "zh" ? "填写项目信息后，选择上方工具开始生成…" : "Fill project context, then pick a tool above…"
            }
            className="mt-4 min-h-[280px] font-mono text-xs leading-relaxed"
          />
        </CardContent>
      </Card>
    </div>
  );
}
