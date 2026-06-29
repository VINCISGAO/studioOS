"use client";

import { motion } from "framer-motion";
import { ChapterLabel, RevealSection, cinematicEase } from "@/components/marketing/cinematic/motion-primitives";
import { cinematicText } from "@/lib/marketing/cinematic-copy";
import type { Locale } from "@/lib/i18n";

const NODES = [
  { id: "la", x: 18, y: 42, label: "LA" },
  { id: "ldn", x: 48, y: 28, label: "LDN" },
  { id: "sh", x: 72, y: 38, label: "SH" },
  { id: "tk", x: 86, y: 58, label: "TKY" },
  { id: "sg", x: 62, y: 62, label: "SG" },
  { id: "ny", x: 32, y: 58, label: "NYC" }
];

const EDGES: [string, string][] = [
  ["la", "ldn"],
  ["ldn", "sh"],
  ["sh", "sg"],
  ["sg", "tk"],
  ["la", "ny"],
  ["ny", "ldn"],
  ["sh", "tk"]
];

export function CinematicNetwork({ locale }: { locale: Locale }) {
  const t = cinematicText("network", locale);
  const byId = Object.fromEntries(NODES.map((node) => [node.id, node]));

  return (
    <section className="relative overflow-hidden bg-[#050505] py-32 sm:py-44">
      <div className="pointer-events-none absolute inset-0 premium-grid-bg opacity-20" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <RevealSection className="mb-16 max-w-3xl">
          <ChapterLabel>{t.chapter}</ChapterLabel>
          <motion.p
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: cinematicEase } } }}
            className="mt-6 text-2xl text-zinc-500 sm:text-3xl"
          >
            {t.title}
          </motion.p>
          <motion.p
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: cinematicEase, delay: 0.08 } } }}
            className="mt-2 text-3xl font-semibold text-white sm:text-5xl"
          >
            {t.highlight}
          </motion.p>
          <motion.p
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: cinematicEase, delay: 0.16 } } }}
            className="mt-6 text-base leading-7 text-zinc-500"
          >
            {t.subtitle}
          </motion.p>
        </RevealSection>

        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-white/10 bg-black/60">
          <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
            {EDGES.map(([from, to], index) => {
              const a = byId[from];
              const b = byId[to];
              if (!a || !b) return null;
              return (
                <motion.line
                  key={`${from}-${to}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="rgba(167,139,250,0.35)"
                  strokeWidth="0.15"
                  strokeDasharray="1 1.5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.6, delay: index * 0.08, ease: cinematicEase }}
                />
              );
            })}

            {NODES.map((node, index) => (
              <g key={node.id}>
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r="1.8"
                  fill="rgba(139,92,246,0.25)"
                  animate={{ r: [1.8, 2.6, 1.8], opacity: [0.35, 0.7, 0.35] }}
                  transition={{ duration: 3 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r="0.65"
                  fill="#fff"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.07, type: "spring", stiffness: 260, damping: 18 }}
                />
                <text x={node.x} y={node.y - 2.8} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="2.2" fontFamily="monospace">
                  {node.label}
                </text>
              </g>
            ))}
          </svg>

          {/* Flow particles */}
          {EDGES.slice(0, 4).map(([from, to], index) => {
            const a = byId[from];
            const b = byId[to];
            if (!a || !b) return null;
            return (
              <motion.span
                key={`pulse-${from}-${to}`}
                className="absolute h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_12px_rgba(167,139,250,0.9)]"
                style={{ left: `${a.x}%`, top: `${a.y}%` }}
                animate={{ left: [`${a.x}%`, `${b.x}%`], top: [`${a.y}%`, `${b.y}%`], opacity: [0, 1, 0] }}
                transition={{ duration: 4 + index, repeat: Infinity, ease: "linear", delay: index * 0.9 }}
                aria-hidden
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
