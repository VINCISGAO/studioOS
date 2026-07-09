import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { saveCreatorAiSupportConfigAction } from "@/app/studio/ai-support/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { creatorAiSupportConfigService } from "@/features/ai-support/ai-config.service";
import { resolveAiSupportCreatorId } from "@/features/ai-support/access";
import { getSessionUser } from "@/features/auth/session.service";
import { type SearchParams, withLocale } from "@/lib/i18n";

function jsonText(value: unknown, fallback: unknown) {
  return JSON.stringify(value ?? fallback, null, 2);
}

export default async function StudioAiSupportPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const user = await getSessionUser();
  if (!user) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const creatorId = await resolveAiSupportCreatorId(user, null);
  const config = await creatorAiSupportConfigService.getOrCreateConfig(creatorId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-sm font-medium text-violet-600">{locale === "zh" ? "AI 客服" : "AI support"}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
          {locale === "zh" ? "AI 接待设置" : "AI receptionist settings"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {locale === "zh"
            ? "这些配置已绑定数据库。当前阶段只保存配置和会话记录，暂不接真实大模型自动回复。"
            : "These settings are database-backed. This phase stores configuration and conversations without live model replies."}
        </p>
      </header>

      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-6">
          <form action={saveCreatorAiSupportConfigAction} className="space-y-5">
            <label className="flex items-center gap-3 text-sm font-medium text-zinc-700">
              <input name="is_enabled" type="checkbox" defaultChecked={config.isEnabled} className="h-4 w-4 rounded border-zinc-300" />
              {locale === "zh" ? "启用 AI 客服" : "Enable AI support"}
            </label>

            <div className="grid gap-2">
              <label htmlFor="ai_name" className="text-sm font-medium text-zinc-700">
                {locale === "zh" ? "AI 名称" : "AI name"}
              </label>
              <input
                id="ai_name"
                name="ai_name"
                defaultValue={config.aiName}
                className="h-11 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="persona" className="text-sm font-medium text-zinc-700">
                {locale === "zh" ? "AI 人设" : "AI persona"}
              </label>
              <textarea
                id="persona"
                name="persona"
                defaultValue={config.persona ?? ""}
                rows={4}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="welcome_message" className="text-sm font-medium text-zinc-700">
                {locale === "zh" ? "欢迎语" : "Welcome message"}
              </label>
              <textarea
                id="welcome_message"
                name="welcome_message"
                defaultValue={config.welcomeMessage ?? ""}
                rows={3}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="service_intro" className="text-sm font-medium text-zinc-700">
                {locale === "zh" ? "服务介绍" : "Service intro"}
              </label>
              <textarea
                id="service_intro"
                name="service_intro"
                defaultValue={config.serviceIntro ?? ""}
                rows={4}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <JsonField label={locale === "zh" ? "FAQ" : "FAQ"} name="faq_json" value={jsonText(config.faqJson, [])} />
              <JsonField
                label={locale === "zh" ? "报价规则" : "Pricing rules"}
                name="pricing_rules_json"
                value={jsonText(config.pricingRulesJson, {})}
              />
              <JsonField
                label={locale === "zh" ? "禁止回答内容" : "Blocked content"}
                name="blocked_content_json"
                value={jsonText(config.blockedContentJson, [])}
              />
              <JsonField
                label={locale === "zh" ? "人工接管规则" : "Handoff rules"}
                name="handoff_rules_json"
                value={jsonText(config.handoffRulesJson, {})}
              />
              <JsonField
                label={locale === "zh" ? "多语言配置" : "Multilingual config"}
                name="multilingual_json"
                value={jsonText(config.multilingualJson, {})}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="rounded-xl bg-zinc-900 hover:bg-zinc-800">
                {locale === "zh" ? "保存设置" : "Save settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function JsonField({ label, name, value }: { label: string; name: string; value: string }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={name} className="text-sm font-medium text-zinc-700">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        defaultValue={value}
        rows={7}
        className="rounded-xl border border-zinc-200 px-3 py-2 font-mono text-xs outline-none focus:border-zinc-400"
      />
    </div>
  );
}
