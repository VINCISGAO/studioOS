import Link from "next/link";
import { Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  setDefaultLanguageAction,
  toggleLanguageAction,
  upsertTranslationAction
} from "@/app/admin/languages/actions";
import { languageService } from "@/features/i18n/language.service";
import { getSessionUser } from "@/features/auth/session.service";
import { getLocale, type SearchParams } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Language Management",
    title: "Internationalization database",
    back: "Back to admin",
    languages: "Supported languages",
    translations: "Translation keys",
    newKey: "Create / update translation key",
    disabled: "Database is not configured.",
    default: "Default",
    enabled: "Enabled",
    disabledBadge: "Disabled",
    setDefault: "Set default",
    enable: "Enable",
    disable: "Disable",
    save: "Save translation"
  },
  zh: {
    eyebrow: "语言管理",
    title: "国际化语言数据库",
    back: "返回后台",
    languages: "支持语言",
    translations: "翻译 Key",
    newKey: "创建 / 更新翻译 Key",
    disabled: "数据库未配置。",
    default: "默认",
    enabled: "已启用",
    disabledBadge: "已禁用",
    setDefault: "设为默认",
    enable: "启用",
    disable: "禁用",
    save: "保存翻译"
  }
};

export default async function AdminLanguagesPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = getLocale(await searchParams);
  const t = copy[locale];
  const user = await getSessionUser();
  const enabled = languageService.isEnabled();
  const [languages, keys] =
    enabled && user
      ? await Promise.all([
          languageService.listLanguages({ includeDisabled: true }),
          languageService.listTranslationKeys({ limit: 30 })
        ])
      : [[], []];
  const editableLanguages = languages.filter((item) => item.isEnabled);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{t.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t.title}</h1>
        </div>
        <Link href="/admin" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
          {t.back}
        </Link>
      </div>

      {!enabled ? (
        <Card className="mt-8 border-zinc-200/80 shadow-none">
          <CardContent className="p-6 text-sm text-zinc-500">{t.disabled}</CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <Card className="border-zinc-200/80 shadow-none">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-2">
                <Languages className="h-4 w-4 text-zinc-500" />
                <h2 className="font-semibold">{t.languages}</h2>
              </div>
              <div className="space-y-3">
                {languages.map((language) => (
                  <div key={language.code} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{language.nativeName}</p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {language.englishName} · {language.code}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        {language.isDefault ? <Badge>{t.default}</Badge> : null}
                        <Badge variant={language.isEnabled ? "secondary" : "outline"}>
                          {language.isEnabled ? t.enabled : t.disabledBadge}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      {!language.isDefault ? (
                        <form action={setDefaultLanguageAction}>
                          <input type="hidden" name="code" value={language.code} />
                          <Button type="submit" size="sm" variant="outline">
                            {t.setDefault}
                          </Button>
                        </form>
                      ) : null}
                      {!language.isDefault ? (
                        <form action={toggleLanguageAction}>
                          <input type="hidden" name="code" value={language.code} />
                          <input type="hidden" name="enabled" value={language.isEnabled ? "0" : "1"} />
                          <Button type="submit" size="sm" variant="outline">
                            {language.isEnabled ? t.disable : t.enable}
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-zinc-200/80 shadow-none">
              <CardContent className="p-6">
                <h2 className="font-semibold">{t.newKey}</h2>
                <form action={upsertTranslationAction} className="mt-5 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input name="namespace" placeholder="campaign" required />
                    <Input name="key" placeholder="create" required />
                  </div>
                  <Textarea name="description" placeholder="Displayed on campaign create buttons" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {editableLanguages.map((language) => (
                      <label key={language.code} className="space-y-1 text-sm">
                        <span className="text-zinc-500">
                          {language.englishName} ({language.code})
                        </span>
                        <Input name={`translation:${language.code}`} placeholder={`${language.code} value`} />
                      </label>
                    ))}
                  </div>
                  <Button type="submit">{t.save}</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 shadow-none">
              <CardContent className="p-6">
                <h2 className="font-semibold">{t.translations}</h2>
                <div className="mt-5 space-y-4">
                  {keys.map((item) => (
                    <div key={item.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-mono text-sm">
                            {item.namespace}.{item.key}
                          </p>
                          {item.description ? (
                            <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
                          ) : null}
                        </div>
                        <Badge variant="secondary">{item.translations.length} locales</Badge>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {item.translations.map((translation) => (
                          <p key={translation.id} className="truncate text-sm text-zinc-600">
                            <span className="font-medium">{translation.languageCode}:</span> {translation.value}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
