import type { ReactNode } from "react";
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
    <div className={cn("mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-12", className)}>
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
    <a href={href} className={cn("landing-btn-primary", className)}>
      {children}
    </a>
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
    <a href={href} className={cn("landing-btn-ghost", className)}>
      {children}
    </a>
  );
}
