import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Shared max-width + horizontal rhythm for marketing pages. */
export function LandingShell({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-8 lg:px-12", className)}>
      {children}
    </div>
  );
}

export function LandingSection({
  children,
  className,
  id
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("landing-section", className)}>
      {children}
    </section>
  );
}

export function LandingEyebrow({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("landing-eyebrow", className)}>
      {children}
    </p>
  );
}

export function MarketingEyebrowPill({
  children,
  tone = "dark",
  className
}: {
  children: ReactNode;
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mx-auto inline-flex min-h-7 max-w-full items-center justify-center rounded-full border px-4 py-1 text-center text-[12px] font-semibold leading-snug tracking-[0.12em] sm:min-h-8 sm:max-w-[min(100%,36rem)] sm:px-5 sm:text-[13px]",
        tone === "dark"
          ? "border-white/[0.10] bg-white/[0.045] text-zinc-300"
          : "border-zinc-200/80 bg-white text-zinc-500",
        className
      )}
    >
      {children}
    </p>
  );
}

export const marketingSectionTitleClassName =
  "text-[2rem] font-semibold leading-tight tracking-[-0.045em] sm:text-[2.45rem]";

export function MarketingSectionTitle({
  children,
  className,
  as: Tag = "h2",
  tone = "dark"
}: {
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3";
  tone?: "dark" | "light";
}) {
  return (
    <Tag
      className={cn(
        marketingSectionTitleClassName,
        tone === "dark" ? "text-white" : "text-zinc-950",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function LandingHeadline({
  children,
  className,
  as: Tag = "h2"
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return <Tag className={cn("landing-headline", className)}>{children}</Tag>;
}

export function LandingLead({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("landing-lead", className)}>{children}</p>;
}

export function LandingRule({ className }: { className?: string }) {
  return <div className={cn("landing-rule", className)} aria-hidden />;
}

function isInternalPageHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

function LandingHref({
  href,
  className,
  children
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  if (isInternalPageHref(href)) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export function LandingPrimaryButton({
  href,
  children,
  className
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <LandingHref href={href} className={cn("landing-btn-primary", className)}>
      {children}
    </LandingHref>
  );
}

export function LandingGhostButton({
  href,
  children,
  className
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <LandingHref href={href} className={cn("landing-btn-ghost", className)}>
      {children}
    </LandingHref>
  );
}
