import Image from "next/image";
import { HERO_BACKGROUND_SRC } from "@/lib/hero-video";

export function LoginBackgroundVideo() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#09090b] relative" aria-hidden>
      <Image
        src={HERO_BACKGROUND_SRC}
        alt=""
        fill
        priority
        sizes="100vw"
        className="scale-105 object-cover object-center opacity-[0.38]"
        style={{ filter: "saturate(0.9) contrast(1.05) blur(1px)" }}
      />

      <div className="absolute inset-0 bg-[#09090b]/78" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_40%,rgba(9,9,11,0.15)_0%,rgba(9,9,11,0.95)_100%)]" />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 0%, rgba(255,255,255,0.05), transparent 55%), radial-gradient(ellipse 30% 25% at 80% 90%, rgba(59,130,246,0.06), transparent 50%)"
        }}
      />
    </div>
  );
}
