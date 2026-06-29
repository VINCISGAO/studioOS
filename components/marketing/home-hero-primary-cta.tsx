import { ArrowRight } from "lucide-react";

export function HomeHeroPrimaryCta({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="relative z-30 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-medium text-zinc-950 transition hover:bg-zinc-100 sm:w-auto"
    >
      {label} <ArrowRight className="h-4 w-4" />
    </a>
  );
}
