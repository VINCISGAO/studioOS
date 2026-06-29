"use client";

import { motion } from "framer-motion";
import { Lock, ShieldCheck, Unlock } from "lucide-react";
import { ChapterLabel, RevealSection, cinematicEase } from "@/components/marketing/cinematic/motion-primitives";
import { cinematicText } from "@/lib/marketing/cinematic-copy";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const icons = [Lock, ShieldCheck, Unlock];

export function CinematicEscrow({ locale }: { locale: Locale }) {
  const t = cinematicText("escrow", locale);

  return (
    <section className="bg-black py-32 sm:py-40">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <RevealSection>
          <ChapterLabel>{t.chapter}</ChapterLabel>
          <motion.h2
            variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: cinematicEase } } }}
            className="mt-6 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            {t.title}
          </motion.h2>
        </RevealSection>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {t.items.map((item, index) => {
            const Icon = icons[index] ?? ShieldCheck;
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.85, delay: index * 0.12, ease: cinematicEase }}
                className={cn(
                  "glass-cinematic rounded-2xl border border-white/10 p-8",
                  "transition hover:border-violet-500/30"
                )}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-6 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-500">{item.desc}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
