import Image from "next/image";
import { HERO_BACKGROUND_SRC } from "@/lib/hero-video";

export { HERO_BACKGROUND_SRC, HERO_VIDEO_SRC } from "@/lib/hero-video";

export function HomeHeroVideo() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(68vh,640px)] overflow-hidden bg-[#09090b] relative"
      aria-hidden
    >
      <Image
        src={HERO_BACKGROUND_SRC}
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover object-center"
        style={{ filter: "saturate(1.02) contrast(1.06)" }}
      />

      <div className="absolute inset-0 bg-[#09090b]/15" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_75%_at_50%_42%,transparent_35%,rgba(9,9,11,0.72)_100%)]" />

      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#09090b]" />
    </div>
  );
}
