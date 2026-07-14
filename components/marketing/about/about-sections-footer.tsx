import Image from "next/image";
import { Download } from "lucide-react";
import { aboutText } from "@/lib/marketing/about-copy";
import type { Locale } from "@/lib/i18n";

export function AboutContactPressSection({ locale }: { locale: Locale }) {
  const t = aboutText(locale);

  return (
    <section className="mt-16 grid gap-5 lg:grid-cols-2">
      <article id="contact" className="scroll-mt-24 rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-zinc-950">{t.contact.title}</h2>
        <p className="mt-3 text-sm leading-7 text-zinc-600">{t.contact.body}</p>
        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="font-medium text-zinc-950">{t.contact.business}</dt>
            <dd>
              <a href="mailto:business@vincis.app" className="text-violet-700 hover:underline">
                business@vincis.app
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-950">{t.contact.press}</dt>
            <dd>
              <a href="mailto:press@vincis.app" className="text-violet-700 hover:underline">
                press@vincis.app
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-950">{t.contact.support}</dt>
            <dd>
              <a href="mailto:support@vincis.app" className="text-violet-700 hover:underline">
                support@vincis.app
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-950">{t.contact.website}</dt>
            <dd>
              <a href="https://www.vincis.app" className="text-violet-700 hover:underline">
                www.vincis.app
              </a>
            </dd>
          </div>
        </dl>
        <a
          href="mailto:business@vincis.app"
          className="mt-8 inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          {t.contact.sendMessage}
        </a>
      </article>

      <article id="press" className="scroll-mt-24 rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-zinc-950">{t.press.title}</h2>
        <p className="mt-3 text-sm leading-7 text-zinc-600">{t.press.body}</p>
        <ul className="mt-5 grid grid-cols-2 gap-2 text-sm text-zinc-600">
          {t.press.items.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs leading-6 text-zinc-500">{t.press.note}</p>
        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
          <a
            href="mailto:press@vincis.app"
            className="inline-flex items-center gap-1 text-sm font-medium text-violet-700 hover:text-violet-900"
          >
            {t.press.downloadLink}
            <Download className="h-4 w-4" />
          </a>
          <div className="relative h-16 w-24 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-200">
            <Image src="/images/LOGO.png" alt="VINCIS press kit" fill className="object-contain p-2" sizes="96px" />
          </div>
        </div>
      </article>
    </section>
  );
}

export function AboutClosingSection({ locale }: { locale: Locale }) {
  const t = aboutText(locale);

  return (
    <section className="mt-16 rounded-2xl border border-zinc-200/80 bg-zinc-950 px-6 py-10 text-center sm:px-10">
      <p className="text-lg font-medium text-white/90">{t.closing.en}</p>
      <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-zinc-400">{t.closing.local}</p>
    </section>
  );
}
