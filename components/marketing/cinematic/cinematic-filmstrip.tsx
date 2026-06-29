"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ChapterLabel, cinematicEase } from "@/components/marketing/cinematic/motion-primitives";
import { cinematicText } from "@/lib/marketing/cinematic-copy";
import type { Locale } from "@/lib/i18n";

export function CinematicFilmstrip({ locale }: { locale: Locale }) {
  const t = cinematicText("filmstrip", locale);
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  const x = useTransform(scrollYProgress, [0, 1], ["4%", "-58%"]);

  return (
    <section id="process" ref={containerRef} className="relative h-[240vh] bg-black">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <ChapterLabel>{t.chapter}</ChapterLabel>
          <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">{t.title}</h2>
        </div>

        <motion.div
          style={reduce ? undefined : { x }}
          className="mt-14 flex w-[220%] gap-0 px-5 sm:mt-16 sm:w-[200%] sm:px-8"
        >
          {t.steps.map((step, index) => (
            <div
              key={step.key}
              className="relative min-w-[72vw] shrink-0 border-y border-white/10 bg-zinc-950/80 sm:min-w-[42vw]"
            >
              <div className="absolute left-0 top-0 flex h-full w-8 flex-col justify-around py-4" aria-hidden>
                {Array.from({ length: 8 }).map((_, i) => (
                  <span key={i} className="mx-auto h-2 w-3 rounded-sm bg-zinc-800" />
                ))}
              </div>
              <div className="absolute right-0 top-0 flex h-full w-8 flex-col justify-around py-4" aria-hidden>
                {Array.from({ length: 8 }).map((_, i) => (
                  <span key={i} className="mx-auto h-2 w-3 rounded-sm bg-zinc-800" />
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.8, delay: index * 0.05, ease: cinematicEase }}
                className="px-12 py-14 sm:py-16"
              >
                <p className="font-mono text-xs text-violet-400/80">FRAME {String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{step.label}</h3>
                <p className="mt-4 max-w-sm text-base leading-7 text-zinc-500">{step.desc}</p>
              </motion.div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
