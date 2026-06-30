import Link from "next/link";

function isInternalPageHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

export function HomeHeroPrimaryCta({ href, label }: { href: string; label: string }) {
  const className =
    "relative z-30 inline-flex h-11 w-full items-center justify-center rounded-lg bg-white px-6 text-sm font-medium text-zinc-950 transition hover:bg-zinc-100 sm:w-auto";

  if (isInternalPageHref(href)) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <a href={href} className={className}>
      {label}
    </a>
  );
}
