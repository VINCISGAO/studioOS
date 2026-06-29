import { Inter, Instrument_Serif, Noto_Sans_SC } from "next/font/google";

export const landingSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-landing-sans",
  weight: ["400", "500", "600"]
});

/** Accent serif for hero highlights — editorial, not decorative. */
export const landingSerif = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-landing-serif",
  weight: "400",
  style: ["italic"]
});

/** CJK glyphs for zh UI — prevents tofu / garbled Han characters when Inter lacks coverage. */
export const landingCjk = Noto_Sans_SC({
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-landing-cjk",
  preload: false
});

export const landingFontClassName = `${landingSans.variable} ${landingSerif.variable} ${landingCjk.variable}`;
