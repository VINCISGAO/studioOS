import Image from "next/image";
import { cn } from "@/lib/utils";

const logoAssetVersion = "202607061900";
const mainLogoSrc = `/images/LOGO.png?v=${logoAssetVersion}`;
const wordmarkSrc = {
  black: `/images/logo-black.png?v=${logoAssetVersion}`,
  white: `/images/logo-white.png?v=${logoAssetVersion}`
};

export function BrandLogoMark({
  className,
  imageClassName,
  priority = false
}: {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl", className)}>
      <Image
        src={mainLogoSrc}
        alt="VINCIS"
        fill
        sizes="40px"
        priority={priority}
        className={cn("object-contain object-center", imageClassName)}
      />
    </span>
  );
}

export function BrandLogoLockup({
  tone = "black",
  contrastOn,
  className,
  markClassName,
  wordmarkClassName,
  priority = false
}: {
  tone?: keyof typeof wordmarkSrc;
  contrastOn?: "dark" | "light";
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  priority?: boolean;
}) {
  const wordmarkTone = contrastOn ? (contrastOn === "dark" ? "white" : "black") : tone;

  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center gap-3.5", className)} aria-label="VINCIS">
      <BrandLogoMark className={cn("h-10 w-10 rounded-[14px] shadow-sm", markClassName)} priority={priority} />
      <span className={cn("relative block h-[24px] w-[151px] shrink-0", wordmarkClassName)}>
        <Image
          src={wordmarkSrc[wordmarkTone]}
          alt=""
          fill
          sizes="151px"
          priority={priority}
          className="object-contain object-left"
        />
      </span>
    </span>
  );
}
