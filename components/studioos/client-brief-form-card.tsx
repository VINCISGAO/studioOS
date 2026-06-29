import type { Locale } from "@/lib/i18n";
import type { ConfirmedBriefField } from "@/lib/studioos/confirmed-brief";

const copy = {
  en: {
    title: "Official client brief",
    subtitle: "This is the confirmed requirement form from the brand.",
    formId: "Form ID"
  },
  zh: {
    title: "广告需求确认表",
    subtitle: "以下为品牌方确认后的正式需求表单。",
    formId: "表单编号"
  }
};

function groupFields(fields: ConfirmedBriefField[]) {
  const groups: Array<{ section: string; items: ConfirmedBriefField[] }> = [];
  for (const field of fields) {
    const last = groups[groups.length - 1];
    if (!last || last.section !== field.section) {
      groups.push({ section: field.section, items: [field] });
    } else {
      last.items.push(field);
    }
  }
  return groups;
}

export function ClientBriefFormCard({
  locale,
  fields,
  projectTitle,
  formId
}: {
  locale: Locale;
  fields: ConfirmedBriefField[];
  projectTitle?: string;
  formId?: string;
}) {
  const t = copy[locale];
  const sections = groupFields(fields);

  if (!fields.length) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{t.title}</p>
            {projectTitle ? (
              <p className="mt-1 text-base font-semibold text-zinc-950">{projectTitle}</p>
            ) : null}
            <p className="mt-1 text-xs leading-5 text-zinc-500">{t.subtitle}</p>
          </div>
          {formId ? (
            <div className="text-right text-xs text-zinc-500">
              <p>{t.formId}</p>
              <p className="mt-0.5 font-mono text-zinc-700">{formId}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="divide-y divide-zinc-100">
        {sections.map((section) => (
          <div key={section.section} className="px-4 py-4 sm:px-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{section.section}</h2>
            <dl className="mt-3 space-y-3">
              {section.items.map((item) => (
                <div
                  key={`${item.section}-${item.label}`}
                  className="grid gap-1 border-b border-zinc-50 pb-3 last:border-0 last:pb-0 sm:grid-cols-[minmax(6rem,34%)_1fr] sm:gap-3"
                >
                  <dt className="text-sm font-medium text-zinc-600">{item.label}</dt>
                  <dd className="whitespace-pre-wrap text-sm leading-6 text-zinc-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
