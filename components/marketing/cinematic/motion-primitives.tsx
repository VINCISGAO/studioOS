"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const cinematicEase = [0.16, 1, 0.3, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 48 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: cinematicEase } }
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } }
};

export const lineReveal: Variants = {
  hidden: { opacity: 0, y: "110%" },
  visible: { opacity: 1, y: 0, transition: { duration: 1, ease: cinematicEase } }
};

export function ChapterLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("landing-eyebrow", className)}>
      {children}
    </p>
  );
}

export function MaskRevealLine({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.span variants={lineReveal} className={cn("block overflow-hidden", className)}>
      <span className="block">{children}</span>
    </motion.span>
  );
}

export function RevealSection({
  children,
  className,
  delay = 0
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-12%" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1, delayChildren: delay } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCounter({
  value,
  locale,
  prefix = "",
  className
}: {
  value: number;
  locale: "en" | "zh";
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInViewOnce(ref);
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || reduce) {
      setDisplay(value);
      return;
    }

    const duration = 1400;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }, [inView, reduce, value]);

  const formatted =
    locale === "zh"
      ? `${prefix}${display.toLocaleString("zh-CN")}`
      : `${prefix}${display.toLocaleString("en-US")}`;

  return (
    <span ref={ref} className={className}>
      {formatted}
    </span>
  );
}

function useInViewOnce(ref: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return visible;
}

export function MouseGlow() {
  const reduce = useReducedMotion();
  const [pos, setPos] = useState({ x: 50, y: 40 });

  useEffect(() => {
    if (reduce) return;

    function onMove(event: MouseEvent) {
      setPos({
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100
      });
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduce]);

  if (reduce) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] opacity-40 mix-blend-screen"
      style={{
        background: `radial-gradient(600px circle at ${pos.x}% ${pos.y}%, rgba(139,92,246,0.18), transparent 55%)`
      }}
      aria-hidden
    />
  );
}
