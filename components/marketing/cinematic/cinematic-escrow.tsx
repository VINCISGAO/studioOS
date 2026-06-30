"use client";

import { motion } from "framer-motion";
import { Lock, ShieldCheck, Unlock } from "lucide-react";
import { ChapterLabel, RevealSection, cinematicEase } from "@/components/marketing/cinematic/motion-primitives";
import { cinematicText } from "@/lib/marketing/cinematic-copy";
import type { Locale } from "@/lib/i18n";

const icons = [Lock, ShieldCheck, Unlock];

export function CinematicEscrow({ locale }: { locale: Locale }) {
  const t = cinematicText("escrow", locale);

  return (
    <section className="bg-[#050505] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <RevealSection>
          <ChapterLabel>{t.chapter}</ChapterLabel>
          <motion.h2
            variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: cinematicEase } } }}
            className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            {t.title}
          </motion.h2>
        </RevealSection>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {t.items.map((item, index) => {
            const Icon = icons[index] ?? ShieldCheck;
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.85, delay: index * 0.12, ease: cinematicEase }}
                whileHover={{ y: -8, scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                className="group relative overflow-hidden rounded-lg border border-white/10 bg-[#111315] p-6 transition-colors duration-300 hover:border-[#d8d2c4]/40 hover:bg-[#151515]"
              >
                <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#d8d2c4]/0 to-transparent transition duration-500 group-hover:via-[#d8d2c4]/60" />
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white/[0.055] text-[#d8d2c4] ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-[#d8d2c4]/12 group-hover:text-white group-hover:ring-[#d8d2c4]/35">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-white transition duration-300 group-hover:text-[#f4f0e7]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-zinc-500 transition duration-300 group-hover:text-zinc-300">
                  {item.desc}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
